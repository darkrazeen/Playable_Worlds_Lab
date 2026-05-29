/** @playable-worlds/ai — AI gateway and providers (Phase 0+). */
export const AI_PACKAGE = "@playable-worlds/ai";

export {
  AIRequestSchema,
  parseAIRequest,
  safeParseAIRequest,
  type AIRequest,
} from "./contracts/aiRequest.js";
export type { AIProvider } from "./contracts/aiProvider.js";
export {
  AI_PROVIDER_ENV,
  OPENAI_ENABLED_ENV,
  parseEnvFlag,
  resolveAIProviderMode,
  resolveOpenAIEnabled,
  type AIProviderMode,
  type EnvSource,
  type ResolveAIProviderOptions,
} from "./config/envFlags.js";
export {
  createAIProviderFromEnv,
  createAIGatewayFromEnv,
  getAIProviderStatus,
  DEFAULT_FAKE_PROVIDER_OPTIONS,
  type AIProviderStatus,
  type CreateAIProviderFromEnvOptions,
} from "./config/resolveAIProvider.js";
export {
  AIGateway,
  createAIGateway,
  type AIGatewayGenerateOptions,
  type AIGatewayOptions,
} from "./gateway/index.js";
export {
  FakeProvider,
  FAKE_PROVIDER_NAME,
  hashGenerationSeed,
  resolveFakeProviderScenario,
  type FakeProviderOptions,
  type FakeProviderScenario,
  type FakeProviderSeedBundle,
  type FakeProviderSeedEntry,
} from "./providers/fakeProvider.js";
export {
  STONEPASS_DIRECTOR_ERROR,
  STONEPASS_DIRECTOR_INVALID,
  STONEPASS_DIRECTOR_LANDSLIDE,
  STONEPASS_DIRECTOR_SEED_CATALOG,
  STONEPASS_DIRECTOR_VALLEY,
} from "./providers/fakeProviderScenarios.js";
export {
  DirectorAgent,
  DIRECTOR_TASK,
  buildDefaultDirectorFallback,
  buildDirectorContext,
  buildDirectorGenerationSeed,
  buildDirectorPrompt,
  createDirectorAgent,
  createDirectorAgentFromEnv,
  type DirectorAgentOptions,
  type DirectorSuggestionInput,
} from "./agents/index.js";
export {
  DEFAULT_OPENAI_BASE_URL,
  DEFAULT_OPENAI_MODEL,
  OPENAI_API_KEY_ENV,
  OPENAI_BASE_URL_ENV,
  OPENAI_MODEL_ENV,
  OPENAI_PROVIDER_NAME,
  OpenAIProvider,
  resolveOpenAIConfig,
  type OpenAIProviderOptions,
  type ResolvedOpenAIConfig,
} from "./providers/openaiProvider.js";
