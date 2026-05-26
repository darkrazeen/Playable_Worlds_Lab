import { z } from "zod";

/** Non-empty flag identifier used by choices and beats. */
export const FlagIdSchema = z.string().min(1);

export const FlagIdListSchema = z.array(FlagIdSchema);

export const PlayerChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  requiredFlags: FlagIdListSchema.optional(),
  blockedByFlags: FlagIdListSchema.optional(),
  consequenceId: z.string().min(1),
});

export type PlayerChoice = z.infer<typeof PlayerChoiceSchema>;

export function parsePlayerChoice(input: unknown): PlayerChoice {
  return PlayerChoiceSchema.parse(input);
}

export function safeParsePlayerChoice(input: unknown) {
  return PlayerChoiceSchema.safeParse(input);
}
