import { describe, expect, it } from "vitest";

import {
  activateTemporaryInstance,
  applyInstanceEncounterChoice,
  CAVE_EXPOSED_FLAG,
  moveToTemporaryRoom,
  parseInstanceEncounter,
  STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
} from "../../../src/instances/index.js";
import { createEmptyWorldLedger } from "../../../src/schemas/worldLedger.js";
import type { TemporaryInstance } from "../../../src/schemas/temporaryInstance.js";
import type { WorldDefinition } from "../../../src/schemas/worldDefinition.js";
import type { WorldSession } from "../../../src/schemas/worldSession.js";

const caveBatsEncounter = parseInstanceEncounter({
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
});

const hiddenCave: TemporaryInstance = {
  id: STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
  title: "The Hidden Cave",
  type: "cave",
  entranceText: "Cold air spills from a jagged opening.",
  requiredEntryFlags: [CAVE_EXPOSED_FLAG],
  rooms: [
    {
      id: "room_cave_entrance",
      title: "Cave Mouth",
      description: "Mud lines the narrow entrance.",
      interactions: [],
      connectedRoomIds: ["room_fallen_rocks"],
    },
    {
      id: "room_fallen_rocks",
      title: "Fallen Rocks",
      description: "Boulders block the path.",
      interactions: [],
      encounter: "encounter_cave_bats",
      connectedRoomIds: ["room_cave_entrance", "room_dragon_chamber"],
    },
    {
      id: "room_dragon_chamber",
      title: "Dragon Chamber",
      description: "Something stirs in the dark.",
      interactions: [],
      connectedRoomIds: ["room_fallen_rocks"],
    },
  ],
  completionCondition: "reached_dragon_chamber",
  completionConsequenceId: "consequence_cave_complete",
  cleanupBehavior: "collapse",
};

function testWorld(): WorldDefinition {
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
    consequences: [
      {
        id: "consequence_scare_cave_bats",
        summary: "You raise a torch and the bats scatter.",
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
        summary: "You push through the swarm.",
        addFlags: ["bats_fought", "cave_bats_cleared"],
        removeFlags: [],
        unlockGoals: [],
        completeGoals: [],
        exposeLocations: [],
        closeLocations: [],
        visibleChanges: [],
        npcUpdates: [],
        temporaryInstances: [],
      },
    ],
    npcs: [],
    temporaryInstances: [hiddenCave],
  };
}

function sessionWithFlags(flags: string[]): WorldSession {
  return {
    id: "session_test",
    schemaVersion: "0.2.0",
    worldId: "world_test",
    worldVersionId: "world_test_v1",
    currentBeatId: "beat_start",
    ledger: {
      ...createEmptyWorldLedger(),
      activeFlags: flags,
    },
    turnNumber: 1,
    choiceHistory: [],
    debugEvents: [],
  };
}

function sessionInFallenRocks(): { world: WorldDefinition; session: WorldSession } {
  const world = testWorld();
  const activated = activateTemporaryInstance(
    world,
    sessionWithFlags([CAVE_EXPOSED_FLAG]),
    STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
  );
  expect(activated.ok).toBe(true);
  const moved = moveToTemporaryRoom(world, activated.session, "room_fallen_rocks");
  expect(moved.ok).toBe(true);
  return { world, session: moved.session };
}

describe("applyInstanceEncounterChoice", () => {
  it("applies a linked consequence and records ledger/debug events", () => {
    const { world, session } = sessionInFallenRocks();

    const applied = applyInstanceEncounterChoice(world, session, "scare_bats", {
      kind: "catalog",
      encountersById: { encounter_cave_bats: caveBatsEncounter },
    });

    expect(applied.ok).toBe(true);
    expect(applied.session.ledger.activeFlags).toContain("bats_scattered");
    expect(
      applied.session.ledger.worldEvents.some(
        (event) =>
          event.type === "instance" &&
          event.metadata?.encounterId === "encounter_cave_bats" &&
          event.metadata?.choiceId === "scare_bats",
      ),
    ).toBe(true);
    expect(
      applied.session.debugEvents.some(
        (event) =>
          event.type === "choice_selected" &&
          event.metadata?.source === "instance_encounter" &&
          event.metadata?.encounterId === "encounter_cave_bats",
      ),
    ).toBe(true);
  });

  it("rejects unknown encounter choices", () => {
    const { world, session } = sessionInFallenRocks();

    const applied = applyInstanceEncounterChoice(world, session, "unknown_choice", {
      kind: "catalog",
      encountersById: { encounter_cave_bats: caveBatsEncounter },
    });

    expect(applied.ok).toBe(false);
    expect(applied.errors[0]).toContain("unknown choice");
    expect(applied.session.ledger.activeFlags).not.toContain("bats_scattered");
  });

  it("rejects encounter choices outside the fallen rocks room", () => {
    const world = testWorld();
    const activated = activateTemporaryInstance(
      world,
      sessionWithFlags([CAVE_EXPOSED_FLAG]),
      STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
    );
    expect(activated.ok).toBe(true);

    const applied = applyInstanceEncounterChoice(world, activated.session, "scare_bats", {
      kind: "catalog",
      encountersById: { encounter_cave_bats: caveBatsEncounter },
    });

    expect(applied.ok).toBe(false);
    expect(applied.errors[0]).toContain("no encounter hook");
  });
});
