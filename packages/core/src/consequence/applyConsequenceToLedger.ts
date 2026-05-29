import { applyFlagChanges } from "../ledger/flagLifecycle.js";
import type { Consequence } from "../schemas/consequence.js";
import type { WorldLedger } from "../schemas/worldLedger.js";
import { WorldLedgerSchema } from "../schemas/worldLedger.js";

function mergeUnique<T extends string>(existing: T[], additions: T[]): T[] {
  const merged = new Set(existing);
  for (const item of additions) {
    merged.add(item);
  }
  return [...merged];
}

/** Apply consequence ledger fields without mutating the input ledger. */
export function applyConsequenceToLedger(
  ledger: WorldLedger,
  consequence: Consequence,
  turnNumber: number,
  metadata?: { choiceId?: string },
): WorldLedger {
  const { activeFlags, resolvedFlags } = applyFlagChanges(
    ledger.activeFlags,
    ledger.resolvedFlags,
    {
      addFlags: consequence.addFlags,
      removeFlags: consequence.removeFlags,
    },
  );
  const unlockedGoals = mergeUnique(ledger.unlockedGoals, consequence.unlockGoals ?? []);
  const completedGoals = mergeUnique(ledger.completedGoals, consequence.completeGoals ?? []);

  let discoveredLocations = [...ledger.discoveredLocations];
  for (const locationId of consequence.closeLocations ?? []) {
    discoveredLocations = discoveredLocations.filter((entry) => entry !== locationId);
  }
  discoveredLocations = mergeUnique(discoveredLocations, consequence.exposeLocations ?? []);

  const eventId = `event_${consequence.id.replace(/^consequence_/, "")}_t${turnNumber}`;
  const worldEvents = [
    ...ledger.worldEvents,
    {
      id: eventId,
      type: "consequence" as const,
      summary: consequence.summary,
      turnNumber,
      metadata: {
        consequenceId: consequence.id,
        ...(metadata?.choiceId ? { choiceId: metadata.choiceId } : {}),
        ...(consequence.visibleChanges.length > 0
          ? { visibleChanges: consequence.visibleChanges }
          : {}),
      },
    },
  ];

  return WorldLedgerSchema.parse({
    activeFlags,
    resolvedFlags,
    unlockedGoals,
    completedGoals,
    discoveredLocations,
    worldEvents,
  });
}
