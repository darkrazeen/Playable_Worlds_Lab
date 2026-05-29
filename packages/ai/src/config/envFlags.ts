/** Set to `true`, `1`, `yes`, or `on` in `.env.local` to allow live OpenAI calls. Default: off. */
export const OPENAI_ENABLED_ENV = "OPENAI_ENABLED";

/** Optional override: `fake` | `openai` (takes precedence over OPENAI_ENABLED). */
export const AI_PROVIDER_ENV = "AI_PROVIDER";

export type AIProviderMode = "fake" | "openai";

export type EnvSource = Record<string, string | undefined>;

export type ResolveAIProviderOptions = {
  env?: EnvSource;
  /** Force mode (used in tests). */
  mode?: AIProviderMode;
};

const TRUTHY = new Set(["true", "1", "yes", "on"]);
const FALSY = new Set(["false", "0", "no", "off"]);

/** Parse common env boolean strings. Empty / unset → `defaultValue`. */
export function parseEnvFlag(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (TRUTHY.has(normalized)) {
    return true;
  }
  if (FALSY.has(normalized)) {
    return false;
  }
  return defaultValue;
}

export function resolveOpenAIEnabled(options: ResolveAIProviderOptions = {}): boolean {
  if (options.mode === "openai") {
    return true;
  }
  if (options.mode === "fake") {
    return false;
  }

  const env = options.env ?? process.env;
  const explicitProvider = env[AI_PROVIDER_ENV]?.trim().toLowerCase();
  if (explicitProvider === "openai") {
    return true;
  }
  if (explicitProvider === "fake") {
    return false;
  }

  return parseEnvFlag(env[OPENAI_ENABLED_ENV], false);
}

export function resolveAIProviderMode(options: ResolveAIProviderOptions = {}): AIProviderMode {
  return resolveOpenAIEnabled(options) ? "openai" : "fake";
}
