import { describe, expect, it } from "vitest";

import {
  MAX_INSTANCE_PUZZLE_SOLUTIONS,
  parseInstancePuzzle,
  safeParseInstancePuzzle,
  validateInstancePuzzleAgainstWorld,
} from "../../../src/instances/instancePuzzle.js";
import type { WorldDefinition } from "../../../src/schemas/worldDefinition.js";

const dragonRunesPuzzle = {
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

describe("instancePuzzle schema", () => {
  it("parses a bounded puzzle with a completion solution", () => {
    const puzzle = parseInstancePuzzle(dragonRunesPuzzle);
    expect(puzzle.id).toBe("puzzle_dragon_runes");
    expect(puzzle.solutions).toHaveLength(2);
  });

  it("rejects puzzles with too many solutions", () => {
    const tooManySolutions = {
      ...dragonRunesPuzzle,
      solutions: Array.from({ length: MAX_INSTANCE_PUZZLE_SOLUTIONS + 1 }, (_, index) => ({
        id: `solution_${index}`,
        label: `Solution ${index}`,
        consequenceId: "consequence_solve_dragon_runes",
        completesPuzzle: index === 0,
      })),
    };
    const parsed = safeParseInstancePuzzle(tooManySolutions);
    expect(parsed.success).toBe(false);
  });

  it("rejects puzzles without a completion solution", () => {
    const parsed = safeParseInstancePuzzle({
      ...dragonRunesPuzzle,
      solutions: [
        {
          id: "trace_warmth_rune",
          label: "Trace the warm rune",
          consequenceId: "consequence_wrong_dragon_rune",
          completesPuzzle: false,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("validates consequence ids against the world definition", () => {
    const puzzle = parseInstancePuzzle(dragonRunesPuzzle);
    const missing = validateInstancePuzzleAgainstWorld(puzzle, minimalWorld([]));
    expect(missing.ok).toBe(false);
    expect(missing.errors[0]).toContain("consequence_wrong_dragon_rune");

    const world = minimalWorld([
      minimalConsequence("consequence_wrong_dragon_rune", "Wrong rune", [
        "dragon_runes_failed_attempt",
      ]),
      minimalConsequence("consequence_solve_dragon_runes", "Solved runes", ["dragon_runes_solved"]),
    ]);
    const valid = validateInstancePuzzleAgainstWorld(puzzle, world);
    expect(valid.ok).toBe(true);
  });
});
