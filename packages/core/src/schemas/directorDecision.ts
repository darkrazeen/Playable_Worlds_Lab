import { z } from "zod";

import { parseDifficultyTierTargetId } from "./directorDifficultyDecision.js";
import { NamedIdSchema } from "./ids.js";

export const DirectorDecisionTargetIdSchema = NamedIdSchema;

/** v4.1 canonical Director actions — see Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22 */
export const DirectorDecisionActionSchema = z.enum([
  "select_next_beat",
  "generate_consequence",
  "generate_instance",
  "generate_npc_reaction",
  "summarize_world",
  "suggest_session_wrapup",
  "adjust_difficulty",
]);

export const SafetyNoteSchema = z.string().min(1);
export const SafetyNoteListSchema = z.array(SafetyNoteSchema);

export const DirectorDecisionSchema = z
  .object({
    action: DirectorDecisionActionSchema,
    targetId: DirectorDecisionTargetIdSchema,
    reason: z.string().min(1),
    confidence: z.number().min(0).max(1),
    safetyNotes: SafetyNoteListSchema.optional(),
  })
  .superRefine((decision, ctx) => {
    if (decision.action !== "adjust_difficulty") {
      return;
    }
    if (parseDifficultyTierTargetId(decision.targetId) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'adjust_difficulty targetId must match "difficulty_tier_<integer>"',
        path: ["targetId"],
      });
    }
  });

export type DirectorDecision = z.infer<typeof DirectorDecisionSchema>;
export type DirectorDecisionAction = z.infer<typeof DirectorDecisionActionSchema>;

export function parseDirectorDecision(input: unknown): DirectorDecision {
  return DirectorDecisionSchema.parse(input);
}

export function safeParseDirectorDecision(input: unknown) {
  return DirectorDecisionSchema.safeParse(input);
}
