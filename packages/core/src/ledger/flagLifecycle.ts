/**
 * Deterministic flag lifecycle for WorldLedger.
 * See packages/core/docs/flag-lifecycle.md for the contract.
 */

export type FlagChangeInput = {
  addFlags?: string[];
  removeFlags?: string[];
};

export type FlagChangeResult = {
  activeFlags: string[];
  resolvedFlags: string[];
};

/** Flags that satisfy gates without being present in activeFlags. */
export function isExemptFlag(flag: string): boolean {
  return flag.startsWith("system_") || flag.startsWith("external_");
}

/** Deduplicate while preserving first-seen order. */
export function normalizeFlagList(flags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const flag of flags) {
    if (!seen.has(flag)) {
      seen.add(flag);
      normalized.push(flag);
    }
  }
  return normalized;
}

export function activeFlagSet(activeFlags: string[]): Set<string> {
  return new Set(activeFlags);
}

/**
 * Gate check shared by beats, choices, and consequences.
 * requiredFlags must be active (or exempt); blockedByFlags must not be active.
 */
export function satisfiesFlagRequirements(
  activeFlags: Set<string>,
  requiredFlags: string[] = [],
  blockedByFlags: string[] = [],
): boolean {
  return (
    requiredFlags.every((flag) => activeFlags.has(flag) || isExemptFlag(flag)) &&
    blockedByFlags.every((flag) => !activeFlags.has(flag))
  );
}

export function missingRequiredFlags(
  activeFlags: Set<string>,
  requiredFlags: string[] = [],
): string[] {
  return requiredFlags.filter((flag) => !activeFlags.has(flag) && !isExemptFlag(flag));
}

export function activeBlockedFlags(
  activeFlags: Set<string>,
  blockedByFlags: string[] = [],
): string[] {
  return blockedByFlags.filter((flag) => activeFlags.has(flag));
}

/**
 * Apply consequence flag mutations:
 * - removeFlags: drop from active; record in resolved (settled / no longer active)
 * - addFlags: add to active; clear from resolved if reactivated
 * Output lists are deduped and mutually exclusive.
 */
export function applyFlagChanges(
  activeFlags: string[],
  resolvedFlags: string[],
  changes: FlagChangeInput,
): FlagChangeResult {
  const toRemove = changes.removeFlags ?? [];
  const toAdd = changes.addFlags ?? [];

  let nextActive = activeFlags.filter((flag) => !toRemove.includes(flag));
  let nextResolved = [...resolvedFlags];

  for (const flag of toRemove) {
    if (!nextResolved.includes(flag)) {
      nextResolved.push(flag);
    }
  }

  for (const flag of toAdd) {
    if (!nextActive.includes(flag)) {
      nextActive.push(flag);
    }
    nextResolved = nextResolved.filter((entry) => entry !== flag);
  }

  nextActive = normalizeFlagList(nextActive);
  nextResolved = normalizeFlagList(
    nextResolved.filter((flag) => !nextActive.includes(flag)),
  );

  return { activeFlags: nextActive, resolvedFlags: nextResolved };
}

export type LedgerFlagValidationResult = {
  ok: boolean;
  errors: string[];
};

/** Validate active/resolved flag lists on a ledger snapshot. */
export function validateLedgerFlags(
  activeFlags: string[],
  resolvedFlags: string[],
): LedgerFlagValidationResult {
  const errors: string[] = [];

  if (normalizeFlagList(activeFlags).length !== activeFlags.length) {
    errors.push("ledger-flags: activeFlags contains duplicates");
  }
  if (normalizeFlagList(resolvedFlags).length !== resolvedFlags.length) {
    errors.push("ledger-flags: resolvedFlags contains duplicates");
  }

  const resolvedSet = new Set(resolvedFlags);
  for (const flag of activeFlags) {
    if (resolvedSet.has(flag)) {
      errors.push(
        `ledger-flags: flag "${flag}" cannot be both active and resolved`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
