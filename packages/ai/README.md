# @playable-worlds/ai

AI provider contracts and test doubles. **AI proposes; validators check; the engine executes.**

## Owns

- `src/contracts/` — `AIProvider`, `AIRequest`, `AIResult` usage
- `src/providers/` — `FakeProvider` for deterministic tests
- `src/gateway/` — `AIGateway` (W4-S1); sole entry for structured provider calls
- `src/agents/` — Phase 2 agents (stub directory)

## Depends on

- `@playable-worlds/core` — schemas and `createAIResultSchema`

## Tests

```bash
npm test -w @playable-worlds/ai
```

- `tests/unit/providers/fakeProvider.test.ts`
- `tests/unit/gateway/aiGateway.test.ts`

See `docs/ai-gateway.md` and `docs/fake-provider.md`.

## Phase 2

`DirectorAgent` and agents call `AIGateway` only (W4-S4+). `OpenAIProvider` lands in W4-S3.
