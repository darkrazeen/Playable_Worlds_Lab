import {
  createAIResultSchema,
  type AIResultOf,
  type Npc,
  type SafetyMode,
} from "@playable-worlds/core";

import { NpcReactionSchema, type NpcReaction } from "./npcReactionSchema.js";

/** Terms blocked in teen safety mode (lowercase match). */
const TEEN_BLOCKED_TERMS = ["damn", "hell", "kill you", "gore", "blood bath", "torture"] as const;

export type NpcReactionValidationOptions = {
  npc: Npc;
  safetyMode: SafetyMode;
  /** When true, line must reflect at least one NPC toneRule keyword. */
  enforceToneRules?: boolean;
};

export function validateNpcReactionIssues(
  reaction: NpcReaction,
  options: NpcReactionValidationOptions,
): string[] {
  const issues: string[] = [];
  const { npc, safetyMode, enforceToneRules = true } = options;
  const line = reaction.line.trim();

  if (reaction.npcId !== npc.id) {
    issues.push(`npcId must be "${npc.id}" but got "${reaction.npcId}"`);
  }

  if (safetyMode === "teen") {
    const lower = line.toLowerCase();
    for (const term of TEEN_BLOCKED_TERMS) {
      if (lower.includes(term)) {
        issues.push(`teen safety: line contains blocked term "${term}"`);
      }
    }
  }

  if (enforceToneRules && npc.toneRules.length > 0 && !lineMatchesToneRules(line, npc.toneRules)) {
    issues.push(`tone: line does not reflect NPC toneRules (${npc.toneRules.join(", ")})`);
  }

  return issues;
}

export function lineMatchesToneRules(line: string, toneRules: string[]): boolean {
  const lower = line.toLowerCase();
  return toneRules.some((rule) => {
    const tokens = rule
      .toLowerCase()
      .split(/[\s,]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4);
    if (tokens.length === 0) {
      return lower.includes(rule.toLowerCase());
    }
    return tokens.some((token) => lower.includes(token));
  });
}

export function applyNpcReactionFallback(
  result: AIResultOf<typeof NpcReactionSchema>,
  fallback: NpcReaction,
  validationErrors: string[],
): AIResultOf<typeof NpcReactionSchema> {
  const resultSchema = createAIResultSchema(NpcReactionSchema);
  const parsedFallback = NpcReactionSchema.safeParse(fallback);
  if (!parsedFallback.success) {
    return result;
  }

  return resultSchema.parse({
    ok: true,
    value: parsedFallback.data,
    provider: result.provider,
    fallbackUsed: true,
    validationErrors: [...(result.validationErrors ?? []), ...validationErrors],
    raw: result.raw,
    latencyMs: result.latencyMs,
    generationSeed: result.generationSeed,
  }) as AIResultOf<typeof NpcReactionSchema>;
}
