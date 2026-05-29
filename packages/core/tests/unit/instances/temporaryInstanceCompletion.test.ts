import { describe, expect, it } from "vitest";

import {
  isTemporaryInstanceCompletionReady,
  resolveCompletionTargetRoomId,
  validateTemporaryInstanceCompletion,
} from "../../../src/instances/temporaryInstanceCompletion.js";
import { createEmptyWorldLedger } from "../../../src/schemas/worldLedger.js";
import type { TemporaryInstance } from "../../../src/schemas/temporaryInstance.js";
import type { WorldDefinition } from "../../../src/schemas/worldDefinition.js";
import type { WorldSession } from "../../../src/schemas/worldSession.js";
import {
  CAVE_EXPOSED_FLAG,
  STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
} from "../../../src/instances/stonepassInstances.js";

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
        summary: "The cave completes.",
        addFlags: ["dragon_awake"],
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

function sessionInInstance(roomId: string): WorldSession {
  return {
    id: "session_test",
    schemaVersion: "0.2.0",
    worldId: "world_test",
    worldVersionId: "world_test_v1",
    currentBeatId: "beat_start",
    activeTemporaryInstanceId: STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
    currentTemporaryRoomId: roomId,
    ledger: createEmptyWorldLedger(),
    turnNumber: 1,
    choiceHistory: [],
    debugEvents: [],
  };
}

describe("temporaryInstanceCompletion", () => {
  it("maps reached_* completion conditions to room ids", () => {
    expect(resolveCompletionTargetRoomId(hiddenCave)).toBe("room_dragon_chamber");
  });

  it("validates completion when the player is in the target room", () => {
    const world = minimalWorld();
    const session = sessionInInstance("room_dragon_chamber");

    expect(isTemporaryInstanceCompletionReady(hiddenCave, session)).toBe(true);
    const validated = validateTemporaryInstanceCompletion(world, session);
    expect(validated.ok).toBe(true);
    expect(validated.targetRoomId).toBe("room_dragon_chamber");
  });

  it("rejects completion before reaching the target room", () => {
    const world = minimalWorld();
    const session = sessionInInstance("room_cave_entrance");

    const validated = validateTemporaryInstanceCompletion(world, session);
    expect(validated.ok).toBe(false);
    expect(validated.errors[0]).toContain("room_dragon_chamber");
  });

  it("rejects completion when no instance is active", () => {
    const world = minimalWorld();
    const session = {
      ...sessionInInstance("room_dragon_chamber"),
      activeTemporaryInstanceId: undefined,
      currentTemporaryRoomId: undefined,
    };

    const validated = validateTemporaryInstanceCompletion(world, session);
    expect(validated.ok).toBe(false);
    expect(validated.errors[0]).toContain("no active temporary instance");
  });
});
