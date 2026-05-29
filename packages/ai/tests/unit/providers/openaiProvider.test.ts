import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { DirectorDecisionSchema } from "@playable-worlds/core";

import type { AIRequest } from "../../../src/contracts/aiRequest.js";
import { createAIGateway } from "../../../src/gateway/aiGateway.js";
import {
  DEFAULT_OPENAI_BASE_URL,
  DEFAULT_OPENAI_MODEL,
  OPENAI_API_KEY_ENV,
  OPENAI_BASE_URL_ENV,
  OPENAI_MODEL_ENV,
  OpenAIProvider,
  resolveOpenAIConfig,
} from "../../../src/providers/openaiProvider.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../../../../");

const directorRequest: AIRequest = {
  task: "director_select_next_beat",
  prompt: "Suggest the next story beat after the ogre fight.",
  generationSeed: "seed_openai_001",
};

const validDirectorDecision = {
  action: "select_next_beat" as const,
  targetId: "beat_landslide_aftermath",
  reason: "Player defeated the ogre; advance to the landslide aftermath beat.",
  confidence: 0.8,
};

const fallbackDirectorDecision = {
  action: "select_next_beat" as const,
  targetId: "beat_valley_square",
  reason: "Fallback beat when OpenAI is not configured.",
  confidence: 0.5,
};

function mockFetchResponse(payload: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => payload,
  }) as typeof fetch;
}

describe("resolveOpenAIConfig", () => {
  it("reports unconfigured when api key is absent", () => {
    const config = resolveOpenAIConfig({ apiKey: "", enabled: true });
    expect(config.isConfigured).toBe(false);
    expect(config.enabled).toBe(true);
    expect(config.model).toBe(DEFAULT_OPENAI_MODEL);
    expect(config.baseUrl).toBe(DEFAULT_OPENAI_BASE_URL);
  });

  it("reads explicit options over env", () => {
    const config = resolveOpenAIConfig({
      enabled: true,
      apiKey: "test-key",
      model: "gpt-test",
      baseUrl: "https://example.com/v1/",
    });
    expect(config.isConfigured).toBe(true);
    expect(config.apiKey).toBe("test-key");
    expect(config.model).toBe("gpt-test");
    expect(config.baseUrl).toBe("https://example.com/v1");
  });

  it("is not configured when enabled is false even with api key", () => {
    const config = resolveOpenAIConfig({ enabled: false, apiKey: "test-key" });
    expect(config.enabled).toBe(false);
    expect(config.isConfigured).toBe(false);
  });
});

describe("OpenAIProvider", () => {
  it("returns structured failure when OpenAI is disabled", async () => {
    const fetchFn = vi.fn();
    const provider = new OpenAIProvider({
      enabled: false,
      apiKey: "test-key",
      fetch: fetchFn,
    });

    const result = await provider.generateStructured(directorRequest, DirectorDecisionSchema);

    expect(result.ok).toBe(false);
    expect(result.validationErrors?.[0]).toContain("disabled");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("returns structured failure when OPENAI_API_KEY is not set (placeholder path)", async () => {
    const fetchFn = vi.fn();
    const provider = new OpenAIProvider({ enabled: true, apiKey: "", fetch: fetchFn });

    const result = await provider.generateStructured(
      { ...directorRequest, generationSeed: "seed_placeholder" },
      DirectorDecisionSchema,
    );

    expect(result.ok).toBe(false);
    expect(result.provider).toBe("openai");
    expect(result.fallbackUsed).toBe(false);
    expect(result.validationErrors?.[0]).toContain("OPENAI_API_KEY");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("returns schema-valid output when the API returns valid JSON", async () => {
    const fetchFn = mockFetchResponse({
      choices: [{ message: { content: JSON.stringify(validDirectorDecision) } }],
    });

    const provider = new OpenAIProvider({
      enabled: true,
      apiKey: "test-key",
      model: "gpt-test",
      fetch: fetchFn,
    });

    const result = await provider.generateStructured(directorRequest, DirectorDecisionSchema);

    expect(result.ok).toBe(true);
    expect(result.provider).toBe("openai");
    expect(result.value?.targetId).toBe("beat_landslide_aftermath");
    expect(fetchFn).toHaveBeenCalledOnce();

    const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${DEFAULT_OPENAI_BASE_URL}/chat/completions`);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
  });

  it("returns validation failure when model JSON does not match the schema", async () => {
    const fetchFn = mockFetchResponse({
      choices: [
        {
          message: {
            content: JSON.stringify({
              action: "select_next_beat",
              targetId: "beat_x",
              reason: "x",
              confidence: 2,
            }),
          },
        },
      ],
    });

    const provider = new OpenAIProvider({ enabled: true, apiKey: "test-key", fetch: fetchFn });
    const result = await provider.generateStructured(directorRequest, DirectorDecisionSchema);

    expect(result.ok).toBe(false);
    expect(result.validationErrors?.length).toBeGreaterThan(0);
    expect(result.raw).toBeDefined();
  });

  it("returns structured failure on HTTP errors without throwing", async () => {
    const fetchFn = mockFetchResponse({ error: { message: "Invalid API key" } }, 401);

    const provider = new OpenAIProvider({ enabled: true, apiKey: "bad-key", fetch: fetchFn });
    const result = await provider.generateStructured(directorRequest, DirectorDecisionSchema);

    expect(result.ok).toBe(false);
    expect(result.validationErrors?.[0]).toContain("HTTP 401");
  });

  it("works through AIGateway with fallback when unconfigured", async () => {
    const gateway = createAIGateway(new OpenAIProvider({ apiKey: "" }));

    const result = await gateway.generateStructured({
      request: directorRequest,
      schema: DirectorDecisionSchema,
      fallbackValue: fallbackDirectorDecision,
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.provider).toBe("openai");
    expect(result.value?.targetId).toBe("beat_valley_square");
  });
});

describe(".env.example", () => {
  it("documents OpenAI env var names without committed secrets", () => {
    const envExample = readFileSync(join(repoRoot, ".env.example"), "utf8");
    expect(envExample).toContain("OPENAI_ENABLED=");
    expect(envExample).toContain(`${OPENAI_API_KEY_ENV}=`);
    expect(envExample).toContain(`${OPENAI_MODEL_ENV}=`);
    expect(envExample).toContain(`${OPENAI_BASE_URL_ENV}=`);
    expect(envExample).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
  });
});
