import { z } from "zod";

import { DebugEventSchema } from "./debugEvent.js";
import { TemporaryInstanceIdSchema } from "./consequence.js";
import { NamedIdSchema } from "./ids.js";
import { StoryBeatIdSchema } from "./storyBeat.js";

export { StoryBeatIdSchema };
import { TemporaryInstanceRoomIdSchema } from "./temporaryInstance.js";
import type { WorldDefinition } from "./worldDefinition.js";
import { CURRENT_SCHEMA_VERSION, SchemaVersionSchema } from "./schemaVersion.js";
import { WorldIdSchema } from "./worldDefinition.js";
import { createEmptyWorldLedger, WorldLedgerSchema } from "./worldLedger.js";

export const WorldSessionIdSchema = NamedIdSchema;
export const WorldVersionIdSchema = NamedIdSchema;
export const ChoiceIdSchema = NamedIdSchema;

export const ChoiceHistorySchema = z.array(ChoiceIdSchema).default([]);

export const GenerationSeedSchema = z.string().min(1);

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
  /** Root seed for reproducible AI sub-seeds across the run. */
  generationSeed: GenerationSeedSchema.optional(),
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
  generationSeed?: string;
};

/**
 * New play session at turn 0 with empty ledger, choice history, and debug log.
 * When `world` is provided, `startingBeatId` must exist in that world.
 */
export function createWorldSession(
  input: CreateWorldSessionInput,
  world?: WorldDefinition,
): WorldSession {
  if (world && !world.storyBeats.some((beat) => beat.id === input.startingBeatId)) {
    throw new Error(`startingBeatId "${input.startingBeatId}" not found in world "${world.id}"`);
  }

  return WorldSessionSchema.parse({
    id: input.id,
    schemaVersion: input.schemaVersion ?? CURRENT_SCHEMA_VERSION,
    worldId: input.worldId,
    worldVersionId: input.worldVersionId,
    currentBeatId: input.startingBeatId,
    ledger: createEmptyWorldLedger(),
    turnNumber: 0,
    choiceHistory: [],
    ...(input.generationSeed ? { generationSeed: input.generationSeed } : {}),
    debugEvents: [],
  });
}
