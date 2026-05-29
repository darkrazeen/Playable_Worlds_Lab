import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import {
  activateTemporaryInstance,
  type ActivateTemporaryInstanceResult,
} from "./activateTemporaryInstance.js";
import {
  loadTemporaryInstance,
  type LoadTemporaryInstanceResult,
} from "./loadTemporaryInstance.js";
import { STONEPASS_HIDDEN_CAVE_INSTANCE_ID } from "./stonepassInstances.js";

/** Load Stonepass hidden cave when `cave_exposed` is active (no session mutation). */
export function loadStonepassHiddenCave(
  world: WorldDefinition,
  session: WorldSession,
): LoadTemporaryInstanceResult {
  return loadTemporaryInstance(world, session, STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
}

/** Activate Stonepass hidden cave on the session when entry is allowed. */
export function activateStonepassHiddenCave(
  world: WorldDefinition,
  session: WorldSession,
): ActivateTemporaryInstanceResult {
  return activateTemporaryInstance(world, session, STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
}
