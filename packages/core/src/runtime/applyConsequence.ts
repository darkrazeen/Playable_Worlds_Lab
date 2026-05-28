import { appendDebugEvent } from "../debug/appendDebugEvent.js";
import type { Consequence } from "../schemas/consequence.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import { safeParseWorldSession, type WorldSession } from "../schemas/worldSession.js";

import { applyConsequenceToLedger } from "./applyConsequenceToLedger.js";
import { resolvePlayerChoice } from "./resolvePlayerChoice.js";

export type ApplyConsequenceContext = {
  choiceId?: string;
  beatId?: string;
  choiceLabel?: string;
};

export type ApplyConsequenceResult = {
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
      return { ok: false, errors: [`runtime: failed to append debug event: ${message}`] };
    }
  }
  return nextSession;
}

/** Apply a consequence to session ledger, turn, choice history, and debug trace. */
export function applyConsequence(
  world: WorldDefinition,
  session: WorldSession,
  consequenceId: string,
  context?: ApplyConsequenceContext,
): ApplyConsequenceResult {
  const consequence = world.consequences.find((entry) => entry.id === consequenceId);
  if (!consequence) {
    return {
      ok: false,
      errors: [`runtime: consequence "${consequenceId}" not found in world "${world.id}"`],
    };
  }

  const nextTurn = session.turnNumber + 1;
  const ledger = applyConsequenceToLedger(session.ledger, consequence, nextTurn, {
    choiceId: context?.choiceId,
  });

  let nextSession: WorldSession = {
    ...session,
    turnNumber: nextTurn,
    ledger,
    choiceHistory: context?.choiceId
      ? [...session.choiceHistory, context.choiceId]
      : session.choiceHistory,
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
    },
  });

  for (const goalId of consequence.unlockGoals ?? []) {
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

  const validation = safeParseWorldSession(nextSession);
  if (!validation.success) {
    return {
      ok: false,
      errors: validation.error.issues.map(
        (issue) => `session: ${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
    };
  }

  return {
    ok: true,
    errors: [],
    session: validation.data,
    consequence,
  };
}

/** Resolve and apply the consequence for a player choice in one deterministic step. */
export function applyPlayerChoice(
  world: WorldDefinition,
  session: WorldSession,
  choiceId: string,
): ApplyConsequenceResult {
  const resolved = resolvePlayerChoice(world, session, choiceId);
  if (!resolved.ok || !resolved.choice || !resolved.consequenceId) {
    return { ok: false, errors: resolved.errors };
  }

  return applyConsequence(world, session, resolved.consequenceId, {
    choiceId: resolved.choice.id,
    beatId: resolved.beat?.id,
    choiceLabel: resolved.choice.label,
  });
}
