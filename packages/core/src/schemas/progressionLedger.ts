import { z } from "zod";

import { EntityIdSchema, NamedIdSchema } from "./ids.js";

/** Highest allowed discrete tier value (no continuous XP curves). */
export const MAX_PROGRESSION_TIER = 99;

export const SkillIdSchema = NamedIdSchema;
export const UnlockIdSchema = EntityIdSchema;
export const MilestoneIdSchema = EntityIdSchema;
export const UsageCounterKeySchema = NamedIdSchema;

export const ProgressionTierValueSchema = z
  .number()
  .int("Progression tiers must be whole numbers, not XP or stat floats.")
  .min(0)
  .max(MAX_PROGRESSION_TIER);

export const UsageCounterValueSchema = z.number().int().min(0);

export const SkillTierMapSchema = z.record(SkillIdSchema, ProgressionTierValueSchema);

export const UsageCounterMapSchema = z.record(UsageCounterKeySchema, UsageCounterValueSchema);

export const UnlockIdListSchema = z.array(UnlockIdSchema).default([]);

export const MilestoneIdListSchema = z.array(MilestoneIdSchema).default([]);

export const ProgressionLedgerSchema = z
  .object({
    /** Bounded discrete skill tiers, e.g. { skill_sword: 2 }. */
    skillTiers: SkillTierMapSchema.default({}),
    /** Capability unlocks granted through validated consequences. */
    unlocks: UnlockIdListSchema,
    /** Earned mastery milestones (discrete facts, not XP). */
    milestones: MilestoneIdListSchema,
    /** Train-by-doing usage counters for Tier A skill advancement (W5-S10). */
    usageCounters: UsageCounterMapSchema.default({}),
  })
  .strict();

export type ProgressionLedger = z.infer<typeof ProgressionLedgerSchema>;

export function createEmptyProgressionLedger(): ProgressionLedger {
  return ProgressionLedgerSchema.parse({});
}

export function parseProgressionLedger(input: unknown): ProgressionLedger {
  return ProgressionLedgerSchema.parse(input);
}

export function safeParseProgressionLedger(input: unknown) {
  return ProgressionLedgerSchema.safeParse(input);
}
