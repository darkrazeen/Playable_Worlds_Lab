import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  parseAndValidateWorldDefinition,
  parseWorldDefinition,
  validateWorldDefinition,
} from "../../../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");
const stonepassWorldPath = join(
  contentRoot,
  "worlds/stonepass/stonepass-valley.world.json",
);
const invalidExamplePath = join(
  contentRoot,
  "examples/world-definition-stonepass-invalid.example.json",
);

function loadStonepassWorld() {
  return JSON.parse(readFileSync(stonepassWorldPath, "utf8"));
}

describe("Stonepass Valley world content", () => {
  it("loads canonical stonepass-valley.world.json and passes parse + cross-file validation", () => {
    const raw = loadStonepassWorld();
    const result = parseAndValidateWorldDefinition(raw);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.world?.id).toBe("world_stonepass_valley");
    expect(result.world?.schemaVersion).toBe("0.2.0");
    expect(result.world?.startingBeatId).toBe("beat_ogre_bridge");
  });

  it("includes the v1 proof chain elements in the canonical world", () => {
    const world = parseWorldDefinition(loadStonepassWorld());

    const ogreBeat = world.storyBeats.find((beat) => beat.id === "beat_ogre_bridge");
    expect(ogreBeat?.availableChoices).toHaveLength(5);

    const fightConsequence = world.consequences.find((c) => c.id === "consequence_fight_ogre");
    expect(fightConsequence?.addFlags).toContain("landslide_triggered");
    expect(fightConsequence?.temporaryInstances).toContain("instance_hidden_cave");

    const caveComplete = world.consequences.find((c) => c.id === "consequence_cave_complete");
    expect(caveComplete?.addFlags).toContain("dragon_awake");

    const hiddenCave = world.temporaryInstances.find((i) => i.id === "instance_hidden_cave");
    expect(hiddenCave?.completionConsequenceId).toBe("consequence_cave_complete");
    expect(hiddenCave?.requiredEntryFlags).toContain("landslide_triggered");
  });

  it("rejects world-definition-stonepass-invalid.example.json", () => {
    const raw = JSON.parse(readFileSync(invalidExamplePath, "utf8"));
    const parsed = parseWorldDefinition(raw);
    const result = validateWorldDefinition(parsed);

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("unknown consequence"))).toBe(true);
  });
});
