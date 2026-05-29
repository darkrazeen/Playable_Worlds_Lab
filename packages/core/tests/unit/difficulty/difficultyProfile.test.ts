import { describe, expect, it } from "vitest";

import {
  DifficultyProfileSchema,
  baseTierFromProfile,
  clampDifficultyTier,
} from "../../../src/difficulty/difficultyProfile.js";

describe("DifficultyProfileSchema", () => {
  it("accepts a valid draft profile", () => {
    const result = DifficultyProfileSchema.safeParse({
      baseLevel: "normal",
      allowedRange: [1, 3],
      hintPolicy: "on_struggle",
      adaptive: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects allowedRange when min exceeds max", () => {
    const result = DifficultyProfileSchema.safeParse({
      baseLevel: "normal",
      allowedRange: [3, 1],
    });

    expect(result.success).toBe(false);
  });

  it("clamps tiers to allowedRange", () => {
    const profile = {
      baseLevel: "normal" as const,
      allowedRange: [1, 3] as [number, number],
      hintPolicy: "on_struggle" as const,
      adaptive: true,
    };

    expect(baseTierFromProfile(profile)).toBe(2);
    expect(clampDifficultyTier(0, profile)).toBe(1);
    expect(clampDifficultyTier(9, profile)).toBe(3);
  });
});
