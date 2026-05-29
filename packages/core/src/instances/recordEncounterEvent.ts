import { appendDebugEvent } from "../debug/appendDebugEvent.js";
import type { DebugEvent } from "../schemas/debugEvent.js";
import { WorldLedgerSchema } from "../schemas/worldLedger.js";
import { WorldSessionSchema, type WorldSession } from "../schemas/worldSession.js";

export type EncounterEventInput = {
  encounterId: string;
  choiceId: string;
  consequenceId: string;
  instanceId: string;
  roomId: string;
  summary: string;
};

export function buildEncounterInteractionDebugEvent(
  session: WorldSession,
  input: EncounterEventInput,
): DebugEvent {
  return {
    id: `debug_encounter_${input.encounterId}_${input.choiceId}`,
    turnNumber: session.turnNumber,
    type: "choice_selected",
    summary: `Encounter ${input.encounterId}: ${input.summary}`,
    metadata: {
      encounterId: input.encounterId,
      choiceId: input.choiceId,
      consequenceId: input.consequenceId,
      instanceId: input.instanceId,
      roomId: input.roomId,
      source: "instance_encounter",
    },
  };
}

/** Append an instance-type ledger event after a successful encounter choice. */
export function appendEncounterLedgerEvent(
  session: WorldSession,
  input: EncounterEventInput,
): WorldSession {
  const eventId = `event_encounter_${input.encounterId}_${input.choiceId}_t${session.turnNumber}`;
  const ledger = WorldLedgerSchema.parse({
    ...session.ledger,
    worldEvents: [
      ...session.ledger.worldEvents,
      {
        id: eventId,
        type: "instance" as const,
        summary: input.summary,
        turnNumber: session.turnNumber,
        metadata: {
          encounterId: input.encounterId,
          choiceId: input.choiceId,
          consequenceId: input.consequenceId,
          instanceId: input.instanceId,
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

export function appendEncounterDebugEvent(
  session: WorldSession,
  input: EncounterEventInput,
): WorldSession {
  return appendDebugEvent(session, buildEncounterInteractionDebugEvent(session, input));
}
