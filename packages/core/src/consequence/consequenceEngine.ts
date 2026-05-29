import {
  appendDebugEvents,
  appendValidationFailure,
  buildChoiceSelectedEvent,
  buildConsequenceAppliedEvent,
  buildFlagsChangedEvent,
  buildGoalUnlockedEvent,
} from "../debug/index.js";
import type { DebugEvent } from "../schemas/debugEvent.js";
import type { Consequence } from "../schemas/consequence.js";
import { safeParseConsequence } from "../schemas/consequence.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import { safeParseWorldSession, type WorldSession } from "../schemas/worldSession.js";

import { advanceSessionBeat } from "../story/advanceSessionBeat.js";
import { applyConsequenceToLedger } from "./applyConsequenceToLedger.js";
import { validateConsequencePreconditions } from "./validateConsequencePreconditions.js";

export type ApplyConsequenceEngineContext = {
  choiceId?: string;
  beatId?: string;
  choiceLabel?: string;
};

export type ApplyConsequenceEngineResult = {
  ok: boolean;
  errors: string[];
  session?: WorldSession;
  consequence?: Consequence;
};

function formatSchemaErrors(
  prefix: string,
  issues: { path: (string | number)[]; message: string }[],
) {
  return issues.map((issue) => `${prefix}: ${issue.path.join(".") || "<root>"}: ${issue.message}`);
}

function failureResult(
  session: WorldSession,
  errors: string[],
  metadata?: Record<string, unknown>,
): ApplyConsequenceEngineResult {
  return {
    ok: false,
    errors,
    session: appendValidationFailure(session, errors, metadata),
  };
}

/**
 * Central deterministic path for applying a consequence to session state.
 * Validates input consequence and post-state; no feature should mutate ledger outside this engine.
 */
export function applyConsequenceEngine(
  world: WorldDefinition,
  session: WorldSession,
  consequenceId: string,
  context?: ApplyConsequenceEngineContext,
): ApplyConsequenceEngineResult {
  const sessionValidation = safeParseWorldSession(session);
  if (!sessionValidation.success) {
    const errors = formatSchemaErrors("session", sessionValidation.error.issues);
    return {
      ok: false,
      errors,
      session: appendValidationFailure(session, errors, { consequenceId }),
    };
  }

  const validatedSession = sessionValidation.data;

  const rawConsequence = world.consequences.find((entry) => entry.id === consequenceId);
  if (!rawConsequence) {
    return failureResult(
      validatedSession,
      [`consequence-engine: consequence "${consequenceId}" not found in world "${world.id}"`],
      { consequenceId, choiceId: context?.choiceId },
    );
  }

  const consequenceValidation = safeParseConsequence(rawConsequence);
  if (!consequenceValidation.success) {
    return failureResult(
      validatedSession,
      formatSchemaErrors("consequence", consequenceValidation.error.issues),
      { consequenceId, choiceId: context?.choiceId },
    );
  }
  const consequence = consequenceValidation.data;

  const preconditionResult = validateConsequencePreconditions(
    world,
    validatedSession,
    consequence,
    context?.choiceId ? { choiceId: context.choiceId } : undefined,
  );
  if (!preconditionResult.ok) {
    return failureResult(validatedSession, preconditionResult.errors, {
      consequenceId,
      choiceId: context?.choiceId,
    });
  }

  const ledgerBefore = validatedSession.ledger;
  const nextTurn = validatedSession.turnNumber + 1;
  const ledger = applyConsequenceToLedger(ledgerBefore, consequence, nextTurn, {
    choiceId: context?.choiceId,
  });

  let nextSession: WorldSession = {
    ...validatedSession,
    turnNumber: nextTurn,
    ledger,
    choiceHistory: context?.choiceId
      ? [...validatedSession.choiceHistory, context.choiceId]
      : validatedSession.choiceHistory,
  };

  const beatAdvance = advanceSessionBeat(world, nextSession);
  nextSession = beatAdvance.session;

  const traceEvents: DebugEvent[] = [];

  if (context?.choiceId) {
    traceEvents.push(
      buildChoiceSelectedEvent({
        turnNumber: nextTurn,
        choiceId: context.choiceId,
        choiceLabel: context.choiceLabel,
        beatId: context.beatId,
      }),
    );
  }

  traceEvents.push(
    buildConsequenceAppliedEvent({
      turnNumber: nextTurn,
      consequenceId: consequence.id,
      choiceId: context?.choiceId,
      visibleChanges: consequence.visibleChanges,
    }),
  );

  const flagsChanged = buildFlagsChangedEvent({
    turnNumber: nextTurn,
    consequenceId: consequence.id,
    before: ledgerBefore,
    after: ledger,
  });
  if (flagsChanged) {
    traceEvents.push(flagsChanged);
  }

  for (const goalId of consequence.unlockGoals ?? []) {
    if (ledgerBefore.unlockedGoals.includes(goalId)) {
      continue;
    }
    traceEvents.push(
      buildGoalUnlockedEvent({
        turnNumber: nextTurn,
        goalId,
        consequenceId: consequence.id,
      }),
    );
  }

  const debugResult = appendDebugEvents(nextSession, traceEvents);
  if (typeof debugResult === "object" && "errors" in debugResult) {
    return failureResult(validatedSession, debugResult.errors, {
      consequenceId,
      choiceId: context?.choiceId,
    });
  }
  nextSession = debugResult;

  const outputValidation = safeParseWorldSession(nextSession);
  if (!outputValidation.success) {
    return failureResult(
      validatedSession,
      formatSchemaErrors("session", outputValidation.error.issues),
      { consequenceId, choiceId: context?.choiceId },
    );
  }

  return {
    ok: true,
    errors: [],
    session: outputValidation.data,
    consequence,
  };
}
