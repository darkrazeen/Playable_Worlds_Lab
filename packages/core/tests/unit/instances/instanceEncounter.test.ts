import { describe, expect, it } from "vitest";

import {
  MAX_INSTANCE_ENCOUNTER_CHOICES,
  parseInstanceEncounter,
  safeParseInstanceEncounter,
  validateInstanceEncounterAgainstWorld,
} from "../../../src/instances/instanceEncounter.js";
import type { WorldDefinition } from "../../../src/schemas/worldDefinition.js";

const caveBatsEncounter = {
  id: "encounter_cave_bats",
  title: "Cave Bats",
  description: "A cloud of bats erupts from a gap in the rubble.",
  choices: [
    {
      id: "scare_bats",
      label: "Wave the torch",
      consequenceId: "consequence_scare_cave_bats",
    },
    {
      id: "fight_bats",
      label: "Push through the swarm",
      consequenceId: "consequence_fight_cave_bats",
    },
  ],
};

function minimalWorld(consequences: WorldDefinition["consequences"]): WorldDefinition {
  return {
    id: "world_test",
    schemaVersion: "0.2.0",
    title: "Test",
    summary: "Test world",
    worldDNA: {
      genre: "fantasy",
      tone: "heroic",
      sessionLengthMinutes: 30,
      coreLoop: ["explore"],
      consequenceIntensity: "medium",
      aiCreativity: "balanced",
      safetyMode: "teen",
    },
    startingBeatId: "beat_start",
    storyBeats: [
      {
        id: "beat_start",
        title: "Start",
        description: "Start beat",
        trigger: "start",
        availableChoices: [],
        possibleConsequences: [],
      },
    ],
    consequences,
    npcs: [],
    temporaryInstances: [],
  };
}

describe("instanceEncounter schema", () => {
  it("parses a bounded encounter with linked consequences", () => {
    const encounter = parseInstanceEncounter(caveBatsEncounter);
    expect(encounter.id).toBe("encounter_cave_bats");
    expect(encounter.choices).toHaveLength(2);
  });

  it("rejects encounters with too many choices", () => {
    const tooManyChoices = {
      ...caveBatsEncounter,
      choices: Array.from({ length: MAX_INSTANCE_ENCOUNTER_CHOICES + 1 }, (_, index) => ({
        id: `choice_${index}`,
        label: `Choice ${index}`,
        consequenceId: "consequence_scare_cave_bats",
      })),
    };
    const parsed = safeParseInstanceEncounter(tooManyChoices);
    expect(parsed.success).toBe(false);
  });

  it("validates consequence ids against the world definition", () => {
    const encounter = parseInstanceEncounter(caveBatsEncounter);
    const missing = validateInstanceEncounterAgainstWorld(encounter, minimalWorld([]));
    expect(missing.ok).toBe(false);
    expect(missing.errors[0]).toContain("consequence_scare_cave_bats");

    const world = minimalWorld([
      {
        id: "consequence_scare_cave_bats",
        summary: "Scare bats",
        addFlags: ["bats_scattered"],
        removeFlags: [],
        unlockGoals: [],
        completeGoals: [],
        exposeLocations: [],
        closeLocations: [],
        visibleChanges: [],
        npcUpdates: [],
        temporaryInstances: [],
      },
      {
        id: "consequence_fight_cave_bats",
        summary: "Fight bats",
        addFlags: ["cave_bats_cleared"],
        removeFlags: [],
        unlockGoals: [],
        completeGoals: [],
        exposeLocations: [],
        closeLocations: [],
        visibleChanges: [],
        npcUpdates: [],
        temporaryInstances: [],
      },
    ]);
    const valid = validateInstanceEncounterAgainstWorld(encounter, world);
    expect(valid.ok).toBe(true);
  });
});
