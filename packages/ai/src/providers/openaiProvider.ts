import type { z } from "zod";

import { createAIResultSchema, type AIResultOf } from "@playable-worlds/core";

import { resolveOpenAIEnabled } from "../config/envFlags.js";
import type { AIProvider } from "../contracts/aiProvider.js";
import type { AIRequest } from "../contracts/aiRequest.js";

export const OPENAI_PROVIDER_NAME = "openai";

/** Env var names — document in `.env.example`; never commit values. */
export const OPENAI_API_KEY_ENV = "OPENAI_API_KEY";
export const OPENAI_MODEL_ENV = "OPENAI_MODEL";
export const OPENAI_BASE_URL_ENV = "OPENAI_BASE_URL";

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

const MISSING_KEY_MESSAGE =
  "OPENAI_API_KEY is not set. Configure it in the environment or pass apiKey to OpenAIProvider.";

export const OPENAI_DISABLED_MESSAGE =
  "OpenAI is disabled. Set OPENAI_ENABLED=true in .env.local (or AI_PROVIDER=openai) to turn on live calls.";

export type OpenAIProviderOptions = {
  /**
   * When false, no API calls are made (even if OPENAI_API_KEY is set).
   * Defaults from `OPENAI_ENABLED` / `AI_PROVIDER` env unless overridden.
   */
  enabled?: boolean;
  /** Overrides `process.env.OPENAI_API_KEY`. */
  apiKey?: string;
  /** Overrides `process.env.OPENAI_MODEL`. */
  model?: string;
  /** Overrides `process.env.OPENAI_BASE_URL` (trailing slash stripped). */
  baseUrl?: string;
  /** Injectable fetch for tests; defaults to global `fetch`. */
  fetch?: typeof fetch;
};

export type ResolvedOpenAIConfig = {
  enabled: boolean;
  apiKey: string | undefined;
  model: string;
  baseUrl: string;
  isConfigured: boolean;
};

export function resolveOpenAIConfig(options: OpenAIProviderOptions = {}): ResolvedOpenAIConfig {
  const enabled =
    options.enabled ??
    resolveOpenAIEnabled({ env: process.env as Record<string, string | undefined> });
  const apiKey = (options.apiKey ?? process.env[OPENAI_API_KEY_ENV])?.trim() || undefined;
  const model = (options.model ?? process.env[OPENAI_MODEL_ENV])?.trim() || DEFAULT_OPENAI_MODEL;
  const baseUrl = (options.baseUrl ?? process.env[OPENAI_BASE_URL_ENV] ?? DEFAULT_OPENAI_BASE_URL)
    .trim()
    .replace(/\/$/, "");

  return {
    enabled,
    apiKey,
    model,
    baseUrl,
    isConfigured: enabled && Boolean(apiKey),
  };
}

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

function buildChatMessages(input: AIRequest): { role: "system" | "user"; content: string }[] {
  const contextBlock = input.context ? `\n\nContext (JSON):\n${JSON.stringify(input.context)}` : "";
  return [
    {
      role: "system",
      content: `You are a structured game assistant. Respond with a single JSON object only. Task: ${input.task}`,
    },
    {
      role: "user",
      content: `${input.prompt}${contextBlock}`,
    },
  ];
}

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

/** OpenAI Chat Completions provider — placeholder when unconfigured; schema-validates all outputs. */
export class OpenAIProvider implements AIProvider {
  readonly name = OPENAI_PROVIDER_NAME;

  constructor(private readonly options: OpenAIProviderOptions = {}) {}

  async generateStructured<T extends z.ZodTypeAny>(
    input: AIRequest,
    schema: T,
  ): Promise<AIResultOf<T>> {
    const config = resolveOpenAIConfig(this.options);
    const resultSchema = createAIResultSchema(schema);
    const generationSeed = input.generationSeed;
    const started = Date.now();

    if (!config.enabled) {
      return resultSchema.parse({
        ok: false,
        provider: this.name,
        fallbackUsed: false,
        validationErrors: [`openai: ${OPENAI_DISABLED_MESSAGE}`],
        generationSeed,
      }) as AIResultOf<T>;
    }

    if (!config.apiKey) {
      return resultSchema.parse({
        ok: false,
        provider: this.name,
        fallbackUsed: false,
        validationErrors: [`openai: ${MISSING_KEY_MESSAGE}`],
        generationSeed,
      }) as AIResultOf<T>;
    }

    const fetchFn = this.options.fetch ?? fetch;
    const url = `${config.baseUrl}/chat/completions`;

    let response: Response;
    try {
      response = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          messages: buildChatMessages(input),
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return resultSchema.parse({
        ok: false,
        provider: this.name,
        fallbackUsed: false,
        validationErrors: [`openai: network error: ${message}`],
        latencyMs: Date.now() - started,
        generationSeed,
      }) as AIResultOf<T>;
    }

    const latencyMs = Date.now() - started;
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return resultSchema.parse({
        ok: false,
        provider: this.name,
        fallbackUsed: false,
        validationErrors: [`openai: HTTP ${response.status}: response was not JSON`],
        latencyMs,
        generationSeed,
      }) as AIResultOf<T>;
    }

    if (!response.ok) {
      const apiMessage =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as ChatCompletionResponse).error?.message === "string"
          ? (body as ChatCompletionResponse).error!.message
          : response.statusText;
      return resultSchema.parse({
        ok: false,
        raw: body,
        provider: this.name,
        fallbackUsed: false,
        validationErrors: [`openai: HTTP ${response.status}: ${apiMessage}`],
        latencyMs,
        generationSeed,
      }) as AIResultOf<T>;
    }

    const content = (body as ChatCompletionResponse).choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      return resultSchema.parse({
        ok: false,
        raw: body,
        provider: this.name,
        fallbackUsed: false,
        validationErrors: ["openai: empty model content"],
        latencyMs,
        generationSeed,
      }) as AIResultOf<T>;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      return resultSchema.parse({
        ok: false,
        raw: content,
        provider: this.name,
        fallbackUsed: false,
        validationErrors: ["openai: model content was not valid JSON"],
        latencyMs,
        generationSeed,
      }) as AIResultOf<T>;
    }

    const parsed = schema.safeParse(parsedJson);
    if (!parsed.success) {
      return resultSchema.parse({
        ok: false,
        raw: parsedJson,
        provider: this.name,
        fallbackUsed: false,
        validationErrors: formatZodErrors(parsed.error).map((message) => `openai: ${message}`),
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
