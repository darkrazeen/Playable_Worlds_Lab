import type { DebugEvent, DebugEventType } from "@playable-worlds/core/schemas";

type DebugTracePanelProps = {
  debugEvents: DebugEvent[];
  turnNumber?: number;
};

const TYPE_LABELS: Record<DebugEventType, string> = {
  choice_selected: "Choice",
  consequence_applied: "Consequence",
  flags_changed: "Flags",
  goal_unlocked: "Goal",
  ai_suggestion: "AI",
  fallback_used: "Fallback",
  validation_failed: "Validation",
  session_loaded: "Session",
  session_saved: "Session",
};

function typeBadgeClass(type: DebugEventType): string {
  switch (type) {
    case "validation_failed":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
    case "choice_selected":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200";
    case "consequence_applied":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
    case "flags_changed":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100";
    case "goal_unlocked":
      return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300";
  }
}

function formatMetadataHint(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;
  const parts: string[] = [];
  if (typeof metadata.choiceId === "string") parts.push(`choice: ${metadata.choiceId}`);
  if (typeof metadata.consequenceId === "string") {
    parts.push(`consequence: ${metadata.consequenceId}`);
  }
  if (typeof metadata.goalId === "string") parts.push(`goal: ${metadata.goalId}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Read-only debug trace for operator inspection (no mutation). */
export function DebugTracePanel({ debugEvents, turnNumber }: DebugTracePanelProps) {
  const sortedEvents = [...debugEvents];

  return (
    <aside
      aria-label="Debug trace"
      className="w-full shrink-0 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 lg:w-72"
    >
      <header className="mb-4 border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <h2 className="text-sm font-semibold tracking-tight">Why it changed</h2>
        {turnNumber !== undefined ? (
          <p className="mt-0.5 text-xs text-neutral-500">Session turn {turnNumber}</p>
        ) : null}
      </header>

      {sortedEvents.length === 0 ? (
        <p className="text-sm italic text-neutral-400 dark:text-neutral-500">No trace yet</p>
      ) : (
        <ol className="flex max-h-64 flex-col gap-2 overflow-y-auto text-sm">
          {sortedEvents.map((event, index) => {
            const metadataHint = formatMetadataHint(event.metadata);
            return (
              <li
                key={`${event.id}-${index}`}
                className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-neutral-500">T{event.turnNumber}</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs font-medium ${typeBadgeClass(event.type)}`}
                  >
                    {TYPE_LABELS[event.type]}
                  </span>
                </div>
                <p className="mt-1.5 text-neutral-800 dark:text-neutral-200">{event.summary}</p>
                {metadataHint ? (
                  <p className="mt-1 font-mono text-xs text-neutral-500">{metadataHint}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
