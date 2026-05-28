import { z } from "zod";

import { EntityIdSchema, NamedIdSchema } from "./ids.js";
import { FlagIdListSchema } from "./playerChoice.js";

/** Reference to a Consequence defined elsewhere in the world. */
export const ConsequenceIdSchema = NamedIdSchema;

export const GoalIdSchema = EntityIdSchema;
export const GoalIdListSchema = z.array(GoalIdSchema);

export const LocationIdSchema = EntityIdSchema;
export const LocationIdListSchema = z.array(LocationIdSchema);

export const TemporaryInstanceIdSchema = NamedIdSchema;
export const TemporaryInstanceIdListSchema = z.array(TemporaryInstanceIdSchema);

export const NpcIdSchema = NamedIdSchema;

/** Merged v4.1 + v4.2 attitude enum — see Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22 */
export const NpcAttitudeSchema = z.enum([
  "friendly",
  "neutral",
  "hostile",
  "afraid",
  "curious",
  "trusting",
  "fearful",
]);

export const NpcAttitudeUpdateSchema = z.object({
  npcId: NpcIdSchema,
  attitude: NpcAttitudeSchema,
});

export const VisibleChangeSchema = z.string().min(1);
export const VisibleChangeListSchema = z.array(VisibleChangeSchema);

export const ConsequenceSchema = z.object({
  id: ConsequenceIdSchema,
  summary: z.string().min(1),
  addFlags: FlagIdListSchema.default([]),
  removeFlags: FlagIdListSchema.default([]),
  unlockGoals: GoalIdListSchema.default([]),
  completeGoals: GoalIdListSchema.default([]),
  exposeLocations: LocationIdListSchema.default([]),
  closeLocations: LocationIdListSchema.default([]),
  visibleChanges: VisibleChangeListSchema.default([]),
  npcUpdates: z.array(NpcAttitudeUpdateSchema).default([]),
  temporaryInstances: TemporaryInstanceIdListSchema.default([]),
});

export type Consequence = z.infer<typeof ConsequenceSchema>;
export type NpcAttitudeUpdate = z.infer<typeof NpcAttitudeUpdateSchema>;

export function parseConsequence(input: unknown): Consequence {
  return ConsequenceSchema.parse(input);
}

export function safeParseConsequence(input: unknown) {
  return ConsequenceSchema.safeParse(input);
}
