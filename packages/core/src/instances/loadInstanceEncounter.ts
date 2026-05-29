import { readFileSync } from "node:fs";
import { join } from "node:path";

import { safeParseInstanceEncounter, type InstanceEncounter } from "./instanceEncounter.js";

/** Relative paths under a content package root for authored instance encounters. */
const ENCOUNTER_FILE_BY_ID: Record<string, string> = {
  encounter_cave_bats: "encounters/encounter_cave_bats.json",
};

export type LoadInstanceEncounterResult = {
  ok: boolean;
  errors: string[];
  encounter?: InstanceEncounter;
};

function readJsonFile(
  filePath: string,
): { ok: true; data: unknown } | { ok: false; errors: string[] } {
  try {
    const text = readFileSync(filePath, "utf8");
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, errors: [`encounter-loader: failed to read "${filePath}": ${message}`] };
  }
}

export function isKnownInstanceEncounterId(encounterId: string): boolean {
  return encounterId in ENCOUNTER_FILE_BY_ID;
}

/** Load and parse an instance encounter JSON file from disk. */
export function loadInstanceEncounterFromFile(filePath: string): LoadInstanceEncounterResult {
  const readResult = readJsonFile(filePath);
  if (!readResult.ok) {
    return { ok: false, errors: readResult.errors };
  }

  const parsed = safeParseInstanceEncounter(readResult.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `encounter-loader: ${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
    };
  }

  return { ok: true, errors: [], encounter: parsed.data };
}

/** Load a known encounter by id from a content package root directory. */
export function loadInstanceEncounter(
  encounterId: string,
  contentRoot: string,
): LoadInstanceEncounterResult {
  const relativePath = ENCOUNTER_FILE_BY_ID[encounterId];
  if (!relativePath) {
    return {
      ok: false,
      errors: [`encounter-loader: unknown encounter id "${encounterId}"`],
    };
  }

  return loadInstanceEncounterFromFile(join(contentRoot, relativePath));
}

/** Parse encounter data already in memory (tests and bundled fixtures). */
export function parseLoadedInstanceEncounter(input: unknown): LoadInstanceEncounterResult {
  const parsed = safeParseInstanceEncounter(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `instance-encounter: ${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
    };
  }
  return { ok: true, errors: [], encounter: parsed.data };
}
