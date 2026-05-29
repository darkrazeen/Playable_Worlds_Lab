import { applyConsequenceEngine } from "../consequence/consequenceEngine.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import {
  findInstanceEncounterChoice,
  validateInstanceEncounterAgainstWorld,
  type InstanceEncounter,
} from "./instanceEncounter.js";
import {
  appendEncounterDebugEvent,
  appendEncounterLedgerEvent,
  type EncounterEventInput,
} from "./recordEncounterEvent.js";
import {
  resolveCurrentRoomEncounter,
  type InstanceEncounterSource,
} from "./resolveInstanceEncounter.js";

export type ApplyInstanceEncounterChoiceResult = {
  ok: boolean;
  errors: string[];
  session: WorldSession;
  encounter?: InstanceEncounter;
  choiceId?: string;
  consequenceId?: string;
};

function encounterChoiceContext(
  encounter: InstanceEncounter,
  choiceId: string,
  instanceId: string,
  roomId: string,
): EncounterEventInput | undefined {
  const choice = findInstanceEncounterChoice(encounter, choiceId);
  if (!choice) {
    return undefined;
  }
  return {
    encounterId: encounter.id,
    choiceId: choice.id,
    consequenceId: choice.consequenceId,
    instanceId,
    roomId,
    summary: choice.label,
  };
}

/**
 * Apply a bounded encounter choice in the player's current temporary instance room.
 * Resolves the room encounter hook, validates the choice, applies the linked consequence,
 * and records instance ledger + debug events.
 */
export function applyInstanceEncounterChoice(
  world: WorldDefinition,
  session: WorldSession,
  choiceId: string,
  source: InstanceEncounterSource,
): ApplyInstanceEncounterChoiceResult {
  const resolved = resolveCurrentRoomEncounter(world, session, source);
  if (!resolved.ok || !resolved.encounter || !resolved.room || !resolved.encounterId) {
    return {
      ok: false,
      errors: resolved.errors,
      session,
    };
  }

  const encounter = resolved.encounter;
  const validation = validateInstanceEncounterAgainstWorld(encounter, world);
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      session,
    };
  }

  const choice = findInstanceEncounterChoice(encounter, choiceId);
  if (!choice) {
    return {
      ok: false,
      errors: [`instance-encounter: unknown choice "${choiceId}" for encounter "${encounter.id}"`],
      session,
      encounter,
    };
  }

  const eventInput = encounterChoiceContext(
    encounter,
    choiceId,
    session.activeTemporaryInstanceId!,
    resolved.room.id,
  );
  if (!eventInput) {
    return {
      ok: false,
      errors: [`instance-encounter: failed to build encounter context for "${choiceId}"`],
      session,
      encounter,
    };
  }

  const applied = applyConsequenceEngine(world, session, choice.consequenceId);

  if (!applied.ok || !applied.session) {
    return {
      ok: false,
      errors: applied.errors,
      session: applied.session ?? session,
      encounter,
      choiceId,
      consequenceId: choice.consequenceId,
    };
  }

  let nextSession = appendEncounterLedgerEvent(applied.session, eventInput);
  nextSession = appendEncounterDebugEvent(nextSession, eventInput);

  return {
    ok: true,
    errors: [],
    session: nextSession,
    encounter,
    choiceId,
    consequenceId: choice.consequenceId,
  };
}
