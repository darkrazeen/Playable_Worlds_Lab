import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  createEmptyProgressionLedger,
  MAX_PROGRESSION_TIER,
  parseProgressionLedger,
  ProgressionLedgerSchema,
  safeParseProgressionLedger,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validProgression = {
  skillTiers: {
    skill_sword: 2,
    skill_guard: 1,
  },
  unlocks: ["unlock_power_strike"],
  milestones: ["milestone_cave_spelunker"],
  usageCounters: {
    bats_cleared: 1,
    parries_landed: 3,
  },
};

describe("ProgressionLedgerSchema", () => {
  it("accepts an empty ledger and defaults collections to empty", () => {
    const result = ProgressionLedgerSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skillTiers).toEqual({});
      expect(result.data.unlocks).toEqual([]);
      expect(result.data.milestones).toEqual([]);
      expect(result.data.usageCounters).toEqual({});
    }
  });

  it("creates an empty ledger via createEmptyProgressionLedger", () => {
    const ledger = createEmptyProgressionLedger();
    expect(ledger).toEqual({
      skillTiers: {},
      unlocks: [],
      milestones: [],
      usageCounters: {},
    });
  });

  it("accepts bounded skill tiers, unlocks, milestones, and usage counters", () => {
    const result = ProgressionLedgerSchema.safeParse(validProgression);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skillTiers.skill_sword).toBe(2);
      expect(result.data.unlocks).toContain("unlock_power_strike");
      expect(result.data.usageCounters.parries_landed).toBe(3);
    }
  });

  it("parses via parseProgressionLedger helper", () => {
    const ledger = parseProgressionLedger(validProgression);
    expect(ledger.milestones).toContain("milestone_cave_spelunker");
  });

  it("rejects XP, stat blocks, and other non-progression top-level fields", () => {
    expect(
      ProgressionLedgerSchema.safeParse({
        ...validProgression,
        xp: 1200,
      }).success,
    ).toBe(false);
    expect(
      ProgressionLedgerSchema.safeParse({
        skillTiers: { skill_sword: 1 },
        stats: { strength: 15 },
      }).success,
    ).toBe(false);
    expect(
      ProgressionLedgerSchema.safeParse({
        skillTiers: { skill_sword: 1 },
        experience: 500,
      }).success,
    ).toBe(false);
  });

  it("rejects float tiers, negative values, and over-cap tiers", () => {
    expect(
      ProgressionLedgerSchema.safeParse({
        skillTiers: { skill_sword: 1.5 },
      }).success,
    ).toBe(false);
    expect(
      ProgressionLedgerSchema.safeParse({
        skillTiers: { skill_sword: -1 },
      }).success,
    ).toBe(false);
    expect(
      ProgressionLedgerSchema.safeParse({
        skillTiers: { skill_sword: MAX_PROGRESSION_TIER + 1 },
      }).success,
    ).toBe(false);
    expect(
      ProgressionLedgerSchema.safeParse({
        usageCounters: { bats_cleared: -2 },
      }).success,
    ).toBe(false);
    expect(safeParseProgressionLedger({ usageCounters: { bats_cleared: 1.25 } }).success).toBe(
      false,
    );
  });

  it("rejects malformed ids in tiers, unlocks, milestones, and usage keys", () => {
    expect(
      ProgressionLedgerSchema.safeParse({
        skillTiers: { "Bad-Id": 1 },
      }).success,
    ).toBe(false);
    expect(
      ProgressionLedgerSchema.safeParse({
        unlocks: [""],
      }).success,
    ).toBe(false);
    expect(
      ProgressionLedgerSchema.safeParse({
        milestones: ["UPPER_CASE"],
      }).success,
    ).toBe(false);
    expect(
      ProgressionLedgerSchema.safeParse({
        usageCounters: { "": 1 },
      }).success,
    ).toBe(false);
  });

  it("validates JSON examples from packages/content/examples", () => {
    const emptyExample = JSON.parse(
      readFileSync(join(examplesDir, "progression-ledger-empty.example.json"), "utf8"),
    );
    const skillsExample = JSON.parse(
      readFileSync(join(examplesDir, "progression-ledger-stonepass-skills.example.json"), "utf8"),
    );
    expect(ProgressionLedgerSchema.safeParse(emptyExample).success).toBe(true);
    expect(ProgressionLedgerSchema.safeParse(skillsExample).success).toBe(true);
  });
});
