import type { WorldLedger } from "../schemas/worldLedger.js";
import type { WorldSession } from "../schemas/worldSession.js";

import {
  baseTierFromProfile,
  clampDifficultyTier,
  DEFAULT_DIFFICULTY_PROFILE,
  type DifficultyProfile,
} from "./difficultyProfile.js";
import type {
  AdvisoryDifficultySignal,
  DifficultySignals,
  DifficultyStruggleLevel,
} from "./difficultySignals.js";
import { AdvisoryDifficultySignalSchema, DifficultySignalsSchema } from "./difficultySignals.js";

export type DifficultySessionContext = Pick<
  WorldSession,
  "turnNumber" | "ledger" | "choiceHistory" | "activeTemporaryInstanceId"
>;

function isFailedCheckEvent(event: WorldLedger["worldEvents"][number]): boolean {
  return event.metadata?.failedCheck === true;
}

function isRetryEvent(event: WorldLedger["worldEvents"][number]): boolean {
  return event.metadata?.retry === true;
}

function countRetriesThisInstance(
  ledger: WorldLedger,
  activeTemporaryInstanceId: string | undefined,
): number {
  if (!activeTemporaryInstanceId) {
    return 0;
  }
  return ledger.worldEvents.filter(
    (event) => isRetryEvent(event) && event.metadata?.instanceId === activeTemporaryInstanceId,
  ).length;
}

function optionalGearTier(ledger: WorldLedger): number | undefined {
  const tiers = ledger.worldEvents
    .map((event) => event.metadata?.gearTier)
    .filter((value): value is number => typeof value === "number" && Number.isInteger(value));
  if (tiers.length === 0) {
    return undefined;
  }
  return Math.max(...tiers);
}

/**
 * Derive deterministic difficulty signals from session + ledger (no mutation, no AI).
 */
export function computeDifficultySignals(session: DifficultySessionContext): DifficultySignals {
  const { ledger } = session;
  const unresolvedGoals = Math.max(0, ledger.unlockedGoals.length - ledger.completedGoals.length);

  return DifficultySignalsSchema.parse({
    turnNumber: session.turnNumber,
    consequenceCount: ledger.worldEvents.filter((event) => event.type === "consequence").length,
    failedChecks: ledger.worldEvents.filter(isFailedCheckEvent).length,
    unresolvedGoals,
    activeFlagCount: ledger.activeFlags.length,
    retriesThisInstance: countRetriesThisInstance(ledger, session.activeTemporaryInstanceId),
    highestGearTier: optionalGearTier(ledger),
  });
}

function struggleLevelFromScore(score: number): DifficultyStruggleLevel {
  if (score <= 0) {
    return "low";
  }
  if (score <= 2) {
    return "moderate";
  }
  return "high";
}

/**
 * Compute a bounded advisory difficulty tier from ledger signals.
 * Does not mutate WorldLedger, WorldSession, flags, or rewards.
 */
export function computeAdvisoryDifficultySignal(
  session: DifficultySessionContext,
  profile: DifficultyProfile = DEFAULT_DIFFICULTY_PROFILE,
): AdvisoryDifficultySignal {
  const { ledger } = session;
  const signals = computeDifficultySignals(session);
  const rationale: string[] = [];
  let struggleScore = 0;
  let tier = baseTierFromProfile(profile);

  if (signals.failedChecks > 0) {
    struggleScore += 1;
    rationale.push(`${signals.failedChecks} failed check(s) recorded on the ledger.`);
    if (signals.failedChecks >= 3) {
      struggleScore += 1;
      rationale.push("Repeated failed checks suggest elevated struggle.");
    }
  }

  if (signals.unresolvedGoals >= 2) {
    struggleScore += 1;
    rationale.push(`${signals.unresolvedGoals} unresolved goals remain active.`);
  }

  if (signals.retriesThisInstance >= 2) {
    struggleScore += 1;
    rationale.push(`${signals.retriesThisInstance} retries in the current instance.`);
  }

  if (
    signals.turnNumber >= 4 &&
    signals.consequenceCount < Math.max(1, Math.floor(signals.turnNumber / 2))
  ) {
    struggleScore += 1;
    rationale.push("Progress is slower than expected for the turn count.");
  }

  if (
    ledger.completedGoals.length >= 1 &&
    signals.failedChecks === 0 &&
    signals.unresolvedGoals <= 1 &&
    signals.retriesThisInstance === 0
  ) {
    struggleScore -= 1;
    rationale.push("Recent goal completion with no failed checks — easing advisory tier.");
  }

  tier = clampDifficultyTier(tier + struggleScore, profile);

  if (rationale.length === 0) {
    rationale.push("Baseline ledger signals; no struggle indicators detected.");
  }

  return AdvisoryDifficultySignalSchema.parse({
    suggestedTier: tier,
    struggleLevel: struggleLevelFromScore(struggleScore),
    signals,
    rationale,
  });
}
