import { contentRoot } from "@playable-worlds/content";
import { loadWorld, type LoadWorldResult } from "@playable-worlds/core/world";

import { STONEPASS_WORLD_ID } from "./constants";

/** Server-only: load and validate the canonical Stonepass world from disk. */
export function loadStonepassWorld(): LoadWorldResult {
  return loadWorld(STONEPASS_WORLD_ID, contentRoot);
}
