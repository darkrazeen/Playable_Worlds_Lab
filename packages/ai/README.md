# @playable-worlds/ai

AI provider contracts and test doubles. **AI proposes; validators check; the engine executes.**

## Owns

- `src/contracts/` — `AIProvider`, `AIRequest`, `AIResult` usage
- `src/providers/` — `FakeProvider` for deterministic tests
- `src/gateway/` — Phase 2 AI Gateway (stub directory)
- `src/agents/` — Phase 2 agents (stub directory)

## Depends on

- `@playable-worlds/core` — schemas and `createAIResultSchema`

## Tests

```bash
npm test -w @playable-worlds/ai
```

- `tests/unit/providers/fakeProvider.test.ts`

## Phase 2

`DirectorAgent`, `NPCReactionAgent`, and `OpenAIProvider` land in `gateway/` and `agents/` per FULL_CURSOR §8.
