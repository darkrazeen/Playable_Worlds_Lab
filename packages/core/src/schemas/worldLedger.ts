import { z } from "zod";

import { validateLedgerFlags } from "../ledger/flagLifecycle.js";
import { GoalIdListSchema } from "./consequence.js";
import { FlagIdListSchema } from "./playerChoice.js";
import { LocationIdListSchema } from "./consequence.js";
import { NamedIdSchema } from "./ids.js";

export const WorldEventIdSchema = NamedIdSchema;

export const WorldEventTypeSchema = z.enum([
  "choice",
  "consequence",
  "flag",
  "goal",
  "instance",
  "ai",
  "system",
]);

export const WorldEventSchema = z.object({
  id: WorldEventIdSchema,
  type: WorldEventTypeSchema,
  summary: z.string().min(1),
  turnNumber: z.number().int().min(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const WorldLedgerSchema = z
  .object({
    activeFlags: FlagIdListSchema.default([]),
    resolvedFlags: FlagIdListSchema.default([]),
    unlockedGoals: GoalIdListSchema.default([]),
    completedGoals: GoalIdListSchema.default([]),
    discoveredLocations: LocationIdListSchema.default([]),
    worldEvents: z.array(WorldEventSchema).default([]),
  })
  .superRefine((ledger, ctx) => {
    const flagValidation = validateLedgerFlags(ledger.activeFlags, ledger.resolvedFlags);
    for (const message of flagValidation.errors) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ["activeFlags"] });
    }
  });

export type WorldEvent = z.infer<typeof WorldEventSchema>;
export type WorldEventType = z.infer<typeof WorldEventTypeSchema>;
export type WorldLedger = z.infer<typeof WorldLedgerSchema>;

export function createEmptyWorldLedger(): WorldLedger {
  return WorldLedgerSchema.parse({});
}

export function parseWorldEvent(input: unknown): WorldEvent {
  return WorldEventSchema.parse(input);
}

export function safeParseWorldEvent(input: unknown) {
  return WorldEventSchema.safeParse(input);
}

export function parseWorldLedger(input: unknown): WorldLedger {
  return WorldLedgerSchema.parse(input);
}

export function safeParseWorldLedger(input: unknown) {
  return WorldLedgerSchema.safeParse(input);
}
