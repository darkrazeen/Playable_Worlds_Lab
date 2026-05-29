import {
  activeBlockedFlags,
  missingRequiredFlags,
  satisfiesFlagRequirements,
} from "../ledger/flagLifecycle.js";
import type { TemporaryInstance } from "../schemas/temporaryInstance.js";
import type { WorldDefinition } from "../schemas/worldDefinition.js";
import type { WorldSession } from "../schemas/worldSession.js";
import { ledgerActiveFlags } from "../story/beatAccessibility.js";

export type TemporaryInstanceEntryResult = {
  ok: boolean;
  errors: string[];
  instance?: TemporaryInstance;
};

/** Resolve a temporary instance definition from the world. */
export function getTemporaryInstance(
  world: WorldDefinition,
  instanceId: string,
): TemporaryInstance | undefined {
  return world.temporaryInstances.find((instance) => instance.id === instanceId);
}

/** Whether session ledger flags satisfy the instance entry requirements. */
export function canEnterTemporaryInstance(
  session: WorldSession,
  instance: TemporaryInstance,
): boolean {
  const flags = ledgerActiveFlags(session);
  return satisfiesFlagRequirements(flags, instance.requiredEntryFlags, []);
}

/** Validate that a session may load/enter a temporary instance. */
export function validateTemporaryInstanceEntry(
  world: WorldDefinition,
  session: WorldSession,
  instanceId: string,
): TemporaryInstanceEntryResult {
  const instance = getTemporaryInstance(world, instanceId);
  if (!instance) {
    return {
      ok: false,
      errors: [`instance-entry: unknown temporary instance "${instanceId}"`],
    };
  }

  const flags = ledgerActiveFlags(session);
  if (satisfiesFlagRequirements(flags, instance.requiredEntryFlags, [])) {
    return { ok: true, errors: [], instance };
  }

  const missing = missingRequiredFlags(flags, instance.requiredEntryFlags);
  const blocked = activeBlockedFlags(flags, []);
  const errors: string[] = [];
  if (missing.length > 0) {
    errors.push(`instance-entry: "${instanceId}" requires flags not active: ${missing.join(", ")}`);
  }
  if (blocked.length > 0) {
    errors.push(`instance-entry: "${instanceId}" blocked by active flags: ${blocked.join(", ")}`);
  }
  return { ok: false, errors, instance };
}
