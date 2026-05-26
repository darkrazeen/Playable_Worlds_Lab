import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  PlayerChoiceSchema,
  parsePlayerChoice,
  safeParsePlayerChoice,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validMinimal = {
  id: "fight_ogre",
  label: "Fight the ogre",
  consequenceId: "consequence_fight_ogre",
};

const validWithFlags = {
  id: "sneak_past",
  label: "Sneak past the ogre",
  description: "Slip by while the ogre is distracted.",
  requiredFlags: ["ogre_distracted"],
  blockedByFlags: ["ogre_alerted"],
  consequenceId: "consequence_sneak_ogre",
};

describe("PlayerChoiceSchema", () => {
  it("accepts a valid minimal choice", () => {
    expect(PlayerChoiceSchema.safeParse(validMinimal).success).toBe(true);
  });

  it("accepts a valid choice with optional fields", () => {
    const result = PlayerChoiceSchema.safeParse(validWithFlags);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requiredFlags).toEqual(["ogre_distracted"]);
      expect(result.data.blockedByFlags).toEqual(["ogre_alerted"]);
    }
  });

  it("parses via parsePlayerChoice helper", () => {
    const choice = parsePlayerChoice(validMinimal);
    expect(choice.id).toBe("fight_ogre");
    expect(choice.consequenceId).toBe("consequence_fight_ogre");
  });

  it("rejects missing id", () => {
    const { id: _id, ...missing } = validMinimal;
    expect(PlayerChoiceSchema.safeParse(missing).success).toBe(false);
  });

  it("rejects missing label", () => {
    const { label: _label, ...missing } = validMinimal;
    expect(PlayerChoiceSchema.safeParse(missing).success).toBe(false);
  });

  it("rejects missing consequenceId", () => {
    const { consequenceId: _c, ...missing } = validMinimal;
    expect(PlayerChoiceSchema.safeParse(missing).success).toBe(false);
    expect(safeParsePlayerChoice(missing).success).toBe(false);
  });

  it("rejects empty id, label, or consequenceId", () => {
    expect(PlayerChoiceSchema.safeParse({ ...validMinimal, id: "" }).success).toBe(false);
    expect(PlayerChoiceSchema.safeParse({ ...validMinimal, label: "" }).success).toBe(false);
    expect(PlayerChoiceSchema.safeParse({ ...validMinimal, consequenceId: "" }).success).toBe(
      false,
    );
  });

  it("rejects malformed flag arrays", () => {
    expect(
      PlayerChoiceSchema.safeParse({ ...validMinimal, requiredFlags: [""] }).success,
    ).toBe(false);
    expect(
      PlayerChoiceSchema.safeParse({ ...validMinimal, blockedByFlags: "ogre_alerted" }).success,
    ).toBe(false);
    expect(
      PlayerChoiceSchema.safeParse({ ...validMinimal, requiredFlags: "not-an-array" }).success,
    ).toBe(false);
  });

  it("validates JSON example from packages/content/examples", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "player-choice-valid.example.json"), "utf8"),
    );
    expect(PlayerChoiceSchema.safeParse(example).success).toBe(true);
  });
});
