import { z } from "zod";

import { ConsequenceSchema } from "./consequence.js";
import { NpcSchema } from "./npc.js";
import { CURRENT_SCHEMA_VERSION, SchemaVersionSchema } from "./schemaVersion.js";
import { StoryBeatSchema } from "./storyBeat.js";
import { TemporaryInstanceSchema } from "./temporaryInstance.js";
import { WorldDNASchema } from "./worldDna.js";

export const WorldIdSchema = z.string().min(1);

export const WorldDefinitionSchema = z.object({
  schemaVersion: SchemaVersionSchema,
  id: WorldIdSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  worldDNA: WorldDNASchema,
  startingBeatId: z.string().min(1),
  storyBeats: z.array(StoryBeatSchema).min(1),
  consequences: z.array(ConsequenceSchema).min(1),
  npcs: z.array(NpcSchema).default([]),
  temporaryInstances: z.array(TemporaryInstanceSchema).default([]),
  generationSeed: z.string().min(1).optional(),
});

export type WorldDefinition = z.infer<typeof WorldDefinitionSchema>;

export function parseWorldDefinition(input: unknown): WorldDefinition {
  return WorldDefinitionSchema.parse(input);
}

export function safeParseWorldDefinition(input: unknown) {
  return WorldDefinitionSchema.safeParse(input);
}

/** Creates a typed shell with current schema version; caller fills required world content. */
export function createWorldDefinitionShell(
  partial: Omit<z.input<typeof WorldDefinitionSchema>, "schemaVersion">,
): WorldDefinition {
  return WorldDefinitionSchema.parse({
    ...partial,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  });
}
