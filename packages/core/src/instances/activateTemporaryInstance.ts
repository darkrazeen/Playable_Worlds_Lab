import { appendValidationFailure } from "../debug/debugTrace.js";
import { WorldSessionSchema, type WorldSession } from "../schemas/worldSession.js";
import type { TemporaryInstance } from "../schemas/temporaryInstance.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";

import { loadTemporaryInstance } from "./loadTemporaryInstance.js";

export type ActivateTemporaryInstanceResult = {
  ok: boolean;
  errors: string[];
  session: WorldSession;
  instance?: TemporaryInstance;
};

/**
 * Activate a temporary instance on the session when entry flags are satisfied.
 * Sets activeTemporaryInstanceId and currentTemporaryRoomId to the first room.
 */
export function activateTemporaryInstance(
  world: WorldDefinition,
  session: WorldSession,
  instanceId: string,
): ActivateTemporaryInstanceResult {
  const loaded = loadTemporaryInstance(world, session, instanceId);
  if (!loaded.ok || !loaded.instance) {
    return {
      ok: false,
      errors: loaded.errors,
      session: appendValidationFailure(session, loaded.errors, { instanceId }),
    };
  }

  const firstRoom = loaded.instance.rooms[0];
  if (!firstRoom) {
    const errors = [`instance-entry: "${instanceId}" has no rooms`];
    return {
      ok: false,
      errors,
      session: appendValidationFailure(session, errors, { instanceId }),
    };
  }

  const nextSession = WorldSessionSchema.parse({
    ...session,
    activeTemporaryInstanceId: loaded.instance.id,
    currentTemporaryRoomId: firstRoom.id,
  });

  return {
    ok: true,
    errors: [],
    session: nextSession,
    instance: loaded.instance,
  };
}
