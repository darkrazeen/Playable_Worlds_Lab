import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { NpcSchema, parseNpc, safeParseNpc } from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validOgre = {
  id: "npc_ogre",
  name: "Bridge Ogre",
  role: "blocker",
  description: "A hulking ogre guarding the only bridge into Stonepass Valley.",
  attitude: "hostile",
  toneRules: ["gruff", "simple speech"],
  knownFlags: ["ogre_blocks_bridge"],
};

const validElder = {
  id: "npc_elder",
  name: "Elder Mara",
  role: "elder",
  description: "The village elder who watches over Stonepass from the town square.",
  attitude: "neutral",
};

describe("NpcSchema", () => {
  it("accepts a valid ogre NPC profile", () => {
    const result = NpcSchema.safeParse(validOgre);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attitude).toBe("hostile");
    }
  });

  it("accepts a valid elder NPC profile", () => {
    expect(NpcSchema.safeParse(validElder).success).toBe(true);
  });

  it("parses via parseNpc helper", () => {
    const npc = parseNpc(validOgre);
    expect(npc.id).toBe("npc_ogre");
    expect(npc.name).toBe("Bridge Ogre");
  });

  it("defaults omitted attitude to neutral and arrays to empty", () => {
    const minimal = {
      id: "npc_traveler",
      name: "Traveler",
      role: "wanderer",
      description: "A quiet traveler passing through Stonepass.",
    };
    const npc = parseNpc(minimal);
    expect(npc.attitude).toBe("neutral");
    expect(npc.toneRules).toEqual([]);
    expect(npc.knownFlags).toEqual([]);
  });

  it("accepts merged v4.2 attitude values", () => {
    for (const attitude of [
      "hostile",
      "neutral",
      "friendly",
      "afraid",
      "curious",
      "trusting",
      "fearful",
    ] as const) {
      expect(NpcSchema.safeParse({ ...validOgre, attitude }).success).toBe(true);
    }
  });

  it("rejects missing required fields", () => {
    const { name: _name, ...noName } = validOgre;
    const { role: _role, ...noRole } = validOgre;
    const { description: _description, ...noDescription } = validOgre;
    expect(NpcSchema.safeParse(noName).success).toBe(false);
    expect(NpcSchema.safeParse(noRole).success).toBe(false);
    expect(NpcSchema.safeParse(noDescription).success).toBe(false);
    expect(safeParseNpc(noName).success).toBe(false);
  });

  it("rejects empty id, name, role, or description", () => {
    expect(NpcSchema.safeParse({ ...validOgre, id: "" }).success).toBe(false);
    expect(NpcSchema.safeParse({ ...validOgre, name: "" }).success).toBe(false);
    expect(NpcSchema.safeParse({ ...validOgre, role: "" }).success).toBe(false);
    expect(NpcSchema.safeParse({ ...validOgre, description: "" }).success).toBe(false);
  });

  it("rejects invalid attitude values", () => {
    expect(NpcSchema.safeParse({ ...validOgre, attitude: "angry" }).success).toBe(false);
    expect(NpcSchema.safeParse({ ...validOgre, attitude: "unknown" }).success).toBe(false);
  });

  it("rejects malformed toneRules and knownFlags arrays", () => {
    expect(NpcSchema.safeParse({ ...validOgre, toneRules: [""] }).success).toBe(false);
    expect(NpcSchema.safeParse({ ...validOgre, toneRules: "gruff" }).success).toBe(false);
    expect(NpcSchema.safeParse({ ...validOgre, knownFlags: [""] }).success).toBe(false);
    expect(NpcSchema.safeParse({ ...validOgre, knownFlags: "ogre_blocks_bridge" }).success).toBe(
      false,
    );
  });

  it("validates ogre JSON example from packages/content/examples", () => {
    const example = JSON.parse(readFileSync(join(examplesDir, "npc-ogre.example.json"), "utf8"));
    expect(NpcSchema.safeParse(example).success).toBe(true);
  });

  it("validates elder JSON example from packages/content/examples", () => {
    const example = JSON.parse(readFileSync(join(examplesDir, "npc-elder.example.json"), "utf8"));
    expect(NpcSchema.safeParse(example).success).toBe(true);
  });
});
