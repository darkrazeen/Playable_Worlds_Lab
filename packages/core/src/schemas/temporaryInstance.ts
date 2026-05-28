import { z } from "zod";

import { ConsequenceIdSchema, TemporaryInstanceIdSchema } from "./consequence.js";
import { NamedIdSchema } from "./ids.js";
import { FlagIdListSchema } from "./playerChoice.js";

export const TemporaryInstanceRoomIdSchema = NamedIdSchema;
export const TemporaryInstanceRoomIdListSchema = z.array(TemporaryInstanceRoomIdSchema);

export const TemporaryInstanceTypeSchema = z.enum(["cave", "ruin", "trial", "dream", "dungeon"]);

export const InstanceCleanupBehaviorSchema = z.enum([
  "vanish",
  "collapse",
  "seal",
  "resolve",
  "remain_inactive",
]);

export const RoomInteractionSchema = z.string().min(1);
export const RoomInteractionListSchema = z.array(RoomInteractionSchema);

export const TemporaryInstanceRoomSchema = z.object({
  id: TemporaryInstanceRoomIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  interactions: RoomInteractionListSchema.default([]),
  encounter: z.string().min(1).optional(),
  puzzle: z.string().min(1).optional(),
  connectedRoomIds: TemporaryInstanceRoomIdListSchema.default([]),
});

export const TemporaryInstanceSchema = z.object({
  id: TemporaryInstanceIdSchema,
  title: z.string().min(1),
  type: TemporaryInstanceTypeSchema,
  description: z.string().min(1).optional(),
  entranceText: z.string().min(1),
  requiredEntryFlags: FlagIdListSchema.min(1),
  rooms: z.array(TemporaryInstanceRoomSchema).min(1),
  completionCondition: z.string().min(1),
  completionConsequenceId: ConsequenceIdSchema,
  cleanupBehavior: InstanceCleanupBehaviorSchema,
  generationSeed: z.string().min(1).optional(),
});

export type TemporaryInstance = z.infer<typeof TemporaryInstanceSchema>;
export type TemporaryInstanceRoom = z.infer<typeof TemporaryInstanceRoomSchema>;
export type TemporaryInstanceType = z.infer<typeof TemporaryInstanceTypeSchema>;
export type InstanceCleanupBehavior = z.infer<typeof InstanceCleanupBehaviorSchema>;

export function parseTemporaryInstanceRoom(input: unknown): TemporaryInstanceRoom {
  return TemporaryInstanceRoomSchema.parse(input);
}

export function safeParseTemporaryInstanceRoom(input: unknown) {
  return TemporaryInstanceRoomSchema.safeParse(input);
}

export function parseTemporaryInstance(input: unknown): TemporaryInstance {
  return TemporaryInstanceSchema.parse(input);
}

export function safeParseTemporaryInstance(input: unknown) {
  return TemporaryInstanceSchema.safeParse(input);
}
