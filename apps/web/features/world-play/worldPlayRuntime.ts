import type {
  PlayerChoice,
  StoryBeat,
  WorldDefinition,
  WorldSession,
} from "@playable-worlds/core/schemas";
import { applyPlayerChoice } from "@playable-worlds/core/runtime";
import { listAvailableChoices } from "@playable-worlds/core/runtime";
import { initializeWorldSession } from "@playable-worlds/core/session";
import { selectStoryBeat } from "@playable-worlds/core/story";

import { DEFAULT_PLAY_SESSION_ID } from "./constants";

export type PlayViewState = {
  ok: boolean;
  errors: string[];
  beat?: StoryBeat;
  choices: PlayerChoice[];
  turnNumber: number;
  lastEventSummary?: string;
};

export type CreateInitialPlayStateResult = {
  ok: boolean;
  errors: string[];
  session?: WorldSession;
  view?: PlayViewState;
};

export function createInitialPlayState(
  world: WorldDefinition,
  sessionId: string = DEFAULT_PLAY_SESSION_ID,
): CreateInitialPlayStateResult {
  const initResult = initializeWorldSession(world, { sessionId });
  if (!initResult.ok || !initResult.session) {
    return { ok: false, errors: initResult.errors };
  }

  const view = getPlayViewState(world, initResult.session);
  if (!view.ok) {
    return { ok: false, errors: view.errors };
  }

  return {
    ok: true,
    errors: [],
    session: initResult.session,
    view,
  };
}

export function getPlayViewState(world: WorldDefinition, session: WorldSession): PlayViewState {
  const beatResult = selectStoryBeat(world, session);
  if (!beatResult.ok || !beatResult.beat) {
    return { ok: false, errors: beatResult.errors, choices: [], turnNumber: session.turnNumber };
  }

  const choicesResult = listAvailableChoices(world, session);
  if (!choicesResult.ok) {
    return {
      ok: false,
      errors: choicesResult.errors,
      choices: [],
      turnNumber: session.turnNumber,
    };
  }

  const lastEvent = session.ledger.worldEvents.at(-1);

  return {
    ok: true,
    errors: [],
    beat: beatResult.beat,
    choices: choicesResult.choices ?? [],
    turnNumber: session.turnNumber,
    lastEventSummary: lastEvent?.summary,
  };
}

export type ApplyPlayChoiceResult = {
  ok: boolean;
  errors: string[];
  session?: WorldSession;
  view?: PlayViewState;
  consequenceSummary?: string;
};

export function applyPlayChoice(
  world: WorldDefinition,
  session: WorldSession,
  choiceId: string,
): ApplyPlayChoiceResult {
  const applyResult = applyPlayerChoice(world, session, choiceId);
  if (!applyResult.ok) {
    return {
      ok: false,
      errors: applyResult.errors,
      session: applyResult.session,
    };
  }

  if (!applyResult.session) {
    return { ok: false, errors: applyResult.errors };
  }

  const view = getPlayViewState(world, applyResult.session);
  if (!view.ok) {
    return {
      ok: false,
      errors: view.errors,
      session: applyResult.session,
    };
  }

  return {
    ok: true,
    errors: [],
    session: applyResult.session,
    view,
    consequenceSummary: applyResult.consequence?.summary,
  };
}
