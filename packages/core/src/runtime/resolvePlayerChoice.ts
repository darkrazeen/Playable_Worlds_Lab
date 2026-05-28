import type { PlayerChoice } from "../schemas/playerChoice.js";
import type { StoryBeat } from "../schemas/storyBeat.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";
import {
  isPlayerChoiceAccessible,
  ledgerActiveFlags,
} from "../story/beatAccessibility.js";
import { selectStoryBeat } from "../story/selectStoryBeat.js";

export type ResolvePlayerChoiceResult = {
  ok: boolean;
  errors: string[];
  choice?: PlayerChoice;
  consequenceId?: string;
  beat?: StoryBeat;
};

export type ListAvailableChoicesResult = {
  ok: boolean;
  errors: string[];
  beat?: StoryBeat;
  choices?: PlayerChoice[];
};

/** Resolve a player choice on the selected beat when it exists and flag requirements pass. */
export function resolvePlayerChoice(
  world: WorldDefinition,
  session: WorldSession,
  choiceId: string,
): ResolvePlayerChoiceResult {
  const beatResult = selectStoryBeat(world, session);
  if (!beatResult.ok || !beatResult.beat) {
    return { ok: false, errors: beatResult.errors };
  }

  const beat = beatResult.beat;
  const choice = beat.availableChoices.find((entry) => entry.id === choiceId);
  if (!choice) {
    return {
      ok: false,
      errors: [`runtime: choice "${choiceId}" not found on beat "${beat.id}"`],
    };
  }

  const flags = ledgerActiveFlags(session);
  if (!isPlayerChoiceAccessible(choice, flags)) {
    return {
      ok: false,
      errors: [`runtime: choice "${choiceId}" is blocked by session flags`],
    };
  }

  if (!world.consequences.some((consequence) => consequence.id === choice.consequenceId)) {
    return {
      ok: false,
      errors: [
        `runtime: choice "${choiceId}" references unknown consequence "${choice.consequenceId}"`,
      ],
    };
  }

  return {
    ok: true,
    errors: [],
    choice,
    consequenceId: choice.consequenceId,
    beat,
  };
}

/** List choices on the selected beat that pass flag requirements for the session. */
export function listAvailableChoices(
  world: WorldDefinition,
  session: WorldSession,
): ListAvailableChoicesResult {
  const beatResult = selectStoryBeat(world, session);
  if (!beatResult.ok || !beatResult.beat) {
    return { ok: false, errors: beatResult.errors };
  }

  const flags = ledgerActiveFlags(session);
  const choices = beatResult.beat.availableChoices.filter((choice) =>
    isPlayerChoiceAccessible(choice, flags),
  );

  return {
    ok: true,
    errors: [],
    beat: beatResult.beat,
    choices,
  };
}
