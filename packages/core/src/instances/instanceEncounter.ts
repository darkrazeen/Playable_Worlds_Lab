import { z } from "zod";

import { ConsequenceIdSchema } from "../schemas/consequence.js";
import { NamedIdSchema } from "../schemas/ids.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";

export const MAX_INSTANCE_ENCOUNTER_CHOICES = 4;

export const InstanceEncounterChoiceSchema = z.object({
  id: NamedIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  consequenceId: ConsequenceIdSchema,
});

export const InstanceEncounterSchema = z.object({
  id: NamedIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  choices: z.array(InstanceEncounterChoiceSchema).min(1).max(MAX_INSTANCE_ENCOUNTER_CHOICES),
});

export type InstanceEncounter = z.infer<typeof InstanceEncounterSchema>;
export type InstanceEncounterChoice = z.infer<typeof InstanceEncounterChoiceSchema>;

export function parseInstanceEncounter(input: unknown): InstanceEncounter {
  return InstanceEncounterSchema.parse(input);
}

export function safeParseInstanceEncounter(input: unknown) {
  return InstanceEncounterSchema.safeParse(input);
}

/** Ensure every encounter choice references a consequence defined on the world. */
export function validateInstanceEncounterAgainstWorld(
  encounter: InstanceEncounter,
  world: WorldDefinition,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const consequenceIds = new Set(world.consequences.map((entry) => entry.id));

  for (const choice of encounter.choices) {
    if (!consequenceIds.has(choice.consequenceId)) {
      errors.push(
        `instance-encounter: choice "${choice.id}" references unknown consequence "${choice.consequenceId}"`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

export function findInstanceEncounterChoice(
  encounter: InstanceEncounter,
  choiceId: string,
): InstanceEncounterChoice | undefined {
  return encounter.choices.find((choice) => choice.id === choiceId);
}
