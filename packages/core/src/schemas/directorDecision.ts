import { z } from "zod";

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
]);

export const SafetyNoteSchema = z.string().min(1);
export const SafetyNoteListSchema = z.array(SafetyNoteSchema);

export const DirectorDecisionSchema = z.object({
  action: DirectorDecisionActionSchema,
  targetId: DirectorDecisionTargetIdSchema,
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
  safetyNotes: SafetyNoteListSchema.optional(),
});

export type DirectorDecision = z.infer<typeof DirectorDecisionSchema>;
export type DirectorDecisionAction = z.infer<typeof DirectorDecisionActionSchema>;

export function parseDirectorDecision(input: unknown): DirectorDecision {
  return DirectorDecisionSchema.parse(input);
}

export function safeParseDirectorDecision(input: unknown) {
  return DirectorDecisionSchema.safeParse(input);
}
