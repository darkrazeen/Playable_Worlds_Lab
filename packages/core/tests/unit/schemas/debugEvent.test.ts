import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  DebugEventSchema,
  DebugEventTypeSchema,
  parseDebugEvent,
  safeParseDebugEvent,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validChoiceSelected = {
  id: "debug_choice_fight_ogre",
  turnNumber: 1,
  type: "choice_selected",
  summary: "Player chose to fight the ogre.",
  metadata: { choiceId: "fight_ogre", beatId: "beat_ogre_bridge" },
};

const validConsequenceApplied = {
  id: "debug_consequence_fight_ogre",
  turnNumber: 1,
  type: "consequence_applied",
  summary: "Applied consequence_fight_ogre.",
  metadata: { consequenceId: "consequence_fight_ogre" },
};

const validFallbackUsed = {
  id: "debug_fallback_director_001",
  turnNumber: 2,
  type: "fallback_used",
  summary: "Director suggestion failed validation; used deterministic next beat.",
};

describe("DebugEventTypeSchema", () => {
  it("accepts all canonical event types from §9", () => {
    const types = [
      "choice_selected",
      "consequence_applied",
      "flags_changed",
      "goal_unlocked",
      "ai_suggestion",
      "fallback_used",
      "validation_failed",
      "session_loaded",
      "session_saved",
    ] as const;
    for (const type of types) {
      expect(DebugEventTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("rejects unknown types", () => {
    expect(DebugEventTypeSchema.safeParse("invalid_type").success).toBe(false);
  });
});

describe("DebugEventSchema", () => {
  it("accepts valid choice_selected and consequence_applied events", () => {
    expect(DebugEventSchema.safeParse(validChoiceSelected).success).toBe(true);
    expect(DebugEventSchema.safeParse(validConsequenceApplied).success).toBe(true);
  });

  it("accepts events without optional metadata", () => {
    expect(DebugEventSchema.safeParse(validFallbackUsed).success).toBe(true);
  });

  it("parses via parseDebugEvent helper", () => {
    const event = parseDebugEvent(validChoiceSelected);
    expect(event.type).toBe("choice_selected");
    expect(event.metadata?.choiceId).toBe("fight_ogre");
  });

  it("rejects missing required fields", () => {
    const { id: _id, ...noId } = validChoiceSelected;
    const { summary: _summary, ...noSummary } = validChoiceSelected;
    const { turnNumber: _turn, ...noTurn } = validChoiceSelected;
    const { type: _type, ...noType } = validChoiceSelected;
    expect(DebugEventSchema.safeParse(noId).success).toBe(false);
    expect(DebugEventSchema.safeParse(noSummary).success).toBe(false);
    expect(DebugEventSchema.safeParse(noTurn).success).toBe(false);
    expect(DebugEventSchema.safeParse(noType).success).toBe(false);
  });

  it("rejects empty id or summary, invalid type, and invalid turnNumber", () => {
    expect(DebugEventSchema.safeParse({ ...validChoiceSelected, id: "" }).success).toBe(
      false,
    );
    expect(DebugEventSchema.safeParse({ ...validChoiceSelected, summary: "" }).success).toBe(
      false,
    );
    expect(DebugEventSchema.safeParse({ ...validChoiceSelected, type: "bad" }).success).toBe(
      false,
    );
    expect(DebugEventSchema.safeParse({ ...validChoiceSelected, turnNumber: -1 }).success).toBe(
      false,
    );
    expect(safeParseDebugEvent({ ...validChoiceSelected, turnNumber: 1.5 }).success).toBe(
      false,
    );
  });

  it("validates JSON examples from packages/content/examples", () => {
    const files = [
      "debug-event-choice-selected.example.json",
      "debug-event-consequence-applied.example.json",
      "debug-event-fallback-used.example.json",
    ];
    for (const file of files) {
      const example = JSON.parse(readFileSync(join(examplesDir, file), "utf8"));
      expect(DebugEventSchema.safeParse(example).success).toBe(true);
    }
  });
});
