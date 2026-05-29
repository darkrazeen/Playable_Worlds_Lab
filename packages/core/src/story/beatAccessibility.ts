import { activeFlagSet, satisfiesFlagRequirements } from "../ledger/flagLifecycle.js";
import type { PlayerChoice } from "../schemas/playerChoice.js";
import type { StoryBeat } from "../schemas/storyBeat.js";
import type { WorldSession } from "../schemas/worldSession.js";

export { isExemptFlag } from "../ledger/flagLifecycle.js";

export function ledgerActiveFlags(session: WorldSession): Set<string> {
  return activeFlagSet(session.ledger.activeFlags);
}

/** Whether a choice's required/blocked flags match the active ledger flags. */
export function isPlayerChoiceAccessible(choice: PlayerChoice, flags: Set<string>): boolean {
  return satisfiesFlagRequirements(flags, choice.requiredFlags ?? [], choice.blockedByFlags ?? []);
}

/** Whether a beat's required/blocked flags match the active ledger flags. */
export function isStoryBeatAccessible(beat: StoryBeat, flags: Set<string>): boolean {
  return satisfiesFlagRequirements(flags, beat.requiredFlags ?? [], beat.blockedByFlags ?? []);
}

/** First accessible non-hidden beat after current, then any other accessible beat. */
export function findNextAccessibleStoryBeat(
  storyBeats: StoryBeat[],
  currentBeatId: string,
  flags: Set<string>,
): StoryBeat | undefined {
  const candidates = storyBeats.filter(
    (beat) => beat.id !== currentBeatId && !beat.isHidden && isStoryBeatAccessible(beat, flags),
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
