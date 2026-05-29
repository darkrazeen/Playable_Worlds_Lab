import { appendDebugEvent } from "../debug/appendDebugEvent.js";
import type { Consequence } from "../schemas/consequence.js";
import { safeParseConsequence } from "../schemas/consequence.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import { safeParseWorldSession, type WorldSession } from "../schemas/worldSession.js";

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

function appendValidatedDebugEvents(
  session: WorldSession,
  events: unknown[],
): WorldSession | { ok: false; errors: string[] } {
  let nextSession = session;
  for (const event of events) {
    try {
      nextSession = appendDebugEvent(nextSession, event);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        errors: [`consequence-engine: failed to append debug event: ${message}`],
      };
    }
  }
  return nextSession;
}

function formatSchemaErrors(prefix: string, issues: { path: (string | number)[]; message: string }[]) {
  return issues.map(
    (issue) => `${prefix}: ${issue.path.join(".") || "<root>"}: ${issue.message}`,
  );
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
    return {
      ok: false,
      errors: formatSchemaErrors("session", sessionValidation.error.issues),
    };
  }

  const rawConsequence = world.consequences.find((entry) => entry.id === consequenceId);
  if (!rawConsequence) {
    return {
      ok: false,
      errors: [
        `consequence-engine: consequence "${consequenceId}" not found in world "${world.id}"`,
      ],
    };
  }

  const consequenceValidation = safeParseConsequence(rawConsequence);
  if (!consequenceValidation.success) {
    return {
      ok: false,
      errors: formatSchemaErrors("consequence", consequenceValidation.error.issues),
    };
  }
  const consequence = consequenceValidation.data;

  const preconditionResult = validateConsequencePreconditions(
    world,
    sessionValidation.data,
    consequence,
    context?.choiceId ? { choiceId: context.choiceId } : undefined,
  );
  if (!preconditionResult.ok) {
    return { ok: false, errors: preconditionResult.errors };
  }

  const nextTurn = sessionValidation.data.turnNumber + 1;
  const ledger = applyConsequenceToLedger(sessionValidation.data.ledger, consequence, nextTurn, {
    choiceId: context?.choiceId,
  });

  let nextSession: WorldSession = {
    ...sessionValidation.data,
    turnNumber: nextTurn,
    ledger,
    choiceHistory: context?.choiceId
      ? [...sessionValidation.data.choiceHistory, context.choiceId]
      : sessionValidation.data.choiceHistory,
  };

  const debugEvents: unknown[] = [];

  if (context?.choiceId) {
    debugEvents.push({
      id: `debug_choice_${context.choiceId}`,
      turnNumber: nextTurn,
      type: "choice_selected",
      summary: context.choiceLabel
        ? `Player chose ${context.choiceLabel}.`
        : `Player chose ${context.choiceId}.`,
      metadata: {
        choiceId: context.choiceId,
        ...(context.beatId ? { beatId: context.beatId } : {}),
      },
    });
  }

  debugEvents.push({
    id: `debug_consequence_${consequence.id.replace(/^consequence_/, "")}`,
    turnNumber: nextTurn,
    type: "consequence_applied",
    summary: `Applied ${consequence.id}.`,
    metadata: {
      consequenceId: consequence.id,
      ...(context?.choiceId ? { choiceId: context.choiceId } : {}),
      ...(consequence.visibleChanges.length > 0
        ? { visibleChanges: consequence.visibleChanges }
        : {}),
    },
  });

  for (const goalId of consequence.unlockGoals) {
    debugEvents.push({
      id: `debug_goal_${goalId}`,
      turnNumber: nextTurn,
      type: "goal_unlocked",
      summary: `Unlocked goal ${goalId}.`,
      metadata: { goalId, consequenceId: consequence.id },
    });
  }

  const debugResult = appendValidatedDebugEvents(nextSession, debugEvents);
  if ("errors" in debugResult) {
    return debugResult;
  }
  nextSession = debugResult;

  const outputValidation = safeParseWorldSession(nextSession);
  if (!outputValidation.success) {
    return {
      ok: false,
      errors: formatSchemaErrors("session", outputValidation.error.issues),
    };
  }

  return {
    ok: true,
    errors: [],
    session: outputValidation.data,
    consequence,
  };
}
