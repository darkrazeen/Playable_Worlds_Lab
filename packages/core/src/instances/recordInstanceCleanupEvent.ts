import { appendDebugEvent } from "../debug/appendDebugEvent.js";
import type { InstanceCleanupBehavior } from "../schemas/temporaryInstance.js";
import type { DebugEvent } from "../schemas/debugEvent.js";
import { WorldLedgerSchema } from "../schemas/worldLedger.js";
import { WorldSessionSchema, type WorldSession } from "../schemas/worldSession.js";

export type InstanceCleanupEventInput = {
  instanceId: string;
  cleanupBehavior: InstanceCleanupBehavior;
  consequenceId: string;
  completionCondition: string;
  roomId: string;
};

const CLEANUP_SUMMARY: Record<InstanceCleanupBehavior, string> = {
  vanish: "The instance vanishes behind you.",
  collapse: "The instance collapses and you return to the main world.",
  seal: "The instance seals shut as you leave.",
  resolve: "The instance resolves and releases you back to the main world.",
  remain_inactive: "You leave the instance; it remains inactive in the world.",
};

export function buildInstanceCleanupDebugEvent(
  session: WorldSession,
  input: InstanceCleanupEventInput,
): DebugEvent {
  return {
    id: `debug_instance_cleanup_${input.instanceId}`,
    turnNumber: session.turnNumber,
    type: "choice_selected",
    summary: CLEANUP_SUMMARY[input.cleanupBehavior],
    metadata: {
      instanceId: input.instanceId,
      cleanupBehavior: input.cleanupBehavior,
      consequenceId: input.consequenceId,
      completionCondition: input.completionCondition,
      roomId: input.roomId,
      source: "instance_cleanup",
    },
  };
}

/** Append an instance-type ledger event after temporary instance cleanup. */
export function appendInstanceCleanupLedgerEvent(
  session: WorldSession,
  input: InstanceCleanupEventInput,
): WorldSession {
  const eventId = `event_instance_cleanup_${input.instanceId}_t${session.turnNumber}`;
  const ledger = WorldLedgerSchema.parse({
    ...session.ledger,
    worldEvents: [
      ...session.ledger.worldEvents,
      {
        id: eventId,
        type: "instance" as const,
        summary: CLEANUP_SUMMARY[input.cleanupBehavior],
        turnNumber: session.turnNumber,
        metadata: {
          instanceId: input.instanceId,
          cleanupBehavior: input.cleanupBehavior,
          consequenceId: input.consequenceId,
          completionCondition: input.completionCondition,
          roomId: input.roomId,
        },
      },
    ],
  });

  return WorldSessionSchema.parse({
    ...session,
    ledger,
  });
}

export function appendInstanceCleanupDebugEvent(
  session: WorldSession,
  input: InstanceCleanupEventInput,
): WorldSession {
  return appendDebugEvent(session, buildInstanceCleanupDebugEvent(session, input));
}
