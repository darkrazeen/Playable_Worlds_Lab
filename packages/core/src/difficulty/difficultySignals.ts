import { z } from "zod";

/** Deterministic ledger/session snapshot used as input to advisory heuristics. */
export const DifficultySignalsSchema = z.object({
  turnNumber: z.number().int().min(0),
  consequenceCount: z.number().int().min(0),
  failedChecks: z.number().int().min(0),
  unresolvedGoals: z.number().int().min(0),
  activeFlagCount: z.number().int().min(0),
  retriesThisInstance: z.number().int().min(0),
  highestGearTier: z.number().int().min(0).optional(),
});

export type DifficultySignals = z.infer<typeof DifficultySignalsSchema>;

export const DifficultyStruggleLevelSchema = z.enum(["low", "moderate", "high"]);

export type DifficultyStruggleLevel = z.infer<typeof DifficultyStruggleLevelSchema>;

export const AdvisoryDifficultySignalSchema = z.object({
  /** Bounded encounter-intensity tier suggestion — advisory only until W4-S10 applies it. */
  suggestedTier: z.number().int(),
  struggleLevel: DifficultyStruggleLevelSchema,
  signals: DifficultySignalsSchema,
  rationale: z.array(z.string().min(1)),
});

export type AdvisoryDifficultySignal = z.infer<typeof AdvisoryDifficultySignalSchema>;
