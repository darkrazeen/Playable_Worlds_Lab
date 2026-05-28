import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  CURRENT_SCHEMA_VERSION,
  createWorldDefinitionShell,
  parseWorldDefinition,
  safeParseWorldDefinition,
  WorldDefinitionSchema,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const worldDna = {
  genre: "fantasy" as const,
  tone: "heroic" as const,
  sessionLengthMinutes: 15 as const,
  coreLoop: ["reach obstacle", "make choice", "face consequence", "pursue next goal"],
  consequenceIntensity: "medium" as const,
  aiCreativity: "balanced" as const,
  safetyMode: "teen" as const,
};

const ogreBeat = {
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
  ],
  possibleConsequences: ["consequence_fight_ogre"],
};

const fightConsequence = {
  id: "consequence_fight_ogre",
  summary: "You defeat the ogre and clear the bridge.",
};

const validMinimalWorld = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  id: "world_stonepass_valley",
  title: "Stonepass Valley",
  summary: "A compact fantasy proof world blocked by an ogre at the bridge.",
  worldDNA: worldDna,
  startingBeatId: "beat_ogre_bridge",
  storyBeats: [ogreBeat],
  consequences: [fightConsequence],
  npcs: [
    {
      id: "npc_ogre",
      name: "Bridge Ogre",
      role: "blocker",
      description: "A hulking ogre guarding the only bridge into Stonepass Valley.",
      attitude: "hostile" as const,
    },
  ],
};

describe("WorldDefinitionSchema", () => {
  it("accepts a valid minimal Stonepass-like world", () => {
    const result = WorldDefinitionSchema.safeParse(validMinimalWorld);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schemaVersion).toBe("0.2.0");
      expect(result.data.startingBeatId).toBe("beat_ogre_bridge");
      expect(result.data.storyBeats).toHaveLength(1);
      expect(result.data.consequences).toHaveLength(1);
      expect(result.data.npcs).toHaveLength(1);
    }
  });

  it("parses via parseWorldDefinition helper", () => {
    const world = parseWorldDefinition(validMinimalWorld);
    expect(world.id).toBe("world_stonepass_valley");
    expect(world.worldDNA.safetyMode).toBe("teen");
  });

  it("creates a shell with createWorldDefinitionShell using current schema version", () => {
    const { schemaVersion: _schemaVersion, ...body } = validMinimalWorld;
    const world = createWorldDefinitionShell(body);
    expect(world.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("defaults omitted npcs and temporaryInstances to empty arrays", () => {
    const { npcs: _npcs, ...withoutNpcs } = validMinimalWorld;
    const world = parseWorldDefinition(withoutNpcs);
    expect(world.npcs).toEqual([]);
    expect(world.temporaryInstances).toEqual([]);
  });

  it("accepts optional generationSeed and temporaryInstances", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "temporary-instance-hidden-cave.example.json"), "utf8"),
    );
    expect(
      WorldDefinitionSchema.safeParse({
        ...validMinimalWorld,
        generationSeed: "stonepass-seed-001",
        temporaryInstances: [example],
      }).success,
    ).toBe(true);
  });

  it("rejects missing startingBeatId, storyBeats, or consequences", () => {
    const { startingBeatId: _startingBeatId, ...noStartingBeat } = validMinimalWorld;
    const { storyBeats: _storyBeats, ...noBeats } = validMinimalWorld;
    const { consequences: _consequences, ...noConsequences } = validMinimalWorld;
    expect(WorldDefinitionSchema.safeParse(noStartingBeat).success).toBe(false);
    expect(WorldDefinitionSchema.safeParse(noBeats).success).toBe(false);
    expect(WorldDefinitionSchema.safeParse(noConsequences).success).toBe(false);
    expect(safeParseWorldDefinition(noConsequences).success).toBe(false);
  });

  it("rejects empty storyBeats or consequences arrays", () => {
    expect(
      WorldDefinitionSchema.safeParse({ ...validMinimalWorld, storyBeats: [] }).success,
    ).toBe(false);
    expect(
      WorldDefinitionSchema.safeParse({ ...validMinimalWorld, consequences: [] }).success,
    ).toBe(false);
  });

  it("rejects missing schemaVersion, id, title, summary, or worldDNA", () => {
    const { schemaVersion: _schemaVersion, ...noVersion } = validMinimalWorld;
    const { id: _id, ...noId } = validMinimalWorld;
    const { title: _title, ...noTitle } = validMinimalWorld;
    const { summary: _summary, ...noSummary } = validMinimalWorld;
    const { worldDNA: _worldDNA, ...noDna } = validMinimalWorld;
    expect(WorldDefinitionSchema.safeParse(noVersion).success).toBe(false);
    expect(WorldDefinitionSchema.safeParse(noId).success).toBe(false);
    expect(WorldDefinitionSchema.safeParse(noTitle).success).toBe(false);
    expect(WorldDefinitionSchema.safeParse(noSummary).success).toBe(false);
    expect(WorldDefinitionSchema.safeParse(noDna).success).toBe(false);
  });

  it("rejects malformed nested beats, consequences, or npcs", () => {
    expect(
      WorldDefinitionSchema.safeParse({
        ...validMinimalWorld,
        storyBeats: [{ ...ogreBeat, title: "" }],
      }).success,
    ).toBe(false);
    expect(
      WorldDefinitionSchema.safeParse({
        ...validMinimalWorld,
        consequences: [{ ...fightConsequence, summary: "" }],
      }).success,
    ).toBe(false);
    expect(
      WorldDefinitionSchema.safeParse({
        ...validMinimalWorld,
        npcs: [{ id: "npc_bad", name: "", role: "x", description: "y" }],
      }).success,
    ).toBe(false);
  });

  it("validates JSON example from packages/content/examples", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "world-definition-stonepass-minimal.example.json"), "utf8"),
    );
    expect(WorldDefinitionSchema.safeParse(example).success).toBe(true);
  });
});
