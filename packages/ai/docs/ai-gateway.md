# AI Gateway (W4-S1)

All structured model calls go through `AIGateway` — not directly to `AIProvider`.

## Usage

```typescript
import { AIGateway, FakeProvider } from "@playable-worlds/ai";
import { DirectorDecisionSchema } from "@playable-worlds/core";

const gateway = new AIGateway({
  provider: new FakeProvider({
    /* scenarios */
  }),
});

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
    reason: "Deterministic fallback.",
    confidence: 0.5,
  },
});
```

## Outcomes

| Outcome             | `ok`    | `fallbackUsed`         | When                                                        |
| ------------------- | ------- | ---------------------- | ----------------------------------------------------------- |
| Success             | `true`  | `false`                | Provider returns schema-valid output                        |
| Validation failure  | `false` | `true` (from provider) | Provider output fails Zod parse                             |
| Provider error      | `false` | `false`                | Provider throws (OpenAI returns structured failure instead) |
| Unconfigured OpenAI | `false` | `false`                | No `OPENAI_API_KEY` — use `fallbackValue`                   |
| Gateway fallback    | `true`  | `true`                 | `fallbackValue` supplied and parses after failure           |

Agents (W4-S4+) call the gateway only. The engine never applies AI output to the ledger without validation.
