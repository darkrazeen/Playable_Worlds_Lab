import { z } from "zod";

/** Draft DifficultyProfile — immutable bounds for W4-S10+ (see Future_Features/Dynamic_Difficulty_Director.md). */
export const DifficultyBaseLevelSchema = z.enum(["easy", "normal", "hard"]);

export const DifficultyHintPolicySchema = z.enum(["none", "on_struggle", "generous"]);

export const DifficultyProfileSchema = z
  .object({
    baseLevel: DifficultyBaseLevelSchema.default("normal"),
    allowedRange: z.tuple([z.number().int(), z.number().int()]),
    hintPolicy: DifficultyHintPolicySchema.default("on_struggle"),
    adaptive: z.boolean().default(true),
  })
  .superRefine((profile, ctx) => {
    const [min, max] = profile.allowedRange;
    if (min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "allowedRange min must be <= max",
        path: ["allowedRange"],
      });
    }
  });

export type DifficultyProfile = z.infer<typeof DifficultyProfileSchema>;
export type DifficultyBaseLevel = z.infer<typeof DifficultyBaseLevelSchema>;
export type DifficultyHintPolicy = z.infer<typeof DifficultyHintPolicySchema>;

export const DEFAULT_DIFFICULTY_PROFILE: DifficultyProfile = {
  baseLevel: "normal",
  allowedRange: [1, 3],
  hintPolicy: "on_struggle",
  adaptive: true,
};

export function parseDifficultyProfile(input: unknown): DifficultyProfile {
  return DifficultyProfileSchema.parse(input);
}

export function safeParseDifficultyProfile(input: unknown) {
  return DifficultyProfileSchema.safeParse(input);
}

/** Map baseLevel to a tier inside allowedRange. */
export function baseTierFromProfile(profile: DifficultyProfile): number {
  const [min, max] = profile.allowedRange;
  switch (profile.baseLevel) {
    case "easy":
      return min;
    case "hard":
      return max;
    default:
      return Math.round((min + max) / 2);
  }
}

export function clampDifficultyTier(tier: number, profile: DifficultyProfile): number {
  const [min, max] = profile.allowedRange;
  return Math.min(max, Math.max(min, Math.trunc(tier)));
}
