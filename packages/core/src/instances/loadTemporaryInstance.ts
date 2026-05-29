import type { TemporaryInstance } from "../schemas/temporaryInstance.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import {
  validateTemporaryInstanceEntry,
  type TemporaryInstanceEntryResult,
} from "./temporaryInstanceEntry.js";

export type LoadTemporaryInstanceResult = TemporaryInstanceEntryResult;

/**
 * Load a temporary instance when session flags allow entry.
 * Does not mutate session — use activateTemporaryInstance to enter.
 */
export function loadTemporaryInstance(
  world: WorldDefinition,
  session: WorldSession,
  instanceId: string,
): LoadTemporaryInstanceResult {
  return validateTemporaryInstanceEntry(world, session, instanceId);
}

export type LoadedTemporaryInstance = TemporaryInstance;
