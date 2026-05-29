import type { TemporaryInstanceRoom } from "../schemas/temporaryInstance.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import {
  getActiveTemporaryInstance,
  getCurrentTemporaryInstanceRoom,
} from "../instances/temporaryInstanceRoom.js";

export type SessionTemporaryInstanceRoomContext = {
  instanceId: string;
  currentRoom: TemporaryInstanceRoom;
};

/**
 * Read-only view of the active instance room on a session.
 * Returns undefined when the player is not inside a temporary instance.
 */
export function resolveSessionTemporaryInstanceRoom(
  world: WorldDefinition,
  session: WorldSession,
): SessionTemporaryInstanceRoomContext | undefined {
  const instance = getActiveTemporaryInstance(world, session);
  const currentRoom = getCurrentTemporaryInstanceRoom(world, session);
  if (!instance || !currentRoom) {
    return undefined;
  }
  return {
    instanceId: instance.id,
    currentRoom,
  };
}
