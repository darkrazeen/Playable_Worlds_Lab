import type { TemporaryInstance, TemporaryInstanceRoom } from "../schemas/temporaryInstance.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import { getTemporaryInstance } from "./temporaryInstanceEntry.js";

/** Resolve the session's active temporary instance from the world definition. */
export function getActiveTemporaryInstance(
  world: WorldDefinition,
  session: WorldSession,
): TemporaryInstance | undefined {
  const instanceId = session.activeTemporaryInstanceId;
  if (!instanceId) {
    return undefined;
  }
  return getTemporaryInstance(world, instanceId);
}

/** Look up a room by id within an instance. */
export function getTemporaryInstanceRoom(
  instance: TemporaryInstance,
  roomId: string,
): TemporaryInstanceRoom | undefined {
  return instance.rooms.find((room) => room.id === roomId);
}

/** Current room for an active instance session (undefined if not in an instance). */
export function getCurrentTemporaryInstanceRoom(
  world: WorldDefinition,
  session: WorldSession,
): TemporaryInstanceRoom | undefined {
  const instance = getActiveTemporaryInstance(world, session);
  const roomId = session.currentTemporaryRoomId;
  if (!instance || !roomId) {
    return undefined;
  }
  return getTemporaryInstanceRoom(instance, roomId);
}

/** Room ids reachable in one step from the current room via connectedRoomIds. */
export function listConnectedTemporaryRoomIds(
  instance: TemporaryInstance,
  fromRoomId: string,
): string[] {
  const fromRoom = getTemporaryInstanceRoom(instance, fromRoomId);
  if (!fromRoom) {
    return [];
  }
  return fromRoom.connectedRoomIds;
}

/** Whether targetRoomId is adjacent to fromRoomId in the instance graph. */
export function canMoveToTemporaryRoom(
  instance: TemporaryInstance,
  fromRoomId: string,
  targetRoomId: string,
): boolean {
  if (fromRoomId === targetRoomId) {
    return true;
  }
  return listConnectedTemporaryRoomIds(instance, fromRoomId).includes(targetRoomId);
}

export type ValidateTemporaryRoomMoveResult = {
  ok: boolean;
  errors: string[];
  instance?: TemporaryInstance;
  fromRoom?: TemporaryInstanceRoom;
  toRoom?: TemporaryInstanceRoom;
};

/** Validate a move to targetRoomId within the active temporary instance. */
export function validateTemporaryRoomMove(
  world: WorldDefinition,
  session: WorldSession,
  targetRoomId: string,
): ValidateTemporaryRoomMoveResult {
  const instance = getActiveTemporaryInstance(world, session);
  if (!instance) {
    return {
      ok: false,
      errors: ["instance-room: no active temporary instance on session"],
    };
  }

  const fromRoomId = session.currentTemporaryRoomId;
  if (!fromRoomId) {
    return {
      ok: false,
      errors: ["instance-room: session has active instance but no currentTemporaryRoomId"],
      instance,
    };
  }

  const fromRoom = getTemporaryInstanceRoom(instance, fromRoomId);
  if (!fromRoom) {
    return {
      ok: false,
      errors: [
        `instance-room: current room "${fromRoomId}" not found in active instance "${instance.id}"`,
      ],
      instance,
    };
  }

  const toRoom = getTemporaryInstanceRoom(instance, targetRoomId);
  if (!toRoom) {
    return {
      ok: false,
      errors: [`instance-room: unknown room "${targetRoomId}" in active instance "${instance.id}"`],
      instance,
      fromRoom,
    };
  }

  if (!canMoveToTemporaryRoom(instance, fromRoomId, targetRoomId)) {
    return {
      ok: false,
      errors: [
        `instance-room: cannot move from "${fromRoomId}" to "${targetRoomId}" (not connected)`,
      ],
      instance,
      fromRoom,
      toRoom,
    };
  }

  return { ok: true, errors: [], instance, fromRoom, toRoom };
}
