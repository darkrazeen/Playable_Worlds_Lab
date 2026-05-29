import { applyConsequenceEngine } from "../consequence/consequenceEngine.js";
import { appendValidationFailure } from "../debug/debugTrace.js";
import type { TemporaryInstance } from "../schemas/temporaryInstance.js";
import type { Consequence } from "../schemas/consequence.js";
import { WorldSessionSchema, type WorldSession } from "../schemas/worldSession.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";

import {
  appendInstanceCleanupDebugEvent,
  appendInstanceCleanupLedgerEvent,
  type InstanceCleanupEventInput,
} from "./recordInstanceCleanupEvent.js";
import { validateTemporaryInstanceCompletion } from "./temporaryInstanceCompletion.js";

export type CompleteTemporaryInstanceResult = {
  ok: boolean;
  errors: string[];
  session: WorldSession;
  instance?: TemporaryInstance;
  consequence?: Consequence;
  cleanupBehavior?: TemporaryInstance["cleanupBehavior"];
};

function cleanupEventInput(instance: TemporaryInstance, roomId: string): InstanceCleanupEventInput {
  return {
    instanceId: instance.id,
    cleanupBehavior: instance.cleanupBehavior,
    consequenceId: instance.completionConsequenceId,
    completionCondition: instance.completionCondition,
    roomId,
  };
}

/** Clear active instance pointers so control returns to the main world. */
export function clearTemporaryInstanceSession(session: WorldSession): WorldSession {
  return WorldSessionSchema.parse({
    ...session,
    activeTemporaryInstanceId: undefined,
    currentTemporaryRoomId: undefined,
  });
}

/**
 * Complete the active temporary instance: apply completionConsequenceId,
 * run cleanup behavior metadata, clear instance session pointers, and log cleanup.
 */
export function completeTemporaryInstance(
  world: WorldDefinition,
  session: WorldSession,
): CompleteTemporaryInstanceResult {
  const validated = validateTemporaryInstanceCompletion(world, session);
  if (!validated.ok || !validated.instance || !validated.targetRoomId) {
    return {
      ok: false,
      errors: validated.errors,
      session: appendValidationFailure(session, validated.errors, {
        instanceId: session.activeTemporaryInstanceId,
      }),
    };
  }

  const instance = validated.instance;
  const applied = applyConsequenceEngine(world, session, instance.completionConsequenceId);

  if (!applied.ok || !applied.session) {
    return {
      ok: false,
      errors: applied.errors,
      session: applied.session ?? session,
      instance,
      cleanupBehavior: instance.cleanupBehavior,
    };
  }

  const eventInput = cleanupEventInput(instance, validated.targetRoomId);
  let nextSession = appendInstanceCleanupLedgerEvent(applied.session, eventInput);
  nextSession = appendInstanceCleanupDebugEvent(nextSession, eventInput);
  nextSession = clearTemporaryInstanceSession(nextSession);

  return {
    ok: true,
    errors: [],
    session: nextSession,
    instance,
    consequence: applied.consequence,
    cleanupBehavior: instance.cleanupBehavior,
  };
}
