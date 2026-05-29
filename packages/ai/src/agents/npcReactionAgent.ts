import {
  recordAiGatewayOutcome,
  type AIResultOf,
  type Npc,
  type SafetyMode,
  type WorldDefinition,
  type WorldSession,
} from "@playable-worlds/core";

import {
  createAIGatewayFromEnv,
  type CreateAIProviderFromEnvOptions,
} from "../config/resolveAIProvider.js";
import type { AIGateway } from "../gateway/aiGateway.js";
import { buildDirectorContext } from "./directorAgent.js";
import { STONEPASS_ELDER_REACTION, STONEPASS_OGRE_REACTION } from "./fakeNpcReactionScenarios.js";
import {
  NPC_REACTION_MAX_LENGTH,
  NpcReactionSchema,
  type NpcReaction,
} from "./npcReactionSchema.js";
import { applyNpcReactionFallback, validateNpcReactionIssues } from "./validateNpcReaction.js";

export const NPC_REACTION_TASK = "npc_reaction";

export type NPCReactionAgentOptions = {
  gateway: AIGateway;
  /** When true (default), post-validate tone and safety after the gateway returns. */
  enforceReactionRules?: boolean;
};

export type NPCReactionInput = {
  session: WorldSession;
  npc: Npc;
  safetyMode: SafetyMode;
  world?: WorldDefinition;
  /** Short description of what triggered the reaction (read-only context). */
  trigger?: string;
  generationSeed?: string;
  fallback?: NpcReaction;
};

export type NPCReactionTrackedResult = {
  result: AIResultOf<typeof NpcReactionSchema>;
  session: WorldSession;
};

/**
 * Phase 2 NPC flavor — proposes short NpcReaction lines via AIGateway only.
 * Does not mutate WorldSession, NPC records, or ledger state.
 */
export class NPCReactionAgent {
  readonly gateway: AIGateway;
  private readonly enforceReactionRules: boolean;

  constructor(options: NPCReactionAgentOptions) {
    this.gateway = options.gateway;
    this.enforceReactionRules = options.enforceReactionRules ?? true;
  }

  suggestReaction(input: NPCReactionInput): Promise<NPCReactionTrackedResult> {
    const { session, npc, safetyMode, trigger } = input;
    const fallback = input.fallback ?? buildDefaultNpcReactionFallback(npc);

    return this.requestReaction({
      ...input,
      fallback,
      prompt: buildNpcReactionPrompt(npc, trigger),
      context: {
        ...buildDirectorContext(session, input.world),
        npc: {
          id: npc.id,
          name: npc.name,
          role: npc.role,
          attitude: npc.attitude,
          toneRules: [...npc.toneRules],
          knownFlags: [...npc.knownFlags],
        },
        safetyMode,
        trigger: trigger ?? "Player action at the current beat.",
      },
    });
  }

  private async requestReaction(
    input: NPCReactionInput & {
      fallback: NpcReaction;
      prompt: string;
      context: Record<string, unknown>;
    },
  ): Promise<NPCReactionTrackedResult> {
    const { session, npc, safetyMode, fallback, prompt, context } = input;

    const gatewayResult = await this.gateway.generateStructured({
      request: {
        task: NPC_REACTION_TASK,
        prompt,
        context,
        generationSeed:
          input.generationSeed ??
          `${session.id}_t${session.turnNumber}_${NPC_REACTION_TASK}_${npc.id}`,
      },
      schema: NpcReactionSchema,
      fallbackValue: fallback,
    });

    let finalResult = gatewayResult;

    if (finalResult.ok && finalResult.value && this.enforceReactionRules) {
      const issues = validateNpcReactionIssues(finalResult.value, { npc, safetyMode });
      if (issues.length > 0 && !finalResult.fallbackUsed) {
        finalResult = applyNpcReactionFallback(finalResult, fallback, issues);
      }
    }

    const nextSession = recordAiGatewayOutcome(session, finalResult, {
      agent: "npc",
      task: NPC_REACTION_TASK,
      summary: finalResult.fallbackUsed
        ? `${npc.name} reaction used deterministic fallback.`
        : `${npc.name} reaction accepted.`,
      metadata: { npcId: npc.id },
    });

    return { result: finalResult, session: nextSession };
  }
}

export function buildNpcReactionPrompt(npc: Npc, trigger?: string): string {
  const tone = npc.toneRules.length > 0 ? npc.toneRules.join(", ") : "in character";
  const event = trigger ?? "the player's latest action";
  return [
    `Write one short in-character spoken line for ${npc.name} (${npc.role}, attitude: ${npc.attitude}).`,
    `React to ${event}.`,
    `Match tone rules: ${tone}.`,
    `Return JSON with npcId "${npc.id}" and a single line under ${NPC_REACTION_MAX_LENGTH} characters.`,
  ].join(" ");
}

function reactionFromScenario(scenario: typeof STONEPASS_OGRE_REACTION): NpcReaction {
  if (scenario.kind !== "success") {
    throw new Error("Expected success scenario for NPC reaction fallback");
  }
  return NpcReactionSchema.parse(scenario.value);
}

export function buildDefaultNpcReactionFallback(npc: Npc): NpcReaction {
  if (npc.id === "npc_ogre") {
    return reactionFromScenario(STONEPASS_OGRE_REACTION);
  }
  if (npc.id === "npc_elder") {
    return reactionFromScenario(STONEPASS_ELDER_REACTION);
  }

  return {
    npcId: npc.id,
    line: `${npc.name} pauses, considering your move.`,
  };
}

export function createNPCReactionAgent(gateway: AIGateway): NPCReactionAgent {
  return new NPCReactionAgent({ gateway });
}

export function createNPCReactionAgentFromEnv(
  options: CreateAIProviderFromEnvOptions = {},
): NPCReactionAgent {
  return createNPCReactionAgent(createAIGatewayFromEnv(options));
}
