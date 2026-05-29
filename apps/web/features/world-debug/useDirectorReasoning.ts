"use client";

import { useEffect, useState } from "react";

import type { WorldDefinition, WorldSession } from "@playable-worlds/core/schemas";
import type { AIGateway } from "@playable-worlds/ai";

import type { DirectorReasoningEntry } from "./directorReasoningTypes.js";
import { fetchDirectorReasoning } from "./fetchDirectorReasoning.js";

export type UseDirectorReasoningOptions = {
  gateway?: AIGateway;
  enabled?: boolean;
};

export type UseDirectorReasoningState = {
  entry: DirectorReasoningEntry | null;
  loading: boolean;
  error: string | null;
};

/**
 * Fetch the latest Director suggestion for display only (does not update play session).
 */
export function useDirectorReasoning(
  session: WorldSession | null,
  world: WorldDefinition,
  options: UseDirectorReasoningOptions = {},
): UseDirectorReasoningState {
  const { gateway, enabled = true } = options;
  const [entry, setEntry] = useState<DirectorReasoningEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !session) {
      setEntry(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDirectorReasoning(session, world, { gateway })
      .then((next) => {
        if (!cancelled) {
          setEntry(next);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setEntry(null);
          setLoading(false);
          setError(err instanceof Error ? err.message : "Director request failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, world, gateway, enabled]);

  return { entry, loading, error };
}
