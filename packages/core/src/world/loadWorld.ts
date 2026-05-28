import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { WorldDefinition } from "../schemas/worldDefinition.js";
import {
  parseAndValidateWorldDefinition,
  type WorldValidationResult,
} from "../validators/validateWorldDefinition.js";

export type LoadWorldResult = WorldValidationResult & {
  world?: WorldDefinition;
};

/** Relative paths under a content package root for known authored worlds. */
const WORLD_FILE_BY_ID: Record<string, string> = {
  world_stonepass_valley: "worlds/stonepass/stonepass-valley.world.json",
};

function readJsonFile(
  filePath: string,
): { ok: true; data: unknown } | { ok: false; errors: string[] } {
  try {
    const text = readFileSync(filePath, "utf8");
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, errors: [`loader: failed to read "${filePath}": ${message}`] };
  }
}

/** Load and validate a world JSON file from disk. Never throws on schema or graph failures. */
export function loadWorldFromFile(filePath: string): LoadWorldResult {
  const readResult = readJsonFile(filePath);
  if (!readResult.ok) {
    return { ok: false, errors: readResult.errors };
  }

  const result = parseAndValidateWorldDefinition(readResult.data);
  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }

  return { ok: true, errors: [], world: result.world };
}

/** Load a known world by id from a content package root directory. */
export function loadWorld(worldId: string, contentRoot: string): LoadWorldResult {
  const relativePath = WORLD_FILE_BY_ID[worldId];
  if (!relativePath) {
    return {
      ok: false,
      errors: [`loader: unknown world id "${worldId}"`],
    };
  }

  return loadWorldFromFile(join(contentRoot, relativePath));
}

export function isKnownWorldId(worldId: string): boolean {
  return worldId in WORLD_FILE_BY_ID;
}
