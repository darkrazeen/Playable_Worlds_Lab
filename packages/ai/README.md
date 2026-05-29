# @playable-worlds/ai

AI provider contracts and test doubles. **AI proposes; validators check; the engine executes.**

## Owns

- `src/contracts/` — `AIProvider`, `AIRequest`, `AIResult` usage
- `src/providers/` — `FakeProvider` (tests), `OpenAIProvider` (optional live calls, W4-S3)
- `src/gateway/` — `AIGateway` (W4-S1); sole entry for structured provider calls
- `src/agents/` — `DirectorAgent` (W4-S4); NPC agents later

## Depends on

- `@playable-worlds/core` — schemas and `createAIResultSchema`

## Tests

```bash
npm test -w @playable-worlds/ai
```

- `tests/unit/providers/fakeProvider.test.ts`
- `tests/unit/providers/openaiProvider.test.ts`
- `tests/unit/agents/directorAgent.test.ts`
- `tests/unit/gateway/aiGateway.test.ts`

See `docs/ai-gateway.md`, `docs/fake-provider.md`, `docs/openai-provider.md`, `docs/ai-provider-toggle.md`, and `docs/director-agent.md`.

## Phase 2

`DirectorAgent` (W4-S4) calls `AIGateway` only — never providers directly. `OpenAIProvider` (W4-S3) is optional — use `FakeProvider` in CI via `OPENAI_ENABLED=false`.
