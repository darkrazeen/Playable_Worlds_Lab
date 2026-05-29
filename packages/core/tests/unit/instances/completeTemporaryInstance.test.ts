import { describe, expect, it } from "vitest";

import {
  activateTemporaryInstance,
  CAVE_EXPOSED_FLAG,
  completeTemporaryInstance,
  moveToTemporaryRoom,
  STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
} from "../../../src/instances/index.js";
import { createEmptyWorldLedger } from "../../../src/schemas/worldLedger.js";
import type { TemporaryInstance } from "../../../src/schemas/temporaryInstance.js";
import type { WorldDefinition } from "../../../src/schemas/worldDefinition.js";
import type { WorldSession } from "../../../src/schemas/worldSession.js";

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

function minimalWorld(): WorldDefinition {
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
        id: "consequence_cave_complete",
        summary: "The cave completes and the dragon wakes.",
        addFlags: ["dragon_awake", "cave_collapsed"],
        removeFlags: [],
        unlockGoals: ["goal_face_dragon"],
        completeGoals: [],
        exposeLocations: [],
        closeLocations: [],
        visibleChanges: ["Stone rains down behind you."],
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

function sessionInDragonChamber(): { world: WorldDefinition; session: WorldSession } {
  const world = minimalWorld();
  const activated = activateTemporaryInstance(
    world,
    sessionWithFlags([CAVE_EXPOSED_FLAG]),
    STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
  );
  expect(activated.ok).toBe(true);
  const toRocks = moveToTemporaryRoom(world, activated.session, "room_fallen_rocks");
  expect(toRocks.ok).toBe(true);
  const toChamber = moveToTemporaryRoom(world, toRocks.session, "room_dragon_chamber");
  expect(toChamber.ok).toBe(true);
  return { world, session: toChamber.session };
}

describe("completeTemporaryInstance", () => {
  it("applies the completion consequence, logs cleanup, and returns to the main world", () => {
    const { world, session } = sessionInDragonChamber();

    const completed = completeTemporaryInstance(world, session);
    expect(completed.ok).toBe(true);
    expect(completed.cleanupBehavior).toBe("collapse");
    expect(completed.session.activeTemporaryInstanceId).toBeUndefined();
    expect(completed.session.currentTemporaryRoomId).toBeUndefined();
    expect(completed.session.ledger.activeFlags).toContain("dragon_awake");
    expect(
      completed.session.ledger.worldEvents.some(
        (event) =>
          event.type === "instance" &&
          event.metadata?.cleanupBehavior === "collapse" &&
          event.metadata?.instanceId === STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
      ),
    ).toBe(true);
    expect(
      completed.session.debugEvents.some(
        (event) =>
          event.type === "choice_selected" && event.metadata?.source === "instance_cleanup",
      ),
    ).toBe(true);
    expect(
      completed.session.debugEvents.some((event) => event.type === "consequence_applied"),
    ).toBe(true);
  });

  it("fails gracefully when completion conditions are not met", () => {
    const world = minimalWorld();
    const activated = activateTemporaryInstance(
      world,
      sessionWithFlags([CAVE_EXPOSED_FLAG]),
      STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
    );
    expect(activated.ok).toBe(true);

    const completed = completeTemporaryInstance(world, activated.session);
    expect(completed.ok).toBe(false);
    expect(completed.errors[0]).toContain("room_dragon_chamber");
    expect(completed.session.activeTemporaryInstanceId).toBe(STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
    expect(completed.session.ledger.activeFlags).not.toContain("dragon_awake");
    expect(completed.session.debugEvents.some((event) => event.type === "validation_failed")).toBe(
      true,
    );
  });
});
