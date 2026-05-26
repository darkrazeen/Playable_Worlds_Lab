import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  parseStoryBeat,
  safeParseStoryBeat,
  StoryBeatSchema,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validBeat = {
  id: "beat_ogre_bridge",
  title: "The Blocked Bridge",
  description: "An ogre blocks the only bridge into Stonepass Valley.",
  trigger: "player_reaches_bridge",
  availableChoices: [
    {
      id: "fight_ogre",
      label: "Fight the ogre",
      consequenceId: "consequence_fight_ogre",
    },
    {
      id: "sneak_ogre",
      label: "Sneak past the ogre",
      consequenceId: "consequence_sneak_ogre",
    },
  ],
  possibleConsequences: ["consequence_fight_ogre", "consequence_sneak_ogre"],
};

const validBeatWithFlags = {
  ...validBeat,
  requiredFlags: ["bridge_reachable"],
  blockedByFlags: ["ogre_defeated"],
  isHidden: false,
  isEnding: false,
};

describe("StoryBeatSchema", () => {
  it("accepts a valid story beat with nested choices", () => {
    const result = StoryBeatSchema.safeParse(validBeat);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.availableChoices).toHaveLength(2);
    }
  });

  it("accepts optional beat-level flags and markers", () => {
    expect(StoryBeatSchema.safeParse(validBeatWithFlags).success).toBe(true);
  });

  it("parses via parseStoryBeat helper", () => {
    const beat = parseStoryBeat(validBeat);
    expect(beat.id).toBe("beat_ogre_bridge");
    expect(beat.trigger).toBe("player_reaches_bridge");
  });

  it("rejects missing required fields", () => {
    const { id: _id, ...noId } = validBeat;
    const { title: _title, ...noTitle } = validBeat;
    const { trigger: _trigger, ...noTrigger } = validBeat;
    expect(StoryBeatSchema.safeParse(noId).success).toBe(false);
    expect(StoryBeatSchema.safeParse(noTitle).success).toBe(false);
    expect(StoryBeatSchema.safeParse(noTrigger).success).toBe(false);
  });

  it("rejects empty id, title, description, or trigger", () => {
    expect(StoryBeatSchema.safeParse({ ...validBeat, id: "" }).success).toBe(false);
    expect(StoryBeatSchema.safeParse({ ...validBeat, title: "" }).success).toBe(false);
    expect(StoryBeatSchema.safeParse({ ...validBeat, description: "" }).success).toBe(false);
    expect(StoryBeatSchema.safeParse({ ...validBeat, trigger: "" }).success).toBe(false);
  });

  it("rejects beats with no available choices", () => {
    expect(StoryBeatSchema.safeParse({ ...validBeat, availableChoices: [] }).success).toBe(
      false,
    );
    expect(safeParseStoryBeat({ ...validBeat, availableChoices: [] }).success).toBe(false);
  });

  it("rejects beats with no possibleConsequences", () => {
    expect(StoryBeatSchema.safeParse({ ...validBeat, possibleConsequences: [] }).success).toBe(
      false,
    );
  });

  it("rejects invalid nested player choices", () => {
    const invalid = {
      ...validBeat,
      availableChoices: [{ id: "", label: "Bad", consequenceId: "c1" }],
    };
    expect(StoryBeatSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects malformed beat-level flag arrays", () => {
    expect(
      StoryBeatSchema.safeParse({ ...validBeat, requiredFlags: [""] }).success,
    ).toBe(false);
    expect(
      StoryBeatSchema.safeParse({ ...validBeat, blockedByFlags: "not-array" }).success,
    ).toBe(false);
  });

  it("validates JSON example from packages/content/examples", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "story-beat-ogre-bridge.example.json"), "utf8"),
    );
    expect(StoryBeatSchema.safeParse(example).success).toBe(true);
  });
});
