import {
  DirectorDecisionSchema,
  type DirectorDecision,
  type DirectorDecisionAction,
  type AIResultOf,
  type WorldDefinition,
  type WorldSession,
} from "@playable-worlds/core";

import {
  createAIGatewayFromEnv,
  type CreateAIProviderFromEnvOptions,
} from "../config/resolveAIProvider.js";
import type { AIGateway } from "../gateway/aiGateway.js";
import { generateStructuredWithDebug } from "../gateway/generateStructuredWithDebug.js";

/** AIRequest.task values used by DirectorAgent. */
export const DIRECTOR_TASK = {
  SELECT_NEXT_BEAT: "director_select_next_beat",
  SUMMARIZE_WORLD: "director_summarize_world",
  SUGGEST_SESSION_WRAPUP: "director_suggest_session_wrapup",
  GENERATE_INSTANCE: "director_generate_instance",
} as const;

export type DirectorAgentOptions = {
  gateway: AIGateway;
};

export type DirectorSuggestionInput = {
  session: WorldSession;
  /** Optional world metadata for richer prompts (read-only). */
  world?: WorldDefinition;
  generationSeed?: string;
  /** Deterministic fallback when the provider fails or returns invalid output. */
  fallback?: DirectorDecision;
};

export type DirectorTrackedResult = {
  result: AIResultOf<typeof DirectorDecisionSchema>;
  session: WorldSession;
};

/**
 * Phase 2 Director — proposes DirectorDecision via AIGateway only.
 * Does not mutate WorldSession, WorldLedger, or any permanent world state.
 */
export class DirectorAgent {
  readonly gateway: AIGateway;

  constructor(options: DirectorAgentOptions) {
    this.gateway = options.gateway;
  }

  /** Suggest the next story beat (`select_next_beat`). */
  suggestNextBeat(input: DirectorSuggestionInput): Promise<DirectorTrackedResult> {
    return this.requestDirector({
      ...input,
      action: "select_next_beat",
      task: DIRECTOR_TASK.SELECT_NEXT_BEAT,
      prompt: buildDirectorPrompt("select_next_beat", input),
    });
  }

  /** Suggest a world recap (`summarize_world`). */
  suggestRecap(input: DirectorSuggestionInput): Promise<DirectorTrackedResult> {
    return this.requestDirector({
      ...input,
      action: "summarize_world",
      task: DIRECTOR_TASK.SUMMARIZE_WORLD,
      prompt: buildDirectorPrompt("summarize_world", input),
    });
  }

  /** Suggest ending or pausing the session (`suggest_session_wrapup`). */
  suggestSessionWrapup(input: DirectorSuggestionInput): Promise<DirectorTrackedResult> {
    return this.requestDirector({
      ...input,
      action: "suggest_session_wrapup",
      task: DIRECTOR_TASK.SUGGEST_SESSION_WRAPUP,
      prompt: buildDirectorPrompt("suggest_session_wrapup", input),
    });
  }

  /** Suggest a temporary instance draft (`generate_instance`). */
  suggestInstanceRequest(input: DirectorSuggestionInput): Promise<DirectorTrackedResult> {
    return this.requestDirector({
      ...input,
      action: "generate_instance",
      task: DIRECTOR_TASK.GENERATE_INSTANCE,
      prompt: buildDirectorPrompt("generate_instance", input),
    });
  }

  private async requestDirector(
    input: DirectorSuggestionInput & {
      action: DirectorDecisionAction;
      task: string;
      prompt: string;
    },
  ): Promise<DirectorTrackedResult> {
    const { session, action, task, prompt } = input;
    const fallback = input.fallback ?? buildDefaultDirectorFallback(action, session);

    return generateStructuredWithDebug(this.gateway, {
      request: {
        task,
        prompt,
        context: buildDirectorContext(session, input.world),
        generationSeed: input.generationSeed ?? buildDirectorGenerationSeed(session, task),
      },
      schema: DirectorDecisionSchema,
      fallbackValue: fallback,
      session,
      debug: {
        agent: "director",
        task,
        summary: buildDirectorOutcomeSummary(action, fallback, session),
        metadata: { action, targetId: fallback.targetId },
      },
    });
  }
}

function buildDirectorOutcomeSummary(
  action: DirectorDecisionAction,
  fallback: DirectorDecision,
  session: WorldSession,
): string {
  switch (action) {
    case "select_next_beat":
      return `Director beat suggestion (fallback target: ${fallback.targetId}).`;
    case "summarize_world":
      return `Director recap at beat ${session.currentBeatId}.`;
    case "suggest_session_wrapup":
      return `Director session wrap-up hint at ${session.currentBeatId}.`;
    case "generate_instance":
      return `Director instance draft suggestion at ${session.currentBeatId}.`;
    default:
      return `Director ${action} suggestion.`;
  }
}

export function createDirectorAgent(gateway: AIGateway): DirectorAgent {
  return new DirectorAgent({ gateway });
}

export function createDirectorAgentFromEnv(
  options: CreateAIProviderFromEnvOptions = {},
): DirectorAgent {
  return createDirectorAgent(createAIGatewayFromEnv(options));
}

export function buildDirectorContext(
  session: WorldSession,
  world?: WorldDefinition,
): Record<string, unknown> {
  return {
    sessionId: session.id,
    worldId: session.worldId,
    worldVersionId: session.worldVersionId,
    currentBeatId: session.currentBeatId,
    turnNumber: session.turnNumber,
    choiceHistory: [...session.choiceHistory],
    activeFlags: [...session.ledger.activeFlags],
    resolvedFlags: [...session.ledger.resolvedFlags],
    unlockedGoals: [...session.ledger.unlockedGoals],
    completedGoals: [...session.ledger.completedGoals],
    discoveredLocations: [...session.ledger.discoveredLocations],
    activeTemporaryInstanceId: session.activeTemporaryInstanceId,
    worldTitle: world?.title,
    safetyMode: world?.worldDNA.safetyMode,
  };
}

export function buildDirectorGenerationSeed(session: WorldSession, task: string): string {
  return `${session.id}_t${session.turnNumber}_${task}`;
}

export function buildDirectorPrompt(
  action: DirectorDecisionAction,
  input: DirectorSuggestionInput,
): string {
  const beat = input.session.currentBeatId;
  switch (action) {
    case "select_next_beat":
      return `Suggest the next story beat after the player finishes "${beat}". Use action select_next_beat with a valid beat id as targetId.`;
    case "summarize_world":
      return `Summarize what has happened so far in this session at beat "${beat}". Use action summarize_world.`;
    case "suggest_session_wrapup":
      return `Suggest whether the player should wrap up the session at beat "${beat}". Use action suggest_session_wrapup.`;
    case "generate_instance":
      return `Suggest a short temporary instance the player could enter from beat "${beat}". Use action generate_instance with a proposed instance id as targetId.`;
    default:
      return `Director suggestion for action "${action}" at beat "${beat}".`;
  }
}

/** Deterministic fallback decisions — engine may ignore or apply after validation. */
export function buildDefaultDirectorFallback(
  action: DirectorDecisionAction,
  session: WorldSession,
): DirectorDecision {
  switch (action) {
    case "select_next_beat":
      return {
        action: "select_next_beat",
        targetId: session.currentBeatId,
        reason: `Deterministic fallback: remain at ${session.currentBeatId} when the director is unavailable.`,
        confidence: 0.5,
      };
    case "summarize_world":
      return {
        action: "summarize_world",
        targetId: session.worldId,
        reason: `Deterministic fallback recap at turn ${session.turnNumber}, beat ${session.currentBeatId}.`,
        confidence: 0.5,
      };
    case "suggest_session_wrapup":
      return {
        action: "suggest_session_wrapup",
        targetId: session.currentBeatId,
        reason: `Deterministic fallback: pause at ${session.currentBeatId} when wrap-up suggestion is unavailable.`,
        confidence: 0.5,
      };
    case "generate_instance":
      return {
        action: "generate_instance",
        targetId: "instance_director_fallback",
        reason: `Deterministic fallback: no instance draft at beat ${session.currentBeatId}.`,
        confidence: 0.3,
      };
    default:
      return {
        action,
        targetId: session.currentBeatId,
        reason: "Deterministic fallback director decision.",
        confidence: 0.5,
      };
  }
}
