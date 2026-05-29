import type { DifficultyProfile } from "../difficulty/difficultyProfile.js";
import {
  clampDifficultyTier,
  DEFAULT_DIFFICULTY_PROFILE,
} from "../difficulty/difficultyProfile.js";
import type { DirectorDecision } from "./directorDecision.js";

export const DIFFICULTY_TIER_TARGET_PREFIX = "difficulty_tier_";

const DIFFICULTY_TIER_TARGET_PATTERN = /^difficulty_tier_(\d+)$/;

/** Parse an encounter-intensity tier from a DirectorDecision targetId. */
export function parseDifficultyTierTargetId(targetId: string): number | null {
  const match = DIFFICULTY_TIER_TARGET_PATTERN.exec(targetId);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1]!, 10);
}

/** Build the canonical targetId for an adjust_difficulty decision. */
export function buildDifficultyTierTargetId(tier: number): string {
  return `${DIFFICULTY_TIER_TARGET_PREFIX}${Math.trunc(tier)}`;
}

export type ClampDirectorDifficultyResult = {
  decision: DirectorDecision;
  clamped: boolean;
  originalTier?: number;
  clampedTier?: number;
};

/**
 * Clamp adjust_difficulty target tier to DifficultyProfile.allowedRange.
 * Advisory only — does not mutate ledger or session state.
 */
export function clampDirectorDifficultyDecision(
  decision: DirectorDecision,
  profile: DifficultyProfile = DEFAULT_DIFFICULTY_PROFILE,
): ClampDirectorDifficultyResult {
  if (decision.action !== "adjust_difficulty") {
    return { decision, clamped: false };
  }

  const parsedTier = parseDifficultyTierTargetId(decision.targetId);
  if (parsedTier === null) {
    return { decision, clamped: false };
  }

  const clampedTier = clampDifficultyTier(parsedTier, profile);
  if (clampedTier === parsedTier) {
    return { decision, clamped: false };
  }

  return {
    decision: {
      ...decision,
      targetId: buildDifficultyTierTargetId(clampedTier),
      reason: `${decision.reason} (clamped to tier ${clampedTier} within allowed range.)`,
    },
    clamped: true,
    originalTier: parsedTier,
    clampedTier,
  };
}
