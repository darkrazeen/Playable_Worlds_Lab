import { applyConsequenceEngine } from "../consequence/consequenceEngine.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import {
  findInstancePuzzleSolution,
  validateInstancePuzzleAgainstWorld,
  type InstancePuzzle,
} from "./instancePuzzle.js";
import {
  appendPuzzleDebugEvent,
  appendPuzzleLedgerEvent,
  type PuzzleEventInput,
} from "./recordPuzzleEvent.js";
import { resolveCurrentRoomPuzzle, type InstancePuzzleSource } from "./resolveInstancePuzzle.js";

export type SubmitInstancePuzzleSolutionResult = {
  ok: boolean;
  errors: string[];
  session: WorldSession;
  puzzle?: InstancePuzzle;
  solutionId?: string;
  consequenceId?: string;
  completesPuzzle?: boolean;
};

function puzzleSolutionContext(
  puzzle: InstancePuzzle,
  solutionId: string,
  instanceId: string,
  roomId: string,
): PuzzleEventInput | undefined {
  const solution = findInstancePuzzleSolution(puzzle, solutionId);
  if (!solution) {
    return undefined;
  }
  return {
    puzzleId: puzzle.id,
    solutionId: solution.id,
    consequenceId: solution.consequenceId,
    instanceId,
    roomId,
    summary: solution.label,
    completesPuzzle: solution.completesPuzzle,
  };
}

/**
 * Submit a bounded puzzle solution in the player's current temporary instance room.
 * Validates the room puzzle hook and solution id, applies the linked consequence,
 * and records instance ledger + debug events.
 */
export function submitInstancePuzzleSolution(
  world: WorldDefinition,
  session: WorldSession,
  solutionId: string,
  source: InstancePuzzleSource,
): SubmitInstancePuzzleSolutionResult {
  const resolved = resolveCurrentRoomPuzzle(world, session, source);
  if (!resolved.ok || !resolved.puzzle || !resolved.room || !resolved.puzzleId) {
    return {
      ok: false,
      errors: resolved.errors,
      session,
    };
  }

  const puzzle = resolved.puzzle;
  const validation = validateInstancePuzzleAgainstWorld(puzzle, world);
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      session,
    };
  }

  const solution = findInstancePuzzleSolution(puzzle, solutionId);
  if (!solution) {
    return {
      ok: false,
      errors: [`instance-puzzle: unknown solution "${solutionId}" for puzzle "${puzzle.id}"`],
      session,
      puzzle,
    };
  }

  const eventInput = puzzleSolutionContext(
    puzzle,
    solutionId,
    session.activeTemporaryInstanceId!,
    resolved.room.id,
  );
  if (!eventInput) {
    return {
      ok: false,
      errors: [`instance-puzzle: failed to build puzzle context for "${solutionId}"`],
      session,
      puzzle,
    };
  }

  const applied = applyConsequenceEngine(world, session, solution.consequenceId);

  if (!applied.ok || !applied.session) {
    return {
      ok: false,
      errors: applied.errors,
      session: applied.session ?? session,
      puzzle,
      solutionId,
      consequenceId: solution.consequenceId,
      completesPuzzle: solution.completesPuzzle,
    };
  }

  let nextSession = appendPuzzleLedgerEvent(applied.session, eventInput);
  nextSession = appendPuzzleDebugEvent(nextSession, eventInput);

  return {
    ok: true,
    errors: [],
    session: nextSession,
    puzzle,
    solutionId,
    consequenceId: solution.consequenceId,
    completesPuzzle: solution.completesPuzzle,
  };
}
