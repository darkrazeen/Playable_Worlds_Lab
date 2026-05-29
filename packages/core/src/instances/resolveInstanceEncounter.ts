import type { TemporaryInstanceRoom } from "../schemas/temporaryInstance.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import type { InstanceEncounter } from "./instanceEncounter.js";
import {
  loadInstanceEncounter,
  parseLoadedInstanceEncounter,
  type LoadInstanceEncounterResult,
} from "./loadInstanceEncounter.js";
import {
  getActiveTemporaryInstance,
  getCurrentTemporaryInstanceRoom,
} from "./temporaryInstanceRoom.js";

export type ResolveInstanceEncounterResult = LoadInstanceEncounterResult & {
  room?: TemporaryInstanceRoom;
  encounterId?: string;
};

export type InstanceEncounterSource =
  | { kind: "contentRoot"; contentRoot: string }
  | { kind: "catalog"; encountersById: Record<string, InstanceEncounter> };

function loadEncounterById(
  encounterId: string,
  source: InstanceEncounterSource,
): LoadInstanceEncounterResult {
  if (source.kind === "catalog") {
    const encounter = source.encountersById[encounterId];
    if (!encounter) {
      return {
        ok: false,
        errors: [`instance-encounter: encounter "${encounterId}" not found in catalog`],
      };
    }
    return { ok: true, errors: [], encounter };
  }

  return loadInstanceEncounter(encounterId, source.contentRoot);
}

/** Resolve the encounter hook on the player's current temporary instance room. */
export function resolveCurrentRoomEncounter(
  world: WorldDefinition,
  session: WorldSession,
  source: InstanceEncounterSource,
): ResolveInstanceEncounterResult {
  const instance = getActiveTemporaryInstance(world, session);
  if (!instance) {
    return { ok: false, errors: ["instance-encounter: no active temporary instance on session"] };
  }

  const room = getCurrentTemporaryInstanceRoom(world, session);
  if (!room) {
    return {
      ok: false,
      errors: ["instance-encounter: session has active instance but no currentTemporaryRoomId"],
    };
  }

  const encounterId = room.encounter;
  if (!encounterId) {
    return {
      ok: false,
      errors: [`instance-encounter: room "${room.id}" has no encounter hook`],
      room,
    };
  }

  const loaded = loadEncounterById(encounterId, source);
  return { ...loaded, room, encounterId };
}

/** Parse inline encounter JSON (e.g. tests) and attach to a room id check. */
export function resolveRoomEncounter(
  world: WorldDefinition,
  session: WorldSession,
  encounterData: unknown,
): ResolveInstanceEncounterResult {
  const room = getCurrentTemporaryInstanceRoom(world, session);
  if (!room?.encounter) {
    return {
      ok: false,
      errors: ["instance-encounter: current room has no encounter hook"],
      room,
    };
  }

  const loaded = parseLoadedInstanceEncounter(encounterData);
  if (!loaded.ok || !loaded.encounter) {
    return { ...loaded, room, encounterId: room.encounter };
  }

  if (loaded.encounter.id !== room.encounter) {
    return {
      ok: false,
      errors: [
        `instance-encounter: room hook "${room.encounter}" does not match encounter id "${loaded.encounter.id}"`,
      ],
      room,
      encounterId: room.encounter,
    };
  }

  return { ...loaded, room, encounterId: room.encounter };
}
