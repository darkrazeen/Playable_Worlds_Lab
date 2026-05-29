import type { StoryBeat } from "../schemas/storyBeat.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import {
  findNextAccessibleStoryBeat,
  isStoryBeatAccessible,
  ledgerActiveFlags,
} from "./beatAccessibility.js";

export type StoryBeatSelectionSource = "current" | "next";

export type SelectStoryBeatResult = {
  ok: boolean;
  errors: string[];
  beat?: StoryBeat;
  source?: StoryBeatSelectionSource;
};

/** Select the session's current beat when accessible, otherwise the next valid beat. */
export function selectStoryBeat(
  world: WorldDefinition,
  session: WorldSession,
): SelectStoryBeatResult {
  const flags = ledgerActiveFlags(session);
  const currentBeat = world.storyBeats.find((beat) => beat.id === session.currentBeatId);

  if (!currentBeat) {
    return {
      ok: false,
      errors: [`story: currentBeatId "${session.currentBeatId}" not found in world "${world.id}"`],
    };
  }

  if (isStoryBeatAccessible(currentBeat, flags)) {
    return {
      ok: true,
      errors: [],
      beat: currentBeat,
      source: "current",
    };
  }

  const nextBeat = findNextAccessibleStoryBeat(world.storyBeats, session.currentBeatId, flags);
  if (nextBeat) {
    return {
      ok: true,
      errors: [],
      beat: nextBeat,
      source: "next",
    };
  }

  return {
    ok: false,
    errors: [`story: no accessible story beat for session "${session.id}" with current flags`],
  };
}

/** Select a specific beat by id when accessible for the session ledger flags. */
export function selectStoryBeatById(
  world: WorldDefinition,
  session: WorldSession,
  beatId: string,
): SelectStoryBeatResult {
  const beat = world.storyBeats.find((entry) => entry.id === beatId);
  if (!beat) {
    return {
      ok: false,
      errors: [`story: story beat "${beatId}" not found in world "${world.id}"`],
    };
  }

  if (beat.isHidden) {
    return {
      ok: false,
      errors: [`story: story beat "${beatId}" is hidden`],
    };
  }

  const flags = ledgerActiveFlags(session);
  if (!isStoryBeatAccessible(beat, flags)) {
    return {
      ok: false,
      errors: [`story: story beat "${beatId}" is blocked by session flags`],
    };
  }

  return { ok: true, errors: [], beat, source: "current" };
}
