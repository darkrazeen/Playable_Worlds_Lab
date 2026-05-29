import type { WorldLedger } from "@playable-worlds/core/schemas";

type WorldLedgerPanelProps = {
  ledger: WorldLedger;
  turnNumber?: number;
};

function LedgerSection({
  title,
  items,
  emptyLabel = "None yet",
}: {
  title: string;
  items: string[];
  emptyLabel?: string;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm italic text-neutral-400 dark:text-neutral-500">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Read-only view of what the session ledger remembers (no mutation). */
export function WorldLedgerPanel({ ledger, turnNumber }: WorldLedgerPanelProps) {
  const sortedEvents = [...ledger.worldEvents].sort((a, b) => a.turnNumber - b.turnNumber);

  return (
    <aside
      aria-label="World ledger"
      className="w-full shrink-0 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 lg:w-72"
    >
      <header className="mb-4 border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <h2 className="text-sm font-semibold tracking-tight">World remembers</h2>
        {turnNumber !== undefined ? (
          <p className="mt-0.5 text-xs text-neutral-500">Session turn {turnNumber}</p>
        ) : null}
      </header>

      <div className="flex flex-col gap-4">
        <LedgerSection title="Active flags" items={ledger.activeFlags} />
        <LedgerSection title="Resolved flags" items={ledger.resolvedFlags} />
        <LedgerSection title="Unlocked goals" items={ledger.unlockedGoals} />
        <LedgerSection title="Completed goals" items={ledger.completedGoals} />
        <LedgerSection title="Discovered locations" items={ledger.discoveredLocations} />

        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            World events
          </h3>
          {sortedEvents.length === 0 ? (
            <p className="text-sm italic text-neutral-400 dark:text-neutral-500">None yet</p>
          ) : (
            <ol className="flex max-h-48 flex-col gap-2 overflow-y-auto text-sm">
              {sortedEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <p className="font-mono text-xs text-neutral-500">
                    Turn {event.turnNumber} · {event.type}
                  </p>
                  <p className="mt-1 text-neutral-800 dark:text-neutral-200">{event.summary}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </aside>
  );
}
