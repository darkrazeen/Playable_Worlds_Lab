import type { DebugEvent } from "../schemas/debugEvent.js";
import type { WorldSession } from "../schemas/worldSession.js";

import { appendDebugEvent } from "./appendDebugEvent.js";
import { buildValidationFailedEvent } from "./buildDebugEvents.js";

export type AppendDebugEventsResult = WorldSession | { ok: false; errors: string[] };

/** Append validated debug events in order; returns errors if any event fails schema parse. */
export function appendDebugEvents(
  session: WorldSession,
  events: DebugEvent[],
): AppendDebugEventsResult {
  let nextSession = session;
  for (const event of events) {
    try {
      nextSession = appendDebugEvent(nextSession, event);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        errors: [`debug-trace: failed to append debug event: ${message}`],
      };
    }
  }
  return nextSession;
}

/** Record a validation failure at the current turn without advancing session state. */
export function appendValidationFailure(
  session: WorldSession,
  errors: string[],
  metadata?: Record<string, unknown>,
): WorldSession {
  const event = buildValidationFailedEvent({
    turnNumber: session.turnNumber,
    errors,
    metadata,
    sequence: session.debugEvents.length,
  });
  return appendDebugEvent(session, event);
}
