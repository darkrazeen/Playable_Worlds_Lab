import { z } from "zod";

import { NamedIdSchema } from "@playable-worlds/core";

/** Max spoken line length for NPC reactions (flavor only, not lore dumps). */
export const NPC_REACTION_MAX_LENGTH = 280;

export const NpcReactionSchema = z.object({
  npcId: NamedIdSchema,
  line: z.string().min(1).max(NPC_REACTION_MAX_LENGTH),
});

export type NpcReaction = z.infer<typeof NpcReactionSchema>;

export function parseNpcReaction(input: unknown): NpcReaction {
  return NpcReactionSchema.parse(input);
}

export function safeParseNpcReaction(input: unknown) {
  return NpcReactionSchema.safeParse(input);
}
