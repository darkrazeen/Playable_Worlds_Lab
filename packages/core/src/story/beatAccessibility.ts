import type { PlayerChoice } from "../schemas/playerChoice.js";
import type { StoryBeat } from "../schemas/storyBeat.js";
import type { WorldSession } from "../schemas/worldSession.js";

function isExemptFlag(flag: string): boolean {
  return flag.startsWith("system_") || flag.startsWith("external_");
}

export function ledgerActiveFlags(session: WorldSession): Set<string> {
  return new Set(session.ledger.activeFlags);
}

/** Whether a choice's required/blocked flags match the active ledger flags. */
export function isPlayerChoiceAccessible(choice: PlayerChoice, flags: Set<string>): boolean {
  const required = choice.requiredFlags ?? [];
  const blocked = choice.blockedByFlags ?? [];
  return (
    required.every((flag) => flags.has(flag) || isExemptFlag(flag)) &&
    blocked.every((flag) => !flags.has(flag))
  );
}

/** Whether a beat's required/blocked flags match the active ledger flags. */
export function isStoryBeatAccessible(beat: StoryBeat, flags: Set<string>): boolean {
  const required = beat.requiredFlags ?? [];
  const blocked = beat.blockedByFlags ?? [];
  return (
    required.every((flag) => flags.has(flag) || isExemptFlag(flag)) &&
    blocked.every((flag) => !flags.has(flag))
  );
}

/** First accessible non-hidden beat after current, then any other accessible beat. */
export function findNextAccessibleStoryBeat(
  storyBeats: StoryBeat[],
  currentBeatId: string,
  flags: Set<string>,
): StoryBeat | undefined {
  const candidates = storyBeats.filter(
    (beat) =>
      beat.id !== currentBeatId && !beat.isHidden && isStoryBeatAccessible(beat, flags),
  );

  const currentIndex = storyBeats.findIndex((beat) => beat.id === currentBeatId);
  if (currentIndex >= 0) {
    const afterCurrent = candidates.find(
      (beat) => storyBeats.findIndex((entry) => entry.id === beat.id) > currentIndex,
    );
    if (afterCurrent) return afterCurrent;
  }

  return candidates[0];
}
