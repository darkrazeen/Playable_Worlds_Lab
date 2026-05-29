import type { z } from "zod";

import {
  recordAiGatewayOutcome,
  type AIResultOf,
  type RecordAiOutcomeContext,
  type WorldSession,
} from "@playable-worlds/core";

import type { AIGateway, AIGatewayGenerateOptions } from "./aiGateway.js";

export type GenerateStructuredWithDebugOptions<T extends z.ZodTypeAny> =
  AIGatewayGenerateOptions<T> & {
    session: WorldSession;
    debug: RecordAiOutcomeContext;
  };

export type GenerateStructuredWithDebugResult<T extends z.ZodTypeAny> = {
  result: AIResultOf<T>;
  session: WorldSession;
};

/**
 * Run a gateway call and append ai_suggestion / fallback_used / validation_failed debug events.
 * Gameplay must not depend on result.ok — engine continues deterministically either way.
 */
export async function generateStructuredWithDebug<T extends z.ZodTypeAny>(
  gateway: AIGateway,
  options: GenerateStructuredWithDebugOptions<T>,
): Promise<GenerateStructuredWithDebugResult<T>> {
  const { session, debug, ...gatewayOptions } = options;
  const result = await gateway.generateStructured(gatewayOptions);
  const nextSession = recordAiGatewayOutcome(session, result, debug);
  return { result, session: nextSession };
}
