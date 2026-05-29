# OpenAI provider (W4-S3)

`OpenAIProvider` implements `AIProvider` for optional real Chat Completions calls. When no API key is configured, it returns a **structured failure** (no network call, no thrown error) so `AIGateway` can apply `fallbackValue`.

## Environment variables

| Variable          | Required | Default                     |
| ----------------- | -------- | --------------------------- |
| `OPENAI_ENABLED`  | No       | `false` (live calls off)    |
| `AI_PROVIDER`     | No       | — (`fake` \| `openai`)      |
| `OPENAI_API_KEY`  | For live | — (ignored when disabled)   |
| `OPENAI_MODEL`    | No       | `gpt-4o-mini`               |
| `OPENAI_BASE_URL` | No       | `https://api.openai.com/v1` |

Copy `.env.example` to `.env.local`. Keep your key there; set `OPENAI_ENABLED=true` only when you want live calls. **Never commit secrets.** See [ai-provider-toggle.md](./ai-provider-toggle.md).

## Usage

```typescript
import { createAIGatewayFromEnv } from "@playable-worlds/ai";
import { DirectorDecisionSchema } from "@playable-worlds/core";

const gateway = createAIGatewayFromEnv(); // respects OPENAI_ENABLED in .env.local
// Or: new AIGateway({ provider: new OpenAIProvider({ enabled: true }) });

const result = await gateway.generateStructured({
  request: {
    task: "director_select_next_beat",
    prompt: "Suggest the next beat.",
    generationSeed: "seed_001",
  },
  schema: DirectorDecisionSchema,
  fallbackValue: {
    action: "select_next_beat",
    targetId: "beat_landslide_aftermath",
    reason: "Deterministic fallback when OpenAI is not configured.",
    confidence: 0.5,
  },
});
```

## Safety

- Model output is **always** parsed as JSON and validated with the caller’s Zod schema before `ok: true`.
- Raw model text is only stored on `raw` when validation fails — gameplay code must use `value` after `ok === true`.
- Prefer `FakeProvider` in unit tests; inject `fetch` on `OpenAIProvider` for integration-style tests.
