import { describe, expect, it } from "vitest";

import {
  activateTemporaryInstance,
  CAVE_EXPOSED_FLAG,
  getCurrentTemporaryInstanceRoom,
  listConnectedTemporaryRoomIds,
  moveToTemporaryRoom,
  STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
  validateTemporaryRoomMove,
} from "../../../src/instances/index.js";
import { resolveSessionTemporaryInstanceRoom } from "../../../src/session/temporaryInstanceRoom.js";
import { createEmptyWorldLedger } from "../../../src/schemas/worldLedger.js";
import type { WorldDefinition } from "../../../src/schemas/worldDefinition.js";
import type { WorldSession } from "../../../src/schemas/worldSession.js";

const hiddenCave = {
  id: STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
  title: "The Hidden Cave",
  type: "cave" as const,
  entranceText: "Cold air spills from a jagged opening.",
  requiredEntryFlags: [CAVE_EXPOSED_FLAG],
  rooms: [
    {
      id: "room_cave_entrance",
      title: "Cave Mouth",
      description: "Mud lines the narrow entrance.",
      connectedRoomIds: ["room_fallen_rocks"],
    },
    {
      id: "room_fallen_rocks",
      title: "Fallen Rocks",
      description: "Boulders block the path.",
      connectedRoomIds: ["room_cave_entrance", "room_dragon_chamber"],
    },
    {
      id: "room_dragon_chamber",
      title: "Dragon Chamber",
      description: "Something stirs in the dark.",
      connectedRoomIds: ["room_fallen_rocks"],
    },
  ],
  completionCondition: "reached_dragon_chamber",
  completionConsequenceId: "consequence_cave_complete",
  cleanupBehavior: "collapse" as const,
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
      coreLoop: "explore",
      consequenceIntensity: "moderate",
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
    consequences: [],
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

function activatedSession(world: WorldDefinition, session: WorldSession): WorldSession {
  const result = activateTemporaryInstance(world, session, STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
  expect(result.ok).toBe(true);
  return result.session;
}

describe("temporaryInstanceRoom", () => {
  it("enters the first room on activation", () => {
    const world = minimalWorld();
    const session = activatedSession(world, sessionWithFlags([CAVE_EXPOSED_FLAG]));

    expect(session.currentTemporaryRoomId).toBe("room_cave_entrance");
    const room = getCurrentTemporaryInstanceRoom(world, session);
    expect(room?.title).toBe("Cave Mouth");

    const context = resolveSessionTemporaryInstanceRoom(world, session);
    expect(context?.instanceId).toBe(STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
    expect(context?.currentRoom.id).toBe("room_cave_entrance");
  });

  it("lists connected rooms from the current room", () => {
    const world = minimalWorld();
    activatedSession(world, sessionWithFlags([CAVE_EXPOSED_FLAG]));
    const instance = world.temporaryInstances[0]!;

    expect(listConnectedTemporaryRoomIds(instance, "room_cave_entrance")).toEqual([
      "room_fallen_rocks",
    ]);
  });

  it("moves to a connected room", () => {
    const world = minimalWorld();
    const session = activatedSession(world, sessionWithFlags([CAVE_EXPOSED_FLAG]));

    const moved = moveToTemporaryRoom(world, session, "room_fallen_rocks");
    expect(moved.ok).toBe(true);
    expect(moved.session.currentTemporaryRoomId).toBe("room_fallen_rocks");
    expect(moved.fromRoom?.id).toBe("room_cave_entrance");
    expect(moved.toRoom?.id).toBe("room_fallen_rocks");
  });

  it("rejects move to a missing room id", () => {
    const world = minimalWorld();
    const session = activatedSession(world, sessionWithFlags([CAVE_EXPOSED_FLAG]));

    const validated = validateTemporaryRoomMove(world, session, "room_missing");
    expect(validated.ok).toBe(false);
    expect(validated.errors[0]).toContain("unknown room");

    const moved = moveToTemporaryRoom(world, session, "room_missing");
    expect(moved.ok).toBe(false);
    expect(moved.session.currentTemporaryRoomId).toBe("room_cave_entrance");
    expect(moved.session.debugEvents.some((e) => e.type === "validation_failed")).toBe(true);
  });

  it("rejects move to a non-connected room", () => {
    const world = minimalWorld();
    const session = activatedSession(world, sessionWithFlags([CAVE_EXPOSED_FLAG]));

    const moved = moveToTemporaryRoom(world, session, "room_dragon_chamber");
    expect(moved.ok).toBe(false);
    expect(moved.errors[0]).toContain("not connected");
    expect(moved.session.currentTemporaryRoomId).toBe("room_cave_entrance");
  });

  it("rejects room move when no active instance", () => {
    const world = minimalWorld();
    const session = sessionWithFlags([CAVE_EXPOSED_FLAG]);

    const moved = moveToTemporaryRoom(world, session, "room_fallen_rocks");
    expect(moved.ok).toBe(false);
    expect(moved.errors[0]).toContain("no active temporary instance");
  });
});
