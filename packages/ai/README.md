# @playable-worlds/ai

AI provider contracts and test doubles. **AI proposes; validators check; the engine executes.**

## Owns

- `src/contracts/` — `AIProvider`, `AIRequest`, `AIResult` usage
- `src/providers/` — `FakeProvider` (tests), `OpenAIProvider` (optional live calls, W4-S3)
- `src/gateway/` — `AIGateway` (W4-S1); sole entry for structured provider calls
- `src/agents/` — Phase 2 agents (stub directory)

## Depends on

- `@playable-worlds/core` — schemas and `createAIResultSchema`

## Tests

```bash
npm test -w @playable-worlds/ai
```

- `tests/unit/providers/fakeProvider.test.ts`
- `tests/unit/providers/openaiProvider.test.ts`
- `tests/unit/gateway/aiGateway.test.ts`

See `docs/ai-gateway.md`, `docs/fake-provider.md`, `docs/openai-provider.md`, and `docs/ai-provider-toggle.md`.

## Phase 2

`DirectorAgent` and agents call `AIGateway` only (W4-S4+). `OpenAIProvider` (W4-S3) is optional — use `FakeProvider` in CI.
