import { parseDebugEvent, type DebugEvent } from "../schemas/debugEvent.js";
import { WorldSessionSchema, type WorldSession } from "../schemas/worldSession.js";

/** Validates and appends a debug trace entry to a session (immutable update). */
export function appendDebugEvent(session: WorldSession, event: unknown): WorldSession {
  const parsed: DebugEvent = parseDebugEvent(event);
  return WorldSessionSchema.parse({
    ...session,
    debugEvents: [...session.debugEvents, parsed],
  });
}
