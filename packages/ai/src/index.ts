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
