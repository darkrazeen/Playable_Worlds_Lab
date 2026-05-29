import type { DirectorReasoningEntry } from "./directorReasoningTypes.js";

type DirectorReasoningPanelProps = {
  entry: DirectorReasoningEntry | null;
  loading?: boolean;
  error?: string | null;
};

function statusLabel(entry: DirectorReasoningEntry): string {
  if (!entry.ok) return "Failed";
  if (entry.fallbackUsed) return "Fallback";
  return "Suggested";
}

function statusBadgeClass(entry: DirectorReasoningEntry): string {
  if (!entry.ok) {
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
  }
  if (entry.fallbackUsed) {
    return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100";
  }
  return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200";
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/** Read-only Director AI inspection panel — does not apply suggestions to gameplay. */
export function DirectorReasoningPanel({
  entry,
  loading = false,
  error = null,
}: DirectorReasoningPanelProps) {
  return (
    <aside
      aria-label="Director reasoning"
      className="w-full shrink-0 rounded-lg border border-violet-200/80 bg-violet-50/40 p-4 dark:border-violet-900/60 dark:bg-violet-950/30 lg:w-72"
    >
      <header className="mb-4 border-b border-violet-200/80 pb-3 dark:border-violet-900/60">
        <h2 className="text-sm font-semibold tracking-tight">Director reasoning</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          AI proposes — engine executes. Suggestions are not applied automatically.
        </p>
      </header>

      {loading ? <p className="text-sm italic text-neutral-500">Loading suggestion…</p> : null}

      {error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && !entry ? (
        <p className="text-sm italic text-neutral-400 dark:text-neutral-500">
          No director suggestion yet
        </p>
      ) : null}

      {entry && !loading ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {entry.turnNumber !== undefined ? (
              <span className="font-mono text-xs text-neutral-500">T{entry.turnNumber}</span>
            ) : null}
            <span
              className={`rounded border px-1.5 py-0.5 text-xs font-medium ${statusBadgeClass(entry)}`}
            >
              {statusLabel(entry)}
            </span>
            <span className="font-mono text-xs text-neutral-500">{entry.provider}</span>
          </div>

          {entry.decision ? (
            <dl className="space-y-2 rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Action
                </dt>
                <dd className="mt-0.5 font-mono text-neutral-800 dark:text-neutral-200">
                  {entry.decision.action}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Target
                </dt>
                <dd className="mt-0.5 font-mono text-neutral-800 dark:text-neutral-200">
                  {entry.decision.targetId}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Reason
                </dt>
                <dd className="mt-0.5 text-neutral-800 dark:text-neutral-200">
                  {entry.decision.reason}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Confidence
                </dt>
                <dd className="mt-0.5 font-mono text-neutral-800 dark:text-neutral-200">
                  {formatConfidence(entry.decision.confidence)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-neutral-600 dark:text-neutral-400">
              No structured decision returned.
            </p>
          )}

          {entry.task ? (
            <p className="font-mono text-xs text-neutral-500">Task: {entry.task}</p>
          ) : null}

          {entry.generationSeed ? (
            <p className="font-mono text-xs text-neutral-500 break-all">
              Seed: {entry.generationSeed}
            </p>
          ) : null}

          {entry.validationErrors && entry.validationErrors.length > 0 ? (
            <section className="space-y-1">
              <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Validation
              </h3>
              <ul className="list-inside list-disc text-xs text-red-700 dark:text-red-300">
                {entry.validationErrors.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
