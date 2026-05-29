import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ConsequenceSchema,
  parseConsequence,
  safeParseConsequence,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validMinimal = {
  id: "consequence_decline_mosswood_errand",
  summary: "You decline the Mosswood errand for now.",
};

const validFightOgre = {
  id: "consequence_fight_ogre",
  summary: "You defeat the ogre and clear the bridge.",
  addFlags: ["ogre_defeated", "bridge_open"],
  removeFlags: ["ogre_blocks_bridge"],
  unlockGoals: ["goal_reach_valley"],
  completeGoals: ["goal_clear_bridge"],
  exposeLocations: ["location_hidden_cave"],
  closeLocations: ["location_ogre_camp"],
  visibleChanges: ["The ogre collapses. Rocks tumble from the cliffs."],
  npcUpdates: [{ npcId: "npc_ogre", attitude: "hostile" }],
  temporaryInstances: ["instance_hidden_cave"],
};

describe("ConsequenceSchema", () => {
  it("accepts a valid minimal consequence with only id and summary", () => {
    const result = ConsequenceSchema.safeParse(validMinimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.addFlags).toEqual([]);
      expect(result.data.visibleChanges).toEqual([]);
    }
  });

  it("accepts optional requiredFlags and blockedByFlags", () => {
    const result = ConsequenceSchema.safeParse({
      ...validMinimal,
      requiredFlags: ["flag_required"],
      blockedByFlags: ["flag_blocked"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requiredFlags).toEqual(["flag_required"]);
      expect(result.data.blockedByFlags).toEqual(["flag_blocked"]);
    }
  });

  it("accepts a valid fight-ogre-style consequence with state changes", () => {
    const result = ConsequenceSchema.safeParse(validFightOgre);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.addFlags).toContain("ogre_defeated");
      expect(result.data.npcUpdates[0]?.npcId).toBe("npc_ogre");
      expect(result.data.temporaryInstances).toContain("instance_hidden_cave");
    }
  });

  it("parses via parseConsequence helper", () => {
    const consequence = parseConsequence(validMinimal);
    expect(consequence.id).toBe("consequence_decline_mosswood_errand");
    expect(consequence.summary).toBe("You decline the Mosswood errand for now.");
  });

  it("defaults omitted array fields to empty arrays", () => {
    const consequence = parseConsequence(validMinimal);
    expect(consequence.addFlags).toEqual([]);
    expect(consequence.removeFlags).toEqual([]);
    expect(consequence.unlockGoals).toEqual([]);
    expect(consequence.completeGoals).toEqual([]);
    expect(consequence.exposeLocations).toEqual([]);
    expect(consequence.closeLocations).toEqual([]);
    expect(consequence.visibleChanges).toEqual([]);
    expect(consequence.npcUpdates).toEqual([]);
    expect(consequence.temporaryInstances).toEqual([]);
  });

  it("rejects missing id or summary", () => {
    const { id: _id, ...noId } = validMinimal;
    const { summary: _summary, ...noSummary } = validMinimal;
    expect(ConsequenceSchema.safeParse(noId).success).toBe(false);
    expect(ConsequenceSchema.safeParse(noSummary).success).toBe(false);
    expect(safeParseConsequence(noSummary).success).toBe(false);
  });

  it("rejects empty id or summary", () => {
    expect(ConsequenceSchema.safeParse({ ...validMinimal, id: "" }).success).toBe(false);
    expect(ConsequenceSchema.safeParse({ ...validMinimal, summary: "" }).success).toBe(false);
  });

  it("rejects malformed state-change lists", () => {
    expect(ConsequenceSchema.safeParse({ ...validMinimal, addFlags: [""] }).success).toBe(
      false,
    );
    expect(ConsequenceSchema.safeParse({ ...validMinimal, removeFlags: "bad" }).success).toBe(
      false,
    );
    expect(
      ConsequenceSchema.safeParse({ ...validMinimal, unlockGoals: ["", "goal_ok"] }).success,
    ).toBe(false);
    expect(
      ConsequenceSchema.safeParse({ ...validMinimal, visibleChanges: [""] }).success,
    ).toBe(false);
    expect(
      ConsequenceSchema.safeParse({
        ...validMinimal,
        npcUpdates: [{ npcId: "", attitude: "neutral" }],
      }).success,
    ).toBe(false);
    expect(
      ConsequenceSchema.safeParse({
        ...validMinimal,
        npcUpdates: [{ npcId: "npc_ogre", attitude: "unknown" }],
      }).success,
    ).toBe(false);
    expect(
      ConsequenceSchema.safeParse({
        ...validMinimal,
        temporaryInstances: [""],
      }).success,
    ).toBe(false);
  });

  it("validates JSON example from packages/content/examples", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "consequence-fight-ogre.example.json"), "utf8"),
    );
    expect(ConsequenceSchema.safeParse(example).success).toBe(true);
  });
});
