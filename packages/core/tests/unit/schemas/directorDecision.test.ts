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

const validSuggestBeat = {
  action: "suggest_next_beat",
  targetId: "beat_landslide_aftermath",
  reason: "Player defeated the ogre and triggered the landslide.",
  confidence: 0.82,
};

const validWithSafetyNotes = {
  ...validSuggestBeat,
  safetyNotes: ["teen-safe combat resolution"],
};

describe("DirectorDecisionSchema", () => {
  it("accepts a valid suggest-next-beat decision", () => {
    const result = DirectorDecisionSchema.safeParse(validSuggestBeat);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe("suggest_next_beat");
      expect(result.data.targetId).toBe("beat_landslide_aftermath");
    }
  });

  it("accepts optional safetyNotes", () => {
    expect(DirectorDecisionSchema.safeParse(validWithSafetyNotes).success).toBe(true);
  });

  it("accepts all allowed Director actions", () => {
    const actions = [
      "suggest_next_beat",
      "suggest_npc_reaction",
      "suggest_recap",
      "suggest_hint",
      "request_temporary_instance",
      "suggest_session_wrap_up",
    ] as const;

    for (const action of actions) {
      expect(
        DirectorDecisionSchema.safeParse({
          ...validSuggestBeat,
          action,
          targetId: action === "suggest_npc_reaction" ? "npc_ogre" : validSuggestBeat.targetId,
        }).success,
      ).toBe(true);
    }
  });

  it("parses via parseDirectorDecision helper", () => {
    const decision = parseDirectorDecision(validSuggestBeat);
    expect(decision.reason).toBe("Player defeated the ogre and triggered the landslide.");
    expect(decision.confidence).toBe(0.82);
  });

  it("rejects missing targetId or reason", () => {
    const { targetId: _targetId, ...noTarget } = validSuggestBeat;
    const { reason: _reason, ...noReason } = validSuggestBeat;
    expect(DirectorDecisionSchema.safeParse(noTarget).success).toBe(false);
    expect(DirectorDecisionSchema.safeParse(noReason).success).toBe(false);
    expect(safeParseDirectorDecision(noReason).success).toBe(false);
  });

  it("rejects empty targetId or reason", () => {
    expect(DirectorDecisionSchema.safeParse({ ...validSuggestBeat, targetId: "" }).success).toBe(
      false,
    );
    expect(DirectorDecisionSchema.safeParse({ ...validSuggestBeat, reason: "" }).success).toBe(
      false,
    );
  });

  it("rejects invalid action values", () => {
    expect(
      DirectorDecisionSchema.safeParse({ ...validSuggestBeat, action: "mutate_ledger" }).success,
    ).toBe(false);
    expect(
      DirectorDecisionSchema.safeParse({ ...validSuggestBeat, action: "suggest_next_beat_extra" })
        .success,
    ).toBe(false);
  });

  it("rejects out-of-range confidence", () => {
    expect(DirectorDecisionSchema.safeParse({ ...validSuggestBeat, confidence: -0.1 }).success).toBe(
      false,
    );
    expect(DirectorDecisionSchema.safeParse({ ...validSuggestBeat, confidence: 1.1 }).success).toBe(
      false,
    );
    expect(DirectorDecisionSchema.safeParse({ ...validSuggestBeat, confidence: NaN }).success).toBe(
      false,
    );
  });

  it("rejects malformed safetyNotes", () => {
    expect(
      DirectorDecisionSchema.safeParse({ ...validSuggestBeat, safetyNotes: [""] }).success,
    ).toBe(false);
    expect(
      DirectorDecisionSchema.safeParse({ ...validSuggestBeat, safetyNotes: "teen-safe" }).success,
    ).toBe(false);
  });

  it("validates JSON example from packages/content/examples", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "director-decision-suggest-beat.example.json"), "utf8"),
    );
    expect(DirectorDecisionSchema.safeParse(example).success).toBe(true);
  });
});
