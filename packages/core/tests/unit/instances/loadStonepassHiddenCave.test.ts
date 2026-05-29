import { describe, expect, it } from "vitest";

import {
  activateTemporaryInstance,
  CAVE_EXPOSED_FLAG,
  canEnterTemporaryInstance,
  loadTemporaryInstance,
  loadStonepassHiddenCave,
  STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
  validateTemporaryInstanceEntry,
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
      connectedRoomIds: [],
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

describe("temporaryInstanceEntry", () => {
  it("blocks cave load without cave_exposed", () => {
    const world = minimalWorld();
    const session = sessionWithFlags(["landslide_triggered"]);

    expect(canEnterTemporaryInstance(session, hiddenCave)).toBe(false);

    const result = validateTemporaryInstanceEntry(
      world,
      session,
      STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes(CAVE_EXPOSED_FLAG))).toBe(true);
  });

  it("allows cave load when cave_exposed is active", () => {
    const world = minimalWorld();
    const session = sessionWithFlags([CAVE_EXPOSED_FLAG]);

    const loaded = loadTemporaryInstance(world, session, STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
    expect(loaded.ok).toBe(true);
    expect(loaded.instance?.id).toBe(STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
  });

  it("rejects unknown instance id", () => {
    const world = minimalWorld();
    const session = sessionWithFlags([CAVE_EXPOSED_FLAG]);

    const result = loadTemporaryInstance(world, session, "instance_missing");
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("unknown temporary instance");
  });
});

describe("activateTemporaryInstance", () => {
  it("activates cave on session at first room when cave_exposed", () => {
    const world = minimalWorld();
    const session = sessionWithFlags([CAVE_EXPOSED_FLAG]);
    const before = JSON.stringify(session);

    const {
      ok,
      session: next,
      instance,
    } = activateTemporaryInstance(world, session, STONEPASS_HIDDEN_CAVE_INSTANCE_ID);

    expect(ok).toBe(true);
    expect(instance?.id).toBe(STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
    expect(next.activeTemporaryInstanceId).toBe(STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
    expect(next.currentTemporaryRoomId).toBe("room_cave_entrance");
    expect(JSON.parse(before).ledger).toEqual(session.ledger);
  });

  it("does not activate cave without cave_exposed and records validation failure", () => {
    const world = minimalWorld();
    const session = sessionWithFlags([]);

    const { ok, session: next } = activateTemporaryInstance(
      world,
      session,
      STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
    );

    expect(ok).toBe(false);
    expect(next.activeTemporaryInstanceId).toBeUndefined();
    expect(next.debugEvents.some((e) => e.type === "validation_failed")).toBe(true);
  });
});

describe("loadStonepassHiddenCave", () => {
  it("delegates to the Stonepass hidden cave instance id", () => {
    const world = minimalWorld();
    const session = sessionWithFlags([CAVE_EXPOSED_FLAG]);

    const result = loadStonepassHiddenCave(world, session);
    expect(result.ok).toBe(true);
    expect(result.instance?.title).toBe("The Hidden Cave");
  });
});
