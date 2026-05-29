import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import { selectStoryBeat, type SelectStoryBeatResult } from "./selectStoryBeat.js";

export type AdvanceSessionBeatResult = {
  session: WorldSession;
  beatResult: SelectStoryBeatResult;
};

/**
 * Align session.currentBeatId with the beat the selector would surface.
 * When the current beat is flag-blocked, persist the next accessible beat on the session.
 */
export function advanceSessionBeat(
  world: WorldDefinition,
  session: WorldSession,
): AdvanceSessionBeatResult {
  const beatResult = selectStoryBeat(world, session);
  if (!beatResult.ok || !beatResult.beat) {
    return { session, beatResult };
  }

  if (beatResult.source === "next" && beatResult.beat.id !== session.currentBeatId) {
    return {
      session: { ...session, currentBeatId: beatResult.beat.id },
      beatResult,
    };
  }

  return { session, beatResult };
}
