import type { TemporaryInstanceRoom } from "../schemas/temporaryInstance.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import type { InstancePuzzle } from "./instancePuzzle.js";
import { loadInstancePuzzle, type LoadInstancePuzzleResult } from "./loadInstancePuzzle.js";
import {
  getActiveTemporaryInstance,
  getCurrentTemporaryInstanceRoom,
} from "./temporaryInstanceRoom.js";

export type ResolveInstancePuzzleResult = LoadInstancePuzzleResult & {
  room?: TemporaryInstanceRoom;
  puzzleId?: string;
};

export type InstancePuzzleSource =
  | { kind: "contentRoot"; contentRoot: string }
  | { kind: "catalog"; puzzlesById: Record<string, InstancePuzzle> };

function loadPuzzleById(puzzleId: string, source: InstancePuzzleSource): LoadInstancePuzzleResult {
  if (source.kind === "catalog") {
    const puzzle = source.puzzlesById[puzzleId];
    if (!puzzle) {
      return {
        ok: false,
        errors: [`instance-puzzle: puzzle "${puzzleId}" not found in catalog`],
      };
    }
    return { ok: true, errors: [], puzzle };
  }

  return loadInstancePuzzle(puzzleId, source.contentRoot);
}

/** Resolve the puzzle hook on the player's current temporary instance room. */
export function resolveCurrentRoomPuzzle(
  world: WorldDefinition,
  session: WorldSession,
  source: InstancePuzzleSource,
): ResolveInstancePuzzleResult {
  const instance = getActiveTemporaryInstance(world, session);
  if (!instance) {
    return { ok: false, errors: ["instance-puzzle: no active temporary instance on session"] };
  }

  const room = getCurrentTemporaryInstanceRoom(world, session);
  if (!room) {
    return {
      ok: false,
      errors: ["instance-puzzle: session has active instance but no currentTemporaryRoomId"],
    };
  }

  const puzzleId = room.puzzle;
  if (!puzzleId) {
    return {
      ok: false,
      errors: [`instance-puzzle: room "${room.id}" has no puzzle hook`],
      room,
    };
  }

  const loaded = loadPuzzleById(puzzleId, source);
  return { ...loaded, room, puzzleId };
}
