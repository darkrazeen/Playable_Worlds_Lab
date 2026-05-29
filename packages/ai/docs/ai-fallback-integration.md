# AI fallback integration (W4-S6)

AI failures must never block deterministic play. Agents and the gateway wrapper record outcomes on `WorldSession.debugEvents` only — ledger and beat state stay under engine control.

## Flow

```text
AIGateway.generateStructured → AIResult
  → recordAiGatewayOutcome (core) OR generateStructuredWithDebug (ai)
  → append ai_suggestion | fallback_used | validation_failed
```

## Debug event types

| `AIResult` shape                  | Debug event         |
| --------------------------------- | ------------------- |
| `ok: true`, `fallbackUsed: false` | `ai_suggestion`     |
| `ok: true`, `fallbackUsed: true`  | `fallback_used`     |
| `ok: false`                       | `validation_failed` |

## APIs

- **Core:** `recordAiGatewayOutcome(session, result, { agent, task, summary?, metadata? })`
- **AI package:** `generateStructuredWithDebug(gateway, { session, debug, ...gatewayOptions })`
- **Agents:** `DirectorAgent` and `NPCReactionAgent` return `{ result, session }` with debug appended; they do not mutate ledger or beats.

## Playability rule

Runtime (`applyPlayerChoice`, consequence engine) does not call AI. A failed director or NPC call leaves the session playable; the next player choice applies normally. See `packages/ai/tests/integration/aiFallbackPlayability.test.ts`.
