# @playable-worlds/ai

AI provider contracts and test doubles. **AI proposes; validators check; the engine executes.**

## Owns

- `src/contracts/` — `AIProvider`, `AIRequest`, `AIResult` usage
- `src/providers/` — `FakeProvider` (tests), `OpenAIProvider` (optional live calls, W4-S3)
- `src/gateway/` — `AIGateway` (W4-S1); sole entry for structured provider calls
- `src/agents/` — `DirectorAgent` (W4-S4), `NPCReactionAgent` (W4-S5)

## Depends on

- `@playable-worlds/core` — schemas and `createAIResultSchema`

## Tests

```bash
npm test -w @playable-worlds/ai
```

- `tests/unit/providers/fakeProvider.test.ts`
- `tests/unit/providers/openaiProvider.test.ts`
- `tests/unit/agents/directorAgent.test.ts`
- `tests/unit/agents/npcReactionAgent.test.ts`
- `tests/unit/gateway/aiGateway.test.ts`

See `docs/ai-gateway.md`, `docs/fake-provider.md`, `docs/openai-provider.md`, `docs/ai-provider-toggle.md`, `docs/director-agent.md`, and `docs/npc-reaction-agent.md`.

## Phase 2

`DirectorAgent` (W4-S4) and `NPCReactionAgent` (W4-S5) call `AIGateway` only. `OpenAIProvider` (W4-S3) is optional — use `FakeProvider` in CI via `OPENAI_ENABLED=false`.
