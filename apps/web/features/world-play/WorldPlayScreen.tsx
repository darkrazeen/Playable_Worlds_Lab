"use client";

import { useMemo, useState } from "react";

import type { WorldDefinition, WorldSession } from "@playable-worlds/core/schemas";

import { WorldLedgerPanel } from "@/features/world-debug";

import {
  applyPlayChoice,
  createInitialPlayState,
  getPlayViewState,
  type PlayViewState,
} from "./worldPlayRuntime";

type WorldPlayScreenProps = {
  world: WorldDefinition;
};

export function WorldPlayScreen({ world }: WorldPlayScreenProps) {
  const initialState = useMemo(() => createInitialPlayState(world), [world]);
  const [session, setSession] = useState<WorldSession | null>(
    initialState.session ?? null,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const displayView = useMemo(
    () =>
      session
        ? getPlayViewState(world, session)
        : ({
            ok: false,
            errors: initialState.errors,
            choices: [],
            turnNumber: 0,
          } satisfies PlayViewState),
    [session, world, initialState.errors],
  );

  if (!initialState.ok || !session) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        <h2 className="text-lg font-semibold">Could not start session</h2>
        <ul className="mt-2 list-inside list-disc text-sm">
          {initialState.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  function handleChoice(choiceId: string) {
    setChoiceError(null);
    setIsApplying(true);

    const result = applyPlayChoice(world, session!, choiceId);
    setIsApplying(false);

    if (!result.ok || !result.session) {
      setChoiceError(result.errors.join(" "));
      return;
    }

    setSession(result.session);
    setFeedback(result.consequenceSummary ?? null);
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
      <header className="space-y-1 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          {world.title}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {displayView.beat?.title ?? "Story beat"}
        </h1>
        <p className="text-sm text-neutral-500">Turn {displayView.turnNumber}</p>
      </header>

      {displayView.beat?.description ? (
        <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          {displayView.beat.description}
        </p>
      ) : null}

      {feedback ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          role="status"
        >
          {feedback}
        </p>
      ) : null}

      {choiceError ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {choiceError}
        </p>
      ) : null}

      <section aria-label="Available choices" className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          What do you do?
        </h2>
        {displayView.choices.length === 0 ? (
          <p className="text-sm text-neutral-500">No choices available on this beat.</p>
        ) : (
          displayView.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              disabled={isApplying}
              onClick={() => handleChoice(choice.id)}
              className="rounded-lg border border-neutral-200 px-4 py-3 text-left transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:bg-neutral-900"
            >
              <span className="block font-medium">{choice.label}</span>
              {choice.description ? (
                <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-400">
                  {choice.description}
                </span>
              ) : null}
            </button>
          ))
        )}
      </section>
      </div>

      <WorldLedgerPanel ledger={session.ledger} turnNumber={displayView.turnNumber} />
    </div>
  );
}
