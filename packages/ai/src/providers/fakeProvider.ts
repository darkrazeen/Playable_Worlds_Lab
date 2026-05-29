import type { z } from "zod";

import { createAIResultSchema, type AIResultOf } from "@playable-worlds/core";

import type { AIProvider } from "../contracts/aiProvider.js";
import type { AIRequest } from "../contracts/aiRequest.js";

export type FakeProviderScenario =
  | {
      kind: "success";
      value: unknown;
      latencyMs?: number;
      generationSeed?: string;
    }
  | {
      kind: "invalid";
      raw: unknown;
      latencyMs?: number;
    }
  | {
      kind: "error";
      message: string;
    };

export type FakeProviderOptions = {
  scenario?: FakeProviderScenario;
  responsesByTask?: Record<string, FakeProviderScenario>;
};

export const FAKE_PROVIDER_NAME = "fake";

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

function resolveScenario(input: AIRequest, options: FakeProviderOptions): FakeProviderScenario {
  return (
    options.responsesByTask?.[input.task] ??
    options.scenario ?? { kind: "error", message: "No FakeProvider scenario configured" }
  );
}

/** Deterministic test provider — validates canned output against the requested schema. */
export class FakeProvider implements AIProvider {
  readonly name = FAKE_PROVIDER_NAME;

  constructor(private readonly options: FakeProviderOptions = {}) {}

  async generateStructured<T extends z.ZodTypeAny>(
    input: AIRequest,
    schema: T,
  ): Promise<AIResultOf<T>> {
    const scenario = resolveScenario(input, this.options);

    if (scenario.kind === "error") {
      throw new Error(scenario.message);
    }

    const latencyMs = scenario.latencyMs ?? 0;
    const generationSeed =
      input.generationSeed ?? (scenario.kind === "success" ? scenario.generationSeed : undefined);
    const raw = scenario.kind === "success" ? scenario.value : scenario.raw;
    const parsed = schema.safeParse(raw);
    const resultSchema = createAIResultSchema(schema);

    if (!parsed.success) {
      return resultSchema.parse({
        ok: false,
        raw,
        provider: this.name,
        fallbackUsed: true,
        validationErrors: formatZodErrors(parsed.error),
        latencyMs,
        generationSeed,
      }) as AIResultOf<T>;
    }

    return resultSchema.parse({
      ok: true,
      value: parsed.data,
      provider: this.name,
      fallbackUsed: false,
      latencyMs,
      generationSeed,
    }) as AIResultOf<T>;
  }
}
