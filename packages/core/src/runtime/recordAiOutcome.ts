import {
  appendDebugEvent,
  appendValidationFailure,
  buildAiSuggestionEvent,
  buildFallbackUsedEvent,
} from "../debug/index.js";
import type { AIResult } from "../schemas/aiResult.js";
import type { WorldSession } from "../schemas/worldSession.js";

export type RecordAiOutcomeContext = {
  /** Agent name for traceability, e.g. `director` or `npc`. */
  agent: string;
  /** AIRequest.task value. */
  task: string;
  /** Optional override for ai_suggestion / fallback_used summary text. */
  summary?: string;
  /** Extra metadata stored on the debug event. */
  metadata?: Record<string, unknown>;
};

/**
 * Append ai_suggestion, fallback_used, or validation_failed debug events for an AIResult.
 * Never throws — returns the original session if debug append fails internally.
 */
export function recordAiGatewayOutcome(
  session: WorldSession,
  result: AIResult,
  context: RecordAiOutcomeContext,
): WorldSession {
  try {
    if (result.ok && result.fallbackUsed) {
      return appendDebugEvent(
        session,
        buildFallbackUsedEvent({
          turnNumber: session.turnNumber,
          agent: context.agent,
          task: context.task,
          provider: result.provider,
          summary:
            context.summary ??
            `${context.agent} used a deterministic fallback for ${context.task}.`,
          validationErrors: result.validationErrors,
          generationSeed: result.generationSeed,
          metadata: context.metadata,
        }),
      );
    }

    if (result.ok) {
      return appendDebugEvent(
        session,
        buildAiSuggestionEvent({
          turnNumber: session.turnNumber,
          agent: context.agent,
          task: context.task,
          provider: result.provider,
          summary:
            context.summary ?? `${context.agent} returned a valid ${context.task} suggestion.`,
          metadata: context.metadata,
        }),
      );
    }

    const errors =
      result.validationErrors && result.validationErrors.length > 0
        ? result.validationErrors
        : ["AI call failed without a configured fallback."];

    return appendValidationFailure(session, errors, {
      agent: context.agent,
      task: context.task,
      provider: result.provider,
      ...context.metadata,
    });
  } catch {
    return session;
  }
}
