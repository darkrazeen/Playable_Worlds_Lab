import { InstanceCleanupBehaviorSchema } from "../schemas/temporaryInstance.js";
import type { TemporaryInstance } from "../schemas/temporaryInstance.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";

import { getActiveTemporaryInstance } from "./temporaryInstanceRoom.js";

export type ValidateTemporaryInstanceCompletionResult = {
  ok: boolean;
  errors: string[];
  instance?: TemporaryInstance;
  targetRoomId?: string;
};

/** Map a completionCondition string to a room id within the instance, when possible. */
export function resolveCompletionTargetRoomId(instance: TemporaryInstance): string | undefined {
  const roomIds = new Set(instance.rooms.map((room) => room.id));

  if (roomIds.has(instance.completionCondition)) {
    return instance.completionCondition;
  }

  if (instance.completionCondition.startsWith("reached_")) {
    const candidate = `room_${instance.completionCondition.slice("reached_".length)}`;
    if (roomIds.has(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export function isTemporaryInstanceCompletionReady(
  instance: TemporaryInstance,
  session: WorldSession,
): boolean {
  if (session.activeTemporaryInstanceId !== instance.id) {
    return false;
  }

  const targetRoomId = resolveCompletionTargetRoomId(instance);
  if (!targetRoomId) {
    return false;
  }

  return session.currentTemporaryRoomId === targetRoomId;
}

/** Validate that the active instance can complete and apply its completion consequence. */
export function validateTemporaryInstanceCompletion(
  world: WorldDefinition,
  session: WorldSession,
): ValidateTemporaryInstanceCompletionResult {
  const instance = getActiveTemporaryInstance(world, session);
  if (!instance) {
    return {
      ok: false,
      errors: ["instance-completion: no active temporary instance on session"],
    };
  }

  const cleanupValidation = InstanceCleanupBehaviorSchema.safeParse(instance.cleanupBehavior);
  if (!cleanupValidation.success) {
    return {
      ok: false,
      errors: [
        `instance-completion: instance "${instance.id}" has invalid cleanupBehavior "${instance.cleanupBehavior}"`,
      ],
      instance,
    };
  }

  const consequence = world.consequences.find(
    (entry) => entry.id === instance.completionConsequenceId,
  );
  if (!consequence) {
    return {
      ok: false,
      errors: [
        `instance-completion: instance "${instance.id}" completionConsequenceId references unknown consequence "${instance.completionConsequenceId}"`,
      ],
      instance,
    };
  }

  const targetRoomId = resolveCompletionTargetRoomId(instance);
  if (!targetRoomId) {
    return {
      ok: false,
      errors: [
        `instance-completion: instance "${instance.id}" has unsupported completionCondition "${instance.completionCondition}"`,
      ],
      instance,
    };
  }

  if (!isTemporaryInstanceCompletionReady(instance, session)) {
    return {
      ok: false,
      errors: [
        `instance-completion: instance "${instance.id}" requires room "${targetRoomId}" (condition "${instance.completionCondition}")`,
      ],
      instance,
      targetRoomId,
    };
  }

  return {
    ok: true,
    errors: [],
    instance,
    targetRoomId,
  };
}
