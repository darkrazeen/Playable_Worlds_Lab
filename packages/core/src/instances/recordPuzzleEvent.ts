import { appendDebugEvent } from "../debug/appendDebugEvent.js";
import type { DebugEvent } from "../schemas/debugEvent.js";
import { WorldLedgerSchema } from "../schemas/worldLedger.js";
import { WorldSessionSchema, type WorldSession } from "../schemas/worldSession.js";

export type PuzzleEventInput = {
  puzzleId: string;
  solutionId: string;
  consequenceId: string;
  instanceId: string;
  roomId: string;
  summary: string;
  completesPuzzle: boolean;
};

export function buildPuzzleInteractionDebugEvent(
  session: WorldSession,
  input: PuzzleEventInput,
): DebugEvent {
  return {
    id: `debug_puzzle_${input.puzzleId}_${input.solutionId}`,
    turnNumber: session.turnNumber,
    type: "choice_selected",
    summary: `Puzzle ${input.puzzleId}: ${input.summary}`,
    metadata: {
      puzzleId: input.puzzleId,
      solutionId: input.solutionId,
      consequenceId: input.consequenceId,
      instanceId: input.instanceId,
      roomId: input.roomId,
      completesPuzzle: input.completesPuzzle,
      source: "instance_puzzle",
    },
  };
}

/** Append an instance-type ledger event after a puzzle solution attempt. */
export function appendPuzzleLedgerEvent(
  session: WorldSession,
  input: PuzzleEventInput,
): WorldSession {
  const eventId = `event_puzzle_${input.puzzleId}_${input.solutionId}_t${session.turnNumber}`;
  const ledger = WorldLedgerSchema.parse({
    ...session.ledger,
    worldEvents: [
      ...session.ledger.worldEvents,
      {
        id: eventId,
        type: "instance" as const,
        summary: input.summary,
        turnNumber: session.turnNumber,
        metadata: {
          puzzleId: input.puzzleId,
          solutionId: input.solutionId,
          consequenceId: input.consequenceId,
          instanceId: input.instanceId,
          roomId: input.roomId,
          completesPuzzle: input.completesPuzzle,
        },
      },
    ],
  });

  return WorldSessionSchema.parse({
    ...session,
    ledger,
  });
}

export function appendPuzzleDebugEvent(
  session: WorldSession,
  input: PuzzleEventInput,
): WorldSession {
  return appendDebugEvent(session, buildPuzzleInteractionDebugEvent(session, input));
}
