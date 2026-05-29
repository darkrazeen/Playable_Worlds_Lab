# AI provider ON/OFF toggle

Keep `OPENAI_API_KEY` in `.env.local` and switch live OpenAI usage with env flags — no code changes required.

## Quick reference

| Goal                                          | `.env.local`                                      |
| --------------------------------------------- | ------------------------------------------------- |
| **Off** (default, deterministic FakeProvider) | `OPENAI_ENABLED=false` or omit the variable       |
| **On** (live Chat Completions)                | `OPENAI_ENABLED=true` and `OPENAI_API_KEY=sk-...` |
| **Force fake**                                | `AI_PROVIDER=fake`                                |
| **Force OpenAI**                              | `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...`  |

Accepted truthy values: `true`, `1`, `yes`, `on`.  
Accepted falsy values: `false`, `0`, `no`, `off`.

## Code usage

```typescript
import { createAIGatewayFromEnv, getAIProviderStatus } from "@playable-worlds/ai";

const status = getAIProviderStatus();
// { mode: 'fake' | 'openai', openaiEnabled, openaiHasApiKey, openaiReady, ... }

const gateway = createAIGatewayFromEnv();
const result = await gateway.generateStructured({ request, schema, fallbackValue });
```

- **Off:** `FakeProvider` with Stonepass seed catalog (no API spend).
- **On:** `OpenAIProvider` — still schema-validates before `ok: true`.

Restart `npm run dev` after changing `.env.local` so Next.js reloads env vars.
