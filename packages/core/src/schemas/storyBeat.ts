import { z } from "zod";

import { ConsequenceIdSchema } from "./consequence.js";
import { FlagIdListSchema, PlayerChoiceSchema } from "./playerChoice.js";

export const StoryBeatSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  trigger: z.string().min(1),
  availableChoices: z.array(PlayerChoiceSchema).min(1),
  possibleConsequences: z.array(ConsequenceIdSchema).min(1),
  requiredFlags: FlagIdListSchema.optional(),
  blockedByFlags: FlagIdListSchema.optional(),
  isEnding: z.boolean().optional(),
  isHidden: z.boolean().optional(),
});

export type StoryBeat = z.infer<typeof StoryBeatSchema>;

export function parseStoryBeat(input: unknown): StoryBeat {
  return StoryBeatSchema.parse(input);
}

export function safeParseStoryBeat(input: unknown) {
  return StoryBeatSchema.safeParse(input);
}
