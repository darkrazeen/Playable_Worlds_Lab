import type { z } from "zod";

import {
  createAIResultSchema,
  deriveAiGenerationSeed,
  type AIResultOf,
  type GenerationSeedSessionContext,
} from "@playable-worlds/core";

import type { AIProvider } from "../contracts/aiProvider.js";
import { safeParseAIRequest, type AIRequest } from "../contracts/aiRequest.js";

export type AIGatewayOptions = {
  provider: AIProvider;
};

export type AIGatewayGenerateOptions<T extends z.ZodTypeAny> = {
  request: AIRequest | unknown;
  schema: T;
  /**
   * Deterministic fallback when the provider errors or returns invalid output.
   * Must satisfy `schema`; engine code may apply this instead of model output.
   */
  fallbackValue?: z.infer<T>;
  /**
   * When the request omits generationSeed, derive one from session root + turn + task.
   */
  session?: GenerationSeedSessionContext;
};

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

/**
 * Controlled access layer for structured AI calls.
 * Validates requests, delegates to AIProvider, and normalizes success / validation / fallback outcomes.
 */
export class AIGateway {
  readonly provider: AIProvider;

  constructor(options: AIGatewayOptions) {
    this.provider = options.provider;
  }

  async generateStructured<T extends z.ZodTypeAny>(
    options: AIGatewayGenerateOptions<T>,
  ): Promise<AIResultOf<T>> {
    const { request, schema, fallbackValue } = options;
    const resultSchema = createAIResultSchema(schema);

    const requestParse = safeParseAIRequest(request);
    if (!requestParse.success) {
      const failure = resultSchema.parse({
        ok: false,
        provider: this.provider.name,
        fallbackUsed: false,
        validationErrors: formatZodErrors(requestParse.error).map(
          (message) => `request: ${message}`,
        ),
      }) as AIResultOf<T>;
      return this.applyFallback(failure, schema, fallbackValue);
    }

    const validatedRequest = requestParse.data;
    const generationSeed =
      validatedRequest.generationSeed ??
      (options.session
        ? deriveAiGenerationSeed(options.session, validatedRequest.task)
        : undefined);
    const requestWithSeed =
      generationSeed !== undefined ? { ...validatedRequest, generationSeed } : validatedRequest;

    try {
      const providerResult = await this.provider.generateStructured(requestWithSeed, schema);
      if (providerResult.ok) {
        return providerResult;
      }
      return this.applyFallback(providerResult, schema, fallbackValue);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failure = resultSchema.parse({
        ok: false,
        provider: this.provider.name,
        fallbackUsed: false,
        validationErrors: [`provider: ${message}`],
        generationSeed: requestWithSeed.generationSeed,
      }) as AIResultOf<T>;
      return this.applyFallback(failure, schema, fallbackValue);
    }
  }

  private applyFallback<T extends z.ZodTypeAny>(
    result: AIResultOf<T>,
    schema: T,
    fallbackValue: z.infer<T> | undefined,
  ): AIResultOf<T> {
    if (fallbackValue === undefined) {
      return result;
    }

    const parsedFallback = schema.safeParse(fallbackValue);
    if (!parsedFallback.success) {
      return result;
    }

    const resultSchema = createAIResultSchema(schema);
    return resultSchema.parse({
      ok: true,
      value: parsedFallback.data,
      provider: result.provider,
      fallbackUsed: true,
      validationErrors: result.validationErrors,
      raw: result.raw,
      latencyMs: result.latencyMs,
      generationSeed: result.generationSeed,
    }) as AIResultOf<T>;
  }
}

/** Create a gateway wired to the given provider (typically FakeProvider in tests). */
export function createAIGateway(provider: AIProvider): AIGateway {
  return new AIGateway({ provider });
}
