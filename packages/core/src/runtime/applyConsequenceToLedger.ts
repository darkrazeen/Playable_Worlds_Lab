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

/** Apply consequence fields to a ledger without mutating the input. */
export function applyConsequenceToLedger(
  ledger: WorldLedger,
  consequence: Consequence,
  turnNumber: number,
  metadata?: { choiceId?: string },
): WorldLedger {
  let activeFlags = [...ledger.activeFlags];
  for (const flag of consequence.removeFlags) {
    activeFlags = activeFlags.filter((entry) => entry !== flag);
  }
  activeFlags = mergeUnique(activeFlags, consequence.addFlags);

  const resolvedFlags = mergeUnique(ledger.resolvedFlags, consequence.removeFlags);
  const unlockedGoals = mergeUnique(ledger.unlockedGoals, consequence.unlockGoals ?? []);
  const completedGoals = mergeUnique(ledger.completedGoals, consequence.completeGoals ?? []);

  let discoveredLocations = [...ledger.discoveredLocations];
  for (const locationId of consequence.closeLocations ?? []) {
    discoveredLocations = discoveredLocations.filter((entry) => entry !== locationId);
  }
  discoveredLocations = mergeUnique(discoveredLocations, consequence.exposeLocations ?? []);

  const eventId = `event_${consequence.id.replace(/^consequence_/, "")}`;
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
