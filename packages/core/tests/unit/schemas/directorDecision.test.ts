import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  DirectorDecisionSchema,
  parseDirectorDecision,
  safeParseDirectorDecision,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validSelectBeat = {
  action: "select_next_beat",
  targetId: "beat_landslide_aftermath",
  reason: "Player defeated the ogre and triggered the landslide.",
  confidence: 0.82,
};

const validWithSafetyNotes = {
  ...validSelectBeat,
  safetyNotes: ["teen-safe combat resolution"],
};

describe("DirectorDecisionSchema", () => {
  it("accepts a valid select-next-beat decision", () => {
    const result = DirectorDecisionSchema.safeParse(validSelectBeat);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe("select_next_beat");
      expect(result.data.targetId).toBe("beat_landslide_aftermath");
    }
  });

  it("accepts optional safetyNotes", () => {
    expect(DirectorDecisionSchema.safeParse(validWithSafetyNotes).success).toBe(true);
  });

  it("accepts all allowed v4.2 Director actions", () => {
    const actions = [
      "select_next_beat",
      "generate_consequence",
      "generate_instance",
      "generate_npc_reaction",
      "summarize_world",
      "suggest_session_wrapup",
      "adjust_difficulty",
    ] as const;

    for (const action of actions) {
      expect(
        DirectorDecisionSchema.safeParse({
          ...validSelectBeat,
          action,
          targetId:
            action === "generate_npc_reaction"
              ? "npc_ogre"
              : action === "adjust_difficulty"
                ? "difficulty_tier_2"
                : validSelectBeat.targetId,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects adjust_difficulty with non-tier targetId", () => {
    expect(
      DirectorDecisionSchema.safeParse({
        ...validSelectBeat,
        action: "adjust_difficulty",
        targetId: "beat_valley_square",
      }).success,
    ).toBe(false);
  });

  it("parses via parseDirectorDecision helper", () => {
    const decision = parseDirectorDecision(validSelectBeat);
    expect(decision.reason).toBe("Player defeated the ogre and triggered the landslide.");
    expect(decision.confidence).toBe(0.82);
  });

  it("rejects missing targetId or reason", () => {
    const { targetId: _targetId, ...noTarget } = validSelectBeat;
    const { reason: _reason, ...noReason } = validSelectBeat;
    expect(DirectorDecisionSchema.safeParse(noTarget).success).toBe(false);
    expect(DirectorDecisionSchema.safeParse(noReason).success).toBe(false);
    expect(safeParseDirectorDecision(noReason).success).toBe(false);
  });

  it("rejects empty targetId or reason", () => {
    expect(DirectorDecisionSchema.safeParse({ ...validSelectBeat, targetId: "" }).success).toBe(
      false,
    );
    expect(DirectorDecisionSchema.safeParse({ ...validSelectBeat, reason: "" }).success).toBe(
      false,
    );
  });

  it("rejects invalid action values including legacy suggest_* names", () => {
    expect(
      DirectorDecisionSchema.safeParse({ ...validSelectBeat, action: "mutate_ledger" }).success,
    ).toBe(false);
    expect(
      DirectorDecisionSchema.safeParse({ ...validSelectBeat, action: "suggest_next_beat" }).success,
    ).toBe(false);
  });

  it("rejects out-of-range confidence", () => {
    expect(DirectorDecisionSchema.safeParse({ ...validSelectBeat, confidence: -0.1 }).success).toBe(
      false,
    );
    expect(DirectorDecisionSchema.safeParse({ ...validSelectBeat, confidence: 1.1 }).success).toBe(
      false,
    );
    expect(DirectorDecisionSchema.safeParse({ ...validSelectBeat, confidence: NaN }).success).toBe(
      false,
    );
  });

  it("rejects malformed safetyNotes", () => {
    expect(
      DirectorDecisionSchema.safeParse({ ...validSelectBeat, safetyNotes: [""] }).success,
    ).toBe(false);
    expect(
      DirectorDecisionSchema.safeParse({ ...validSelectBeat, safetyNotes: "teen-safe" }).success,
    ).toBe(false);
  });

  it("validates JSON example from packages/content/examples", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "director-decision-suggest-beat.example.json"), "utf8"),
    );
    expect(DirectorDecisionSchema.safeParse(example).success).toBe(true);
  });

  it("validates adjust_difficulty JSON example", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "director-decision-adjust-difficulty.example.json"), "utf8"),
    );
    expect(DirectorDecisionSchema.safeParse(example).success).toBe(true);
    if (DirectorDecisionSchema.safeParse(example).success) {
      expect(example.action).toBe("adjust_difficulty");
      expect(example.targetId).toMatch(/^difficulty_tier_\d+$/);
    }
  });
});
