import { z } from "zod";

import { NpcAttitudeSchema, NpcIdSchema } from "./consequence.js";
import { FlagIdListSchema } from "./playerChoice.js";

export const NpcRoleSchema = z.string().min(1);

export const NpcToneRuleSchema = z.string().min(1);
export const NpcToneRuleListSchema = z.array(NpcToneRuleSchema);

export const NpcSchema = z.object({
  id: NpcIdSchema,
  name: z.string().min(1),
  role: NpcRoleSchema,
  description: z.string().min(1),
  attitude: NpcAttitudeSchema.default("neutral"),
  toneRules: NpcToneRuleListSchema.default([]),
  knownFlags: FlagIdListSchema.default([]),
});

export type Npc = z.infer<typeof NpcSchema>;

export function parseNpc(input: unknown): Npc {
  return NpcSchema.parse(input);
}

export function safeParseNpc(input: unknown) {
  return NpcSchema.safeParse(input);
}
