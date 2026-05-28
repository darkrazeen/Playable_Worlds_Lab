import { z } from "zod";

import { DebugEventSchema } from "./debugEvent.js";
import { TemporaryInstanceIdSchema } from "./consequence.js";
import { TemporaryInstanceRoomIdSchema } from "./temporaryInstance.js";
import { CURRENT_SCHEMA_VERSION, SchemaVersionSchema } from "./schemaVersion.js";
import { WorldIdSchema } from "./worldDefinition.js";
import { createEmptyWorldLedger, WorldLedgerSchema } from "./worldLedger.js";

export const WorldSessionIdSchema = z.string().min(1);
export const WorldVersionIdSchema = z.string().min(1);
export const StoryBeatIdSchema = z.string().min(1);
export const ChoiceIdSchema = z.string().min(1);

export const ChoiceHistorySchema = z.array(ChoiceIdSchema).default([]);

export const WorldSessionSchema = z.object({
  id: WorldSessionIdSchema,
  schemaVersion: SchemaVersionSchema,
  worldId: WorldIdSchema,
  worldVersionId: WorldVersionIdSchema,
  currentBeatId: StoryBeatIdSchema,
  ledger: WorldLedgerSchema,
  activeTemporaryInstanceId: TemporaryInstanceIdSchema.optional(),
  currentTemporaryRoomId: TemporaryInstanceRoomIdSchema.optional(),
  turnNumber: z.number().int().min(0),
  choiceHistory: ChoiceHistorySchema,
  debugEvents: z.array(DebugEventSchema).default([]),
});

export type WorldSession = z.infer<typeof WorldSessionSchema>;

export function parseWorldSession(input: unknown): WorldSession {
  return WorldSessionSchema.parse(input);
}

export function safeParseWorldSession(input: unknown) {
  return WorldSessionSchema.safeParse(input);
}

export type CreateWorldSessionInput = {
  id: string;
  worldId: string;
  worldVersionId: string;
  startingBeatId: string;
  schemaVersion?: string;
};

/** New play session at turn 0 with empty ledger, choice history, and debug log. */
export function createWorldSession(input: CreateWorldSessionInput): WorldSession {
  return WorldSessionSchema.parse({
    id: input.id,
    schemaVersion: input.schemaVersion ?? CURRENT_SCHEMA_VERSION,
    worldId: input.worldId,
    worldVersionId: input.worldVersionId,
    currentBeatId: input.startingBeatId,
    ledger: createEmptyWorldLedger(),
    turnNumber: 0,
    choiceHistory: [],
    debugEvents: [],
  });
}
