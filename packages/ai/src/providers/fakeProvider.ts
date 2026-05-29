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

/** Per-seed overrides: one scenario for all tasks, or task-specific map. */
export type FakeProviderSeedBundle = {
  default?: FakeProviderScenario;
  byTask?: Record<string, FakeProviderScenario>;
};

export type FakeProviderSeedEntry = FakeProviderScenario | FakeProviderSeedBundle;

export type FakeProviderOptions = {
  scenario?: FakeProviderScenario;
  responsesByTask?: Record<string, FakeProviderScenario>;
  /** Same generationSeed always resolves to the same canned scenario (or catalog slot). */
  responsesBySeed?: Record<string, FakeProviderSeedEntry>;
  /** When request has generationSeed and no seed entry matches, pick catalog[index % length]. */
  scenarioCatalog?: FakeProviderScenario[];
};

export const FAKE_PROVIDER_NAME = "fake";

function isScenario(entry: FakeProviderSeedEntry): entry is FakeProviderScenario {
  return "kind" in entry;
}

/** Stable unsigned hash for deterministic catalog indexing. */
export function hashGenerationSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

function resolveSeedEntry(
  entry: FakeProviderSeedEntry,
  task: string,
): FakeProviderScenario | undefined {
  if (isScenario(entry)) {
    return entry;
  }
  return entry.byTask?.[task] ?? entry.default;
}

/** Resolve which canned scenario applies for a request (exported for tests). */
export function resolveFakeProviderScenario(
  input: AIRequest,
  options: FakeProviderOptions,
): FakeProviderScenario {
  const taskScenario = options.responsesByTask?.[input.task];
  if (taskScenario) {
    return taskScenario;
  }

  if (input.generationSeed && options.responsesBySeed) {
    const entry = options.responsesBySeed[input.generationSeed];
    if (entry) {
      const resolved = resolveSeedEntry(entry, input.task);
      if (resolved) {
        return resolved;
      }
    }
  }

  if (input.generationSeed && options.scenarioCatalog?.length) {
    const index = hashGenerationSeed(input.generationSeed) % options.scenarioCatalog.length;
    return options.scenarioCatalog[index]!;
  }

  return options.scenario ?? { kind: "error", message: "No FakeProvider scenario configured" };
}

/** Deterministic test provider — validates canned output against the requested schema. */
export class FakeProvider implements AIProvider {
  readonly name = FAKE_PROVIDER_NAME;

  constructor(private readonly options: FakeProviderOptions = {}) {}

  async generateStructured<T extends z.ZodTypeAny>(
    input: AIRequest,
    schema: T,
  ): Promise<AIResultOf<T>> {
    const scenario = resolveFakeProviderScenario(input, this.options);

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
