import { describe, expect, it } from "vitest";

import {
  buildDifficultyTierTargetId,
  clampDirectorDifficultyDecision,
  parseDifficultyTierTargetId,
} from "../../../src/schemas/directorDifficultyDecision.js";
import { DEFAULT_DIFFICULTY_PROFILE } from "../../../src/difficulty/difficultyProfile.js";

describe("directorDifficultyDecision", () => {
  it("parses and builds difficulty tier targetIds", () => {
    expect(parseDifficultyTierTargetId("difficulty_tier_2")).toBe(2);
    expect(parseDifficultyTierTargetId("beat_valley_square")).toBeNull();
    expect(parseDifficultyTierTargetId("difficulty_tier_x")).toBeNull();
    expect(buildDifficultyTierTargetId(3)).toBe("difficulty_tier_3");
  });

  it("passes through non adjust_difficulty decisions unchanged", () => {
    const decision = {
      action: "select_next_beat" as const,
      targetId: "beat_valley_square",
      reason: "Hold.",
      confidence: 0.5,
    };
    const result = clampDirectorDifficultyDecision(decision, DEFAULT_DIFFICULTY_PROFILE);
    expect(result.clamped).toBe(false);
    expect(result.decision).toEqual(decision);
  });

  it("leaves in-bounds adjust_difficulty unchanged", () => {
    const decision = {
      action: "adjust_difficulty" as const,
      targetId: "difficulty_tier_2",
      reason: "Moderate struggle.",
      confidence: 0.7,
    };
    const result = clampDirectorDifficultyDecision(decision, DEFAULT_DIFFICULTY_PROFILE);
    expect(result.clamped).toBe(false);
    expect(result.decision.targetId).toBe("difficulty_tier_2");
  });

  it("clamps out-of-bounds adjust_difficulty to profile allowedRange", () => {
    const decision = {
      action: "adjust_difficulty" as const,
      targetId: "difficulty_tier_99",
      reason: "Too hard.",
      confidence: 0.8,
    };
    const result = clampDirectorDifficultyDecision(decision, DEFAULT_DIFFICULTY_PROFILE);
    expect(result.clamped).toBe(true);
    expect(result.originalTier).toBe(99);
    expect(result.clampedTier).toBe(3);
    expect(result.decision.targetId).toBe("difficulty_tier_3");
    expect(result.decision.reason).toContain("clamped");
  });
});
