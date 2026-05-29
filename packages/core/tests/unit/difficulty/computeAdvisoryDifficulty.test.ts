import { describe, expect, it } from "vitest";

import {
  computeAdvisoryDifficultySignal,
  computeDifficultySignals,
  type DifficultySessionContext,
} from "../../../src/difficulty/computeAdvisoryDifficulty.js";
import { DEFAULT_DIFFICULTY_PROFILE } from "../../../src/difficulty/difficultyProfile.js";
import { createEmptyWorldLedger } from "../../../src/schemas/worldLedger.js";

function sessionWithLedger(
  ledger: ReturnType<typeof createEmptyWorldLedger>,
  turnNumber = 0,
): DifficultySessionContext {
  return {
    turnNumber,
    choiceHistory: [],
    activeTemporaryInstanceId: undefined,
    ledger,
  };
}

describe("computeDifficultySignals", () => {
  it("returns zeroed signals for an empty ledger safely", () => {
    const signals = computeDifficultySignals(sessionWithLedger(createEmptyWorldLedger(), 0));

    expect(signals.turnNumber).toBe(0);
    expect(signals.consequenceCount).toBe(0);
    expect(signals.failedChecks).toBe(0);
    expect(signals.unresolvedGoals).toBe(0);
    expect(signals.activeFlagCount).toBe(0);
    expect(signals.retriesThisInstance).toBe(0);
    expect(signals.highestGearTier).toBeUndefined();
  });

  it("counts failed checks and unresolved goals from ledger fixtures", () => {
    const ledger = createEmptyWorldLedger();
    ledger.unlockedGoals = ["goal_reach_valley", "goal_explore_cave"];
    ledger.completedGoals = [];
    ledger.activeFlags = ["ogre_blocks_bridge", "stuck_in_cave"];
    ledger.worldEvents = [
      {
        id: "event_fight_ogre",
        type: "consequence",
        summary: "Player fought the ogre.",
        turnNumber: 1,
      },
      {
        id: "event_failed_strength",
        type: "system",
        summary: "Failed strength check.",
        turnNumber: 2,
        metadata: { failedCheck: true },
      },
      {
        id: "event_failed_puzzle",
        type: "system",
        summary: "Failed puzzle check.",
        turnNumber: 3,
        metadata: { failedCheck: true },
      },
    ];

    const signals = computeDifficultySignals(sessionWithLedger(ledger, 3));

    expect(signals.consequenceCount).toBe(1);
    expect(signals.failedChecks).toBe(2);
    expect(signals.unresolvedGoals).toBe(2);
    expect(signals.activeFlagCount).toBe(2);
  });
});

describe("computeAdvisoryDifficultySignal", () => {
  it("returns baseline tier for an empty ledger", () => {
    const advisory = computeAdvisoryDifficultySignal(
      sessionWithLedger(createEmptyWorldLedger(), 0),
    );

    expect(advisory.suggestedTier).toBe(2);
    expect(advisory.struggleLevel).toBe("low");
    expect(advisory.signals.failedChecks).toBe(0);
    expect(advisory.rationale.length).toBeGreaterThan(0);
  });

  it("raises tier and struggle level for a struggle fixture", () => {
    const ledger = createEmptyWorldLedger();
    ledger.unlockedGoals = ["goal_reach_valley", "goal_explore_cave"];
    ledger.worldEvents = [
      {
        id: "event_fail_a",
        type: "system",
        summary: "Failed check A.",
        turnNumber: 2,
        metadata: { failedCheck: true },
      },
      {
        id: "event_fail_b",
        type: "system",
        summary: "Failed check B.",
        turnNumber: 3,
        metadata: { failedCheck: true },
      },
      {
        id: "event_fail_c",
        type: "system",
        summary: "Failed check C.",
        turnNumber: 4,
        metadata: { failedCheck: true },
      },
    ];

    const advisory = computeAdvisoryDifficultySignal(sessionWithLedger(ledger, 4));

    expect(advisory.suggestedTier).toBeGreaterThan(2);
    expect(advisory.struggleLevel).toBe("high");
    expect(advisory.suggestedTier).toBeLessThanOrEqual(DEFAULT_DIFFICULTY_PROFILE.allowedRange[1]);
  });

  it("lowers tier for a success streak fixture with no failed checks", () => {
    const ledger = createEmptyWorldLedger();
    ledger.unlockedGoals = ["goal_reach_valley"];
    ledger.completedGoals = ["goal_reach_valley"];
    ledger.worldEvents = [
      {
        id: "event_talk_ogre",
        type: "consequence",
        summary: "Talked past the ogre.",
        turnNumber: 1,
      },
    ];

    const advisory = computeAdvisoryDifficultySignal(sessionWithLedger(ledger, 2));

    expect(advisory.suggestedTier).toBe(1);
    expect(advisory.struggleLevel).toBe("low");
  });

  it("is deterministic for the same session snapshot", () => {
    const ledger = createEmptyWorldLedger();
    ledger.unlockedGoals = ["goal_reach_valley", "goal_explore_cave"];
    ledger.worldEvents = [
      {
        id: "event_fail",
        type: "system",
        summary: "Failed check.",
        turnNumber: 1,
        metadata: { failedCheck: true },
      },
    ];
    const context = sessionWithLedger(ledger, 2);

    const first = computeAdvisoryDifficultySignal(context);
    const second = computeAdvisoryDifficultySignal(context);

    expect(second).toEqual(first);
  });

  it("does not mutate the input ledger", () => {
    const ledger = createEmptyWorldLedger();
    const snapshot = JSON.stringify(ledger);

    computeAdvisoryDifficultySignal(sessionWithLedger(ledger, 0));

    expect(JSON.stringify(ledger)).toBe(snapshot);
  });
});
