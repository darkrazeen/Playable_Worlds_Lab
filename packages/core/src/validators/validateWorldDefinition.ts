import type { Consequence } from "../schemas/consequence.js";
import type { StoryBeat } from "../schemas/storyBeat.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import { parseWorldDefinition } from "../schemas/worldDefinition.js";

export type WorldValidationResult = {
  ok: boolean;
  errors: string[];
};

function isExemptFlag(flag: string): boolean {
  return flag.startsWith("system_") || flag.startsWith("external_");
}

function applyConsequenceFlags(flags: Set<string>, consequence: Consequence): Set<string> {
  const next = new Set(flags);
  for (const removed of consequence.removeFlags) {
    next.delete(removed);
  }
  for (const added of consequence.addFlags) {
    next.add(added);
  }
  return next;
}

function beatAccessible(beat: StoryBeat, flags: Set<string>): boolean {
  const required = beat.requiredFlags ?? [];
  const blocked = beat.blockedByFlags ?? [];
  return (
    required.every((flag) => flags.has(flag) || isExemptFlag(flag)) &&
    blocked.every((flag) => !flags.has(flag))
  );
}

function choiceAccessible(
  beat: StoryBeat,
  choiceIndex: number,
  flags: Set<string>,
): boolean {
  const choice = beat.availableChoices[choiceIndex];
  if (!choice) return false;
  const required = choice.requiredFlags ?? [];
  const blocked = choice.blockedByFlags ?? [];
  return (
    required.every((flag) => flags.has(flag) || isExemptFlag(flag)) &&
    blocked.every((flag) => !flags.has(flag))
  );
}

/** Cross-file integrity checks beyond Zod shape validation (§11). */
export function validateWorldDefinition(world: WorldDefinition): WorldValidationResult {
  const errors: string[] = [];

  const beatById = new Map(world.storyBeats.map((beat) => [beat.id, beat]));
  const consequenceById = new Map(world.consequences.map((c) => [c.id, c]));
  const instanceById = new Map(world.temporaryInstances.map((i) => [i.id, i]));
  const npcById = new Map(world.npcs.map((n) => [n.id, n]));

  const beatIds = new Set<string>();
  const consequenceIds = new Set<string>();
  const npcIds = new Set<string>();
  const instanceIds = new Set<string>();
  const choiceIds = new Set<string>();

  const producedFlags = new Set<string>();
  const preconditionFlags = new Set<string>();

  for (const consequence of world.consequences) {
    for (const flag of consequence.addFlags) producedFlags.add(flag);
    for (const goal of consequence.unlockGoals ?? []) producedFlags.add(goal);
    for (const flag of consequence.removeFlags) preconditionFlags.add(flag);
  }

  for (const instance of world.temporaryInstances) {
    for (const flag of instance.requiredEntryFlags) preconditionFlags.add(flag);
  }

  for (const npc of world.npcs) {
    for (const flag of npc.knownFlags ?? []) preconditionFlags.add(flag);
  }

  const isKnownFlag = (flag: string) =>
    producedFlags.has(flag) || preconditionFlags.has(flag) || isExemptFlag(flag);

  // --- startingBeatId ---
  if (!beatById.has(world.startingBeatId)) {
    errors.push(
      `startingBeatId: "${world.startingBeatId}" does not reference an existing story beat`,
    );
  }

  // --- duplicate IDs ---
  for (const beat of world.storyBeats) {
    if (beatIds.has(beat.id)) {
      errors.push(`duplicate_id: story beat id "${beat.id}" is duplicated`);
    }
    beatIds.add(beat.id);

    const choiceIdsInBeat = new Set<string>();
    for (const [choiceIndex, choice] of beat.availableChoices.entries()) {
      if (choiceIdsInBeat.has(choice.id)) {
        errors.push(
          `duplicate_id: choice id "${choice.id}" is duplicated within beat "${beat.id}"`,
        );
      }
      choiceIdsInBeat.add(choice.id);

      if (choiceIds.has(choice.id)) {
        errors.push(
          `duplicate_id: choice id "${choice.id}" is duplicated across story beats`,
        );
      }
      choiceIds.add(choice.id);
    }
  }

  for (const consequence of world.consequences) {
    if (consequenceIds.has(consequence.id)) {
      errors.push(`duplicate_id: consequence id "${consequence.id}" is duplicated`);
    }
    consequenceIds.add(consequence.id);
  }

  for (const npc of world.npcs) {
    if (npcIds.has(npc.id)) {
      errors.push(`duplicate_id: npc id "${npc.id}" is duplicated`);
    }
    npcIds.add(npc.id);
  }

  for (const instance of world.temporaryInstances) {
    if (instanceIds.has(instance.id)) {
      errors.push(`duplicate_id: temporary instance id "${instance.id}" is duplicated`);
    }
    instanceIds.add(instance.id);
  }

  // --- reference integrity + flag requirements on beats/choices ---
  for (const beat of world.storyBeats) {
    for (const consequenceId of beat.possibleConsequences) {
      if (!consequenceById.has(consequenceId)) {
        errors.push(
          `reference: beat "${beat.id}" possibleConsequences lists unknown consequence "${consequenceId}"`,
        );
      }
    }

    for (const [choiceIndex, choice] of beat.availableChoices.entries()) {
      if (!consequenceById.has(choice.consequenceId)) {
        errors.push(
          `reference: beat "${beat.id}" choice[${choiceIndex}] ("${choice.id}") references unknown consequence "${choice.consequenceId}"`,
        );
      }

      for (const flag of choice.requiredFlags ?? []) {
        if (!isKnownFlag(flag)) {
          errors.push(
            `flag: beat "${beat.id}" choice "${choice.id}" requiredFlags references unknown or unproduced flag "${flag}"`,
          );
        }
      }

      for (const flag of choice.blockedByFlags ?? []) {
        if (!isKnownFlag(flag) && !isExemptFlag(flag)) {
          errors.push(
            `flag: beat "${beat.id}" choice "${choice.id}" blockedByFlags references unknown or unproduced flag "${flag}"`,
          );
        }
      }
    }

    for (const flag of beat.requiredFlags ?? []) {
      if (!isKnownFlag(flag)) {
        errors.push(
          `flag: beat "${beat.id}" requiredFlags references unknown or unproduced flag "${flag}"`,
        );
      }
    }

    for (const flag of beat.blockedByFlags ?? []) {
      if (!isKnownFlag(flag) && !isExemptFlag(flag)) {
        errors.push(
          `flag: beat "${beat.id}" blockedByFlags references unknown or unproduced flag "${flag}"`,
        );
      }
    }
  }

  for (const consequence of world.consequences) {
    for (const instanceId of consequence.temporaryInstances) {
      if (!instanceById.has(instanceId)) {
        errors.push(
          `reference: consequence "${consequence.id}" references unknown temporary instance "${instanceId}"`,
        );
      }
    }

    for (const [index, update] of consequence.npcUpdates.entries()) {
      if (!npcById.has(update.npcId)) {
        errors.push(
          `reference: consequence "${consequence.id}" npcUpdates[${index}] references unknown npc "${update.npcId}"`,
        );
      }
    }
  }

  for (const instance of world.temporaryInstances) {
    if (!consequenceById.has(instance.completionConsequenceId)) {
      errors.push(
        `reference: temporary instance "${instance.id}" completionConsequenceId references unknown consequence "${instance.completionConsequenceId}"`,
      );
    }

    const roomIds = new Set(instance.rooms.map((room) => room.id));
    for (const room of instance.rooms) {
      for (const connectedId of room.connectedRoomIds) {
        if (!roomIds.has(connectedId)) {
          errors.push(
            `reference: temporary instance "${instance.id}" room "${room.id}" connectedRoomIds references unknown room "${connectedId}"`,
          );
        }
      }
    }
  }

  // --- reachability (flag fixpoint from starting beat) ---
  let flagUnion = new Set<string>();
  const reachableBeatIds = new Set<string>();

  if (beatById.has(world.startingBeatId)) {
    let changed = true;
    while (changed) {
      changed = false;
      const nextFlagUnion = new Set(flagUnion);

      for (const beat of world.storyBeats) {
        if (!beatAccessible(beat, flagUnion)) continue;

        if (!reachableBeatIds.has(beat.id)) {
          reachableBeatIds.add(beat.id);
          changed = true;
        }

        for (const [choiceIndex, choice] of beat.availableChoices.entries()) {
          if (!choiceAccessible(beat, choiceIndex, flagUnion)) continue;
          const consequence = consequenceById.get(choice.consequenceId);
          if (!consequence) continue;

          const after = applyConsequenceFlags(flagUnion, consequence);
          for (const flag of after) {
            if (!nextFlagUnion.has(flag)) {
              nextFlagUnion.add(flag);
              changed = true;
            }
          }
        }
      }

      flagUnion = nextFlagUnion;
    }
  }

  for (const beat of world.storyBeats) {
    if (beat.isHidden || beat.isEnding) continue;
    if (!reachableBeatIds.has(beat.id)) {
      errors.push(`reachability: story beat "${beat.id}" is unreachable from startingBeatId`);
    }
  }

  // --- dead ends on reachable non-ending beats ---
  for (const beatId of reachableBeatIds) {
    const beat = beatById.get(beatId);
    if (!beat || beat.isEnding) continue;

    const hasPlayableChoice = beat.availableChoices.some((_, choiceIndex) =>
      choiceAccessible(beat, choiceIndex, flagUnion),
    );

    if (!hasPlayableChoice) {
      errors.push(
        `dead_end: reachable non-ending beat "${beat.id}" has no playable choice under achievable flags`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

/** Parse with Zod, then run cross-file validation. */
export function parseAndValidateWorldDefinition(input: unknown): WorldValidationResult & {
  world?: WorldDefinition;
} {
  const parsed = parseWorldDefinition(input);
  const validation = validateWorldDefinition(parsed);
  return { ...validation, world: parsed };
}
