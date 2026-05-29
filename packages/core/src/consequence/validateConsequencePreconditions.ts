import {
  activeBlockedFlags,
  missingRequiredFlags,
  satisfiesFlagRequirements,
} from "../ledger/flagLifecycle.js";
import type { Consequence } from "../schemas/consequence.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";
import {
  isPlayerChoiceAccessible,
  ledgerActiveFlags,
} from "../story/beatAccessibility.js";

export type ConsequencePreconditionResult = {
  ok: boolean;
  errors: string[];
};

/**
 * Deterministic precondition checks before applying a consequence.
 * Validates session flag gates, optional choice gates, and world reference integrity.
 */
export function validateConsequencePreconditions(
  world: WorldDefinition,
  session: WorldSession,
  consequence: Consequence,
  context?: { choiceId?: string },
): ConsequencePreconditionResult {
  const errors: string[] = [];
  const flags = ledgerActiveFlags(session);
  const npcIds = new Set(world.npcs.map((npc) => npc.id));
  const instanceIds = new Set(world.temporaryInstances.map((instance) => instance.id));

  if (
    !satisfiesFlagRequirements(
      flags,
      consequence.requiredFlags ?? [],
      consequence.blockedByFlags ?? [],
    )
  ) {
    const missingRequired = missingRequiredFlags(flags, consequence.requiredFlags ?? []);
    const activeBlocked = activeBlockedFlags(flags, consequence.blockedByFlags ?? []);
    if (missingRequired.length > 0) {
      errors.push(
        `consequence-precondition: consequence "${consequence.id}" requires flags not active: ${missingRequired.join(", ")}`,
      );
    }
    if (activeBlocked.length > 0) {
      errors.push(
        `consequence-precondition: consequence "${consequence.id}" blocked by active flags: ${activeBlocked.join(", ")}`,
      );
    }
  }

  if (context?.choiceId) {
    const linkedChoice = world.storyBeats
      .flatMap((beat) => beat.availableChoices)
      .find(
        (choice) => choice.id === context.choiceId && choice.consequenceId === consequence.id,
      );

    if (!linkedChoice) {
      errors.push(
        `consequence-precondition: choice "${context.choiceId}" does not reference consequence "${consequence.id}"`,
      );
    } else if (!isPlayerChoiceAccessible(linkedChoice, flags)) {
      errors.push(
        `consequence-precondition: choice "${context.choiceId}" is blocked by session flags`,
      );
    }
  }

  for (const instanceId of consequence.temporaryInstances ?? []) {
    if (!instanceIds.has(instanceId)) {
      errors.push(
        `consequence-precondition: consequence "${consequence.id}" references unknown temporary instance "${instanceId}"`,
      );
    }
  }

  for (const [index, update] of (consequence.npcUpdates ?? []).entries()) {
    if (!npcIds.has(update.npcId)) {
      errors.push(
        `consequence-precondition: consequence "${consequence.id}" npcUpdates[${index}] references unknown npc "${update.npcId}"`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
