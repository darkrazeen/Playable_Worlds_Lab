import { readFileSync } from "node:fs";
import { join } from "node:path";

import { safeParseInstancePuzzle, type InstancePuzzle } from "./instancePuzzle.js";

/** Relative paths under a content package root for authored instance puzzles. */
const PUZZLE_FILE_BY_ID: Record<string, string> = {
  puzzle_dragon_runes: "puzzles/puzzle_dragon_runes.json",
};

export type LoadInstancePuzzleResult = {
  ok: boolean;
  errors: string[];
  puzzle?: InstancePuzzle;
};

function readJsonFile(
  filePath: string,
): { ok: true; data: unknown } | { ok: false; errors: string[] } {
  try {
    const text = readFileSync(filePath, "utf8");
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, errors: [`puzzle-loader: failed to read "${filePath}": ${message}`] };
  }
}

export function isKnownInstancePuzzleId(puzzleId: string): boolean {
  return puzzleId in PUZZLE_FILE_BY_ID;
}

/** Load and parse an instance puzzle JSON file from disk. */
export function loadInstancePuzzleFromFile(filePath: string): LoadInstancePuzzleResult {
  const readResult = readJsonFile(filePath);
  if (!readResult.ok) {
    return { ok: false, errors: readResult.errors };
  }

  const parsed = safeParseInstancePuzzle(readResult.data);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `puzzle-loader: ${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
    };
  }

  return { ok: true, errors: [], puzzle: parsed.data };
}

/** Load a known puzzle by id from a content package root directory. */
export function loadInstancePuzzle(
  puzzleId: string,
  contentRoot: string,
): LoadInstancePuzzleResult {
  const relativePath = PUZZLE_FILE_BY_ID[puzzleId];
  if (!relativePath) {
    return {
      ok: false,
      errors: [`puzzle-loader: unknown puzzle id "${puzzleId}"`],
    };
  }

  return loadInstancePuzzleFromFile(join(contentRoot, relativePath));
}

/** Parse puzzle data already in memory (tests and bundled fixtures). */
export function parseLoadedInstancePuzzle(input: unknown): LoadInstancePuzzleResult {
  const parsed = safeParseInstancePuzzle(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `instance-puzzle: ${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
    };
  }
  return { ok: true, errors: [], puzzle: parsed.data };
}
