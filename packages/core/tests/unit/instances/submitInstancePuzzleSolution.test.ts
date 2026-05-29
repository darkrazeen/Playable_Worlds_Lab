import { describe, expect, it } from "vitest";

import {
  activateTemporaryInstance,
  CAVE_EXPOSED_FLAG,
  moveToTemporaryRoom,
  parseInstancePuzzle,
  STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
  submitInstancePuzzleSolution,
} from "../../../src/instances/index.js";
import { createEmptyWorldLedger } from "../../../src/schemas/worldLedger.js";
import type { TemporaryInstance } from "../../../src/schemas/temporaryInstance.js";
import type { WorldDefinition } from "../../../src/schemas/worldDefinition.js";
import type { WorldSession } from "../../../src/schemas/worldSession.js";

const dragonRunesPuzzle = parseInstancePuzzle({
  id: "puzzle_dragon_runes",
  title: "Dragon Runes",
  description: "Ancient runes circle a sealed pedestal.",
  solutions: [
    {
      id: "trace_warmth_rune",
      label: "Trace the warm rune",
      consequenceId: "consequence_wrong_dragon_rune",
      completesPuzzle: false,
    },
    {
      id: "align_awakening_sequence",
      label: "Align the awakening sequence",
      consequenceId: "consequence_solve_dragon_runes",
      completesPuzzle: true,
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
      connectedRoomIds: ["room_cave_entrance", "room_dragon_chamber"],
    },
    {
      id: "room_dragon_chamber",
      title: "Dragon Chamber",
      description: "Something stirs in the dark.",
      interactions: [],
      puzzle: "puzzle_dragon_runes",
      connectedRoomIds: ["room_fallen_rocks"],
    },
  ],
  completionCondition: "reached_dragon_chamber",
  completionConsequenceId: "consequence_cave_complete",
  cleanupBehavior: "collapse",
};

function minimalConsequence(id: string, summary: string, addFlags: string[]) {
  return {
    id,
    summary,
    addFlags,
    removeFlags: [],
    unlockGoals: [],
    completeGoals: [],
    exposeLocations: [],
    closeLocations: [],
    visibleChanges: [],
    npcUpdates: [],
    temporaryInstances: [],
  };
}

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
      minimalConsequence("consequence_wrong_dragon_rune", "Wrong rune", [
        "dragon_runes_failed_attempt",
      ]),
      minimalConsequence("consequence_solve_dragon_runes", "Solved runes", ["dragon_runes_solved"]),
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
  const world = testWorld();
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

describe("submitInstancePuzzleSolution", () => {
  it("completes the puzzle and records ledger/debug events", () => {
    const { world, session } = sessionInDragonChamber();

    const submitted = submitInstancePuzzleSolution(world, session, "align_awakening_sequence", {
      kind: "catalog",
      puzzlesById: { puzzle_dragon_runes: dragonRunesPuzzle },
    });

    expect(submitted.ok).toBe(true);
    expect(submitted.completesPuzzle).toBe(true);
    expect(submitted.session.ledger.activeFlags).toContain("dragon_runes_solved");
    expect(
      submitted.session.ledger.worldEvents.some(
        (event) =>
          event.type === "instance" &&
          event.metadata?.puzzleId === "puzzle_dragon_runes" &&
          event.metadata?.completesPuzzle === true,
      ),
    ).toBe(true);
    expect(
      submitted.session.debugEvents.some(
        (event) => event.type === "choice_selected" && event.metadata?.source === "instance_puzzle",
      ),
    ).toBe(true);
  });

  it("applies a wrong solution consequence without completing the puzzle", () => {
    const { world, session } = sessionInDragonChamber();

    const submitted = submitInstancePuzzleSolution(world, session, "trace_warmth_rune", {
      kind: "catalog",
      puzzlesById: { puzzle_dragon_runes: dragonRunesPuzzle },
    });

    expect(submitted.ok).toBe(true);
    expect(submitted.completesPuzzle).toBe(false);
    expect(submitted.session.ledger.activeFlags).toContain("dragon_runes_failed_attempt");
    expect(submitted.session.ledger.activeFlags).not.toContain("dragon_runes_solved");
  });

  it("rejects unknown puzzle solutions without mutating session flags", () => {
    const { world, session } = sessionInDragonChamber();

    const submitted = submitInstancePuzzleSolution(world, session, "unknown_solution", {
      kind: "catalog",
      puzzlesById: { puzzle_dragon_runes: dragonRunesPuzzle },
    });

    expect(submitted.ok).toBe(false);
    expect(submitted.errors[0]).toContain("unknown solution");
    expect(submitted.session.ledger.activeFlags).not.toContain("dragon_runes_solved");
  });

  it("rejects puzzle submissions outside the dragon chamber room", () => {
    const world = testWorld();
    const activated = activateTemporaryInstance(
      world,
      sessionWithFlags([CAVE_EXPOSED_FLAG]),
      STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
    );
    expect(activated.ok).toBe(true);

    const submitted = submitInstancePuzzleSolution(
      world,
      activated.session,
      "align_awakening_sequence",
      {
        kind: "catalog",
        puzzlesById: { puzzle_dragon_runes: dragonRunesPuzzle },
      },
    );

    expect(submitted.ok).toBe(false);
    expect(submitted.errors[0]).toContain("no puzzle hook");
  });
});
