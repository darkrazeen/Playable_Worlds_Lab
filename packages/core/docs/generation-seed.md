# Generation seed plumbing (W4-S8)

Deterministic `generationSeed` flows from session init through runtime and into AI Gateway calls.

## WorldSession

Optional `generationSeed` on `WorldSession` is the **root seed** for a play run.

Resolution order at init (`initializeWorldSession`):

1. Explicit `input.generationSeed`
2. `world.generationSeed`
3. Default `{worldId}_{sessionId}`

Recorded on `session_loaded` debug metadata.

## Runtime helpers

| Function                                | Purpose                              |
| --------------------------------------- | ------------------------------------ |
| `resolveSessionGenerationSeed`          | Pick root seed at session creation   |
| `deriveAiGenerationSeed(session, task)` | `{root}_t{turn}_{task}` for AI calls |

## AI Gateway

When `AIGateway.generateStructured` receives `session` and the request omits `generationSeed`, the gateway derives one via `deriveAiGenerationSeed` before calling the provider. The seed is echoed on `AIResult.generationSeed`.

## Tests

- `packages/core/tests/unit/runtime/generationSeed.test.ts`
- `packages/core/tests/integration/seededRunReproducibility.test.ts`
- `packages/ai/tests/unit/gateway/aiGateway.test.ts` (session seed derivation)
