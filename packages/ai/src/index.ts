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
  FakeProvider,
  FAKE_PROVIDER_NAME,
  type FakeProviderOptions,
  type FakeProviderScenario,
} from "./providers/fakeProvider.js";
