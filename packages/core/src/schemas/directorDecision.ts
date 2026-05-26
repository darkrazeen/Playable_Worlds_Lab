import { z } from "zod";

export const DirectorDecisionTargetIdSchema = z.string().min(1);

export const DirectorDecisionActionSchema = z.enum([
  "suggest_next_beat",
  "suggest_npc_reaction",
  "suggest_recap",
  "suggest_hint",
  "request_temporary_instance",
  "suggest_session_wrap_up",
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
