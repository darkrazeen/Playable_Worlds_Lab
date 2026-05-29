import { appendValidationFailure } from "../debug/debugTrace.js";
import { WorldSessionSchema, type WorldSession } from "../schemas/worldSession.js";
import type { TemporaryInstanceRoom } from "../schemas/temporaryInstance.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";

import { validateTemporaryRoomMove } from "./temporaryInstanceRoom.js";

export type MoveTemporaryInstanceRoomResult = {
  ok: boolean;
  errors: string[];
  session: WorldSession;
  fromRoom?: TemporaryInstanceRoom;
  toRoom?: TemporaryInstanceRoom;
};

/**
 * Move the player to targetRoomId within the active temporary instance.
 * Updates currentTemporaryRoomId when the room exists and is reachable.
 */
export function moveToTemporaryRoom(
  world: WorldDefinition,
  session: WorldSession,
  targetRoomId: string,
): MoveTemporaryInstanceRoomResult {
  const validated = validateTemporaryRoomMove(world, session, targetRoomId);
  if (!validated.ok || !validated.toRoom) {
    return {
      ok: false,
      errors: validated.errors,
      session: appendValidationFailure(session, validated.errors, {
        targetRoomId,
        instanceId: session.activeTemporaryInstanceId,
      }),
      fromRoom: validated.fromRoom,
      toRoom: validated.toRoom,
    };
  }

  if (session.currentTemporaryRoomId === targetRoomId) {
    return {
      ok: true,
      errors: [],
      session,
      fromRoom: validated.fromRoom,
      toRoom: validated.toRoom,
    };
  }

  const nextSession = WorldSessionSchema.parse({
    ...session,
    currentTemporaryRoomId: targetRoomId,
  });

  return {
    ok: true,
    errors: [],
    session: nextSession,
    fromRoom: validated.fromRoom,
    toRoom: validated.toRoom,
  };
}
