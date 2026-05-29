import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";
import {
  applyConsequenceEngine,
  type ApplyConsequenceEngineContext,
  type ApplyConsequenceEngineResult,
} from "../consequence/consequenceEngine.js";

import { resolvePlayerChoice } from "./resolvePlayerChoice.js";

export type ApplyConsequenceContext = ApplyConsequenceEngineContext;
export type ApplyConsequenceResult = ApplyConsequenceEngineResult;

/** Apply a consequence through the Consequence Engine (delegates to applyConsequenceEngine). */
export function applyConsequence(
  world: WorldDefinition,
  session: WorldSession,
  consequenceId: string,
  context?: ApplyConsequenceContext,
): ApplyConsequenceResult {
  return applyConsequenceEngine(world, session, consequenceId, context);
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

  return applyConsequenceEngine(world, session, resolved.consequenceId, {
    choiceId: resolved.choice.id,
    beatId: resolved.beat?.id,
    choiceLabel: resolved.choice.label,
  });
}
