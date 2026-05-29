import { describe, expect, it, vi } from "vitest";

import { DirectorDecisionSchema } from "@playable-worlds/core";

import {
  AI_PROVIDER_ENV,
  OPENAI_ENABLED_ENV,
  parseEnvFlag,
  resolveAIProviderMode,
  resolveOpenAIEnabled,
} from "../../../src/config/envFlags.js";
import {
  createAIProviderFromEnv,
  createAIGatewayFromEnv,
  getAIProviderStatus,
} from "../../../src/config/resolveAIProvider.js";
import { FAKE_PROVIDER_NAME } from "../../../src/providers/fakeProvider.js";
import { OPENAI_PROVIDER_NAME } from "../../../src/providers/openaiProvider.js";

describe("parseEnvFlag", () => {
  it("treats common truthy and falsy strings", () => {
    expect(parseEnvFlag("true")).toBe(true);
    expect(parseEnvFlag("1")).toBe(true);
    expect(parseEnvFlag("yes")).toBe(true);
    expect(parseEnvFlag("on")).toBe(true);
    expect(parseEnvFlag("false")).toBe(false);
    expect(parseEnvFlag("0")).toBe(false);
    expect(parseEnvFlag(undefined, false)).toBe(false);
  });
});

describe("resolveOpenAIEnabled", () => {
  it("defaults to off when env is empty", () => {
    expect(resolveOpenAIEnabled({ env: {} })).toBe(false);
    expect(resolveAIProviderMode({ env: {} })).toBe("fake");
  });

  it("turns on with OPENAI_ENABLED=true", () => {
    expect(resolveOpenAIEnabled({ env: { [OPENAI_ENABLED_ENV]: "true" } })).toBe(true);
  });

  it("respects AI_PROVIDER=fake even when OPENAI_ENABLED=true", () => {
    expect(
      resolveAIProviderMode({
        env: { [OPENAI_ENABLED_ENV]: "true", [AI_PROVIDER_ENV]: "fake" },
      }),
    ).toBe("fake");
  });

  it("respects AI_PROVIDER=openai without OPENAI_ENABLED", () => {
    expect(resolveAIProviderMode({ env: { [AI_PROVIDER_ENV]: "openai" } })).toBe("openai");
  });
});

describe("createAIProviderFromEnv", () => {
  it("returns FakeProvider when OpenAI is disabled", () => {
    const provider = createAIProviderFromEnv({
      env: { OPENAI_API_KEY: "sk-test", [OPENAI_ENABLED_ENV]: "false" },
    });
    expect(provider.name).toBe(FAKE_PROVIDER_NAME);
  });

  it("returns OpenAIProvider when enabled and does not call fetch without a live test", () => {
    const provider = createAIProviderFromEnv({
      env: { [OPENAI_ENABLED_ENV]: "true", OPENAI_API_KEY: "sk-test" },
      mode: "openai",
    });
    expect(provider.name).toBe(OPENAI_PROVIDER_NAME);
  });

  it("OpenAIProvider with key but disabled env does not call fetch", async () => {
    const fetchFn = vi.fn();
    const gateway = createAIGatewayFromEnv({
      env: { OPENAI_API_KEY: "sk-test", [OPENAI_ENABLED_ENV]: "false" },
      openAIProviderOptions: { fetch: fetchFn },
    });

    const result = await gateway.generateStructured({
      request: {
        task: "director_select_next_beat",
        prompt: "Next beat",
        generationSeed: "seed_toggle_off",
      },
      schema: DirectorDecisionSchema,
    });

    expect(result.provider).toBe(FAKE_PROVIDER_NAME);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("getAIProviderStatus", () => {
  it("reports ready only when enabled and key present", () => {
    const off = getAIProviderStatus({
      env: { OPENAI_API_KEY: "sk-test", [OPENAI_ENABLED_ENV]: "false" },
    });
    expect(off.mode).toBe("fake");
    expect(off.openaiHasApiKey).toBe(true);
    expect(off.openaiReady).toBe(false);

    const on = getAIProviderStatus({
      env: { OPENAI_API_KEY: "sk-test", [OPENAI_ENABLED_ENV]: "true" },
    });
    expect(on.mode).toBe("openai");
    expect(on.openaiReady).toBe(true);
  });
});
