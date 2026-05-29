import type { AIProvider } from "../contracts/aiProvider.js";
import { createAIGateway, type AIGateway } from "../gateway/aiGateway.js";
import {
  resolveAIProviderMode,
  type AIProviderMode,
  type EnvSource,
  type ResolveAIProviderOptions,
} from "./envFlags.js";
import { FakeProvider, type FakeProviderOptions } from "../providers/fakeProvider.js";
import { STONEPASS_DIRECTOR_SEED_CATALOG } from "../providers/fakeProviderScenarios.js";
import {
  OpenAIProvider,
  resolveOpenAIConfig,
  type OpenAIProviderOptions,
} from "../providers/openaiProvider.js";

export {
  AI_PROVIDER_ENV,
  OPENAI_ENABLED_ENV,
  parseEnvFlag,
  resolveAIProviderMode,
  resolveOpenAIEnabled,
  type AIProviderMode,
  type EnvSource,
  type ResolveAIProviderOptions,
} from "./envFlags.js";

export type CreateAIProviderFromEnvOptions = ResolveAIProviderOptions & {
  fakeProviderOptions?: FakeProviderOptions;
  openAIProviderOptions?: OpenAIProviderOptions;
};

export type AIProviderStatus = {
  mode: AIProviderMode;
  providerName: string;
  openaiEnabled: boolean;
  openaiHasApiKey: boolean;
  openaiReady: boolean;
};

/** Default FakeProvider setup for local dev when OpenAI is off. */
export const DEFAULT_FAKE_PROVIDER_OPTIONS: FakeProviderOptions = {
  scenarioCatalog: STONEPASS_DIRECTOR_SEED_CATALOG,
};

export function getAIProviderStatus(
  options: CreateAIProviderFromEnvOptions = {},
): AIProviderStatus {
  const mode = resolveAIProviderMode(options);
  const env = options.env ?? (process.env as EnvSource);
  const openaiConfig = resolveOpenAIConfig({
    ...options.openAIProviderOptions,
    enabled: mode === "openai",
    apiKey: options.openAIProviderOptions?.apiKey ?? env.OPENAI_API_KEY,
  });

  return {
    mode,
    providerName: mode === "openai" ? "openai" : "fake",
    openaiEnabled: openaiConfig.enabled,
    openaiHasApiKey: Boolean(openaiConfig.apiKey),
    openaiReady: openaiConfig.isConfigured,
  };
}

/** Pick FakeProvider or OpenAIProvider from env. OpenAI is off unless explicitly enabled. */
export function createAIProviderFromEnv(options: CreateAIProviderFromEnvOptions = {}): AIProvider {
  const mode = resolveAIProviderMode(options);

  if (mode === "openai") {
    return new OpenAIProvider({
      ...options.openAIProviderOptions,
      enabled: true,
    });
  }

  return new FakeProvider({
    ...DEFAULT_FAKE_PROVIDER_OPTIONS,
    ...options.fakeProviderOptions,
  });
}

export function createAIGatewayFromEnv(options: CreateAIProviderFromEnvOptions = {}): AIGateway {
  return createAIGateway(createAIProviderFromEnv(options));
}
