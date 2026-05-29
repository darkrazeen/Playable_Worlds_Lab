import {
  DirectorDecisionSchema,
  type AIResult,
  type DebugEvent,
} from "@playable-worlds/core/schemas";

import type { DirectorReasoningEntry } from "./directorReasoningTypes.js";

const DIRECTOR_AGENT = "director";
const DIRECTOR_EVENT_TYPES = new Set(["ai_suggestion", "fallback_used"]);

/** Build a panel entry from an AIResult (primary source for live suggestions). */
export function buildDirectorReasoningEntry(
  result: AIResult,
  context?: { task?: string; turnNumber?: number },
): DirectorReasoningEntry {
  const parsed = result.value
    ? DirectorDecisionSchema.safeParse(result.value)
    : { success: false as const, error: null };

  return {
    decision: parsed.success ? parsed.data : undefined,
    fallbackUsed: result.fallbackUsed,
    ok: result.ok,
    provider: result.provider,
    validationErrors: result.validationErrors,
    generationSeed: result.generationSeed,
    task: context?.task,
    turnNumber: context?.turnNumber,
  };
}

/** Extract director-related entries from session debug events (newest first). */
export function extractDirectorReasoningFromDebugEvents(
  debugEvents: DebugEvent[],
): DirectorReasoningEntry[] {
  const entries: DirectorReasoningEntry[] = [];

  for (let i = debugEvents.length - 1; i >= 0; i--) {
    const event = debugEvents[i]!;
    if (!DIRECTOR_EVENT_TYPES.has(event.type)) continue;

    const metadata = event.metadata;
    if (metadata?.agent !== DIRECTOR_AGENT) continue;

    const decisionRaw = metadata.decision;
    const parsed = decisionRaw
      ? DirectorDecisionSchema.safeParse(decisionRaw)
      : { success: false as const, error: null };

    entries.push({
      decision: parsed.success ? parsed.data : undefined,
      fallbackUsed: event.type === "fallback_used",
      ok: event.type === "ai_suggestion",
      provider: typeof metadata.provider === "string" ? metadata.provider : "unknown",
      validationErrors: Array.isArray(metadata.validationErrors)
        ? metadata.validationErrors.filter((e): e is string => typeof e === "string")
        : undefined,
      generationSeed:
        typeof metadata.generationSeed === "string" ? metadata.generationSeed : undefined,
      task: typeof metadata.task === "string" ? metadata.task : undefined,
      turnNumber: event.turnNumber,
    });
  }

  return entries;
}
