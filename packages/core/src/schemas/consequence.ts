import { z } from "zod";

import { FlagIdListSchema } from "./playerChoice.js";

/** Reference to a Consequence defined elsewhere in the world. */
export const ConsequenceIdSchema = z.string().min(1);

export const GoalIdSchema = z.string().min(1);
export const GoalIdListSchema = z.array(GoalIdSchema);

export const LocationIdSchema = z.string().min(1);
export const LocationIdListSchema = z.array(LocationIdSchema);

export const TemporaryInstanceIdSchema = z.string().min(1);
export const TemporaryInstanceIdListSchema = z.array(TemporaryInstanceIdSchema);

export const NpcIdSchema = z.string().min(1);

export const NpcAttitudeSchema = z.enum([
  "hostile",
  "neutral",
  "friendly",
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
  startTemporaryInstanceIds: TemporaryInstanceIdListSchema.default([]),
});

export type Consequence = z.infer<typeof ConsequenceSchema>;
export type NpcAttitudeUpdate = z.infer<typeof NpcAttitudeUpdateSchema>;

export function parseConsequence(input: unknown): Consequence {
  return ConsequenceSchema.parse(input);
}

export function safeParseConsequence(input: unknown) {
  return ConsequenceSchema.safeParse(input);
}
