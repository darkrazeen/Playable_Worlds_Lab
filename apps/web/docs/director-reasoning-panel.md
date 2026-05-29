# Director reasoning panel (W4-S7)

Read-only UI on `/play` that surfaces the latest `DirectorAgent` suggestion for operator inspection.

## Behavior

- **Does not apply** beat changes or ledger updates — deterministic `applyPlayerChoice` still owns gameplay.
- Refetches when session id or turn number changes.
- Uses **FakeProvider** + Stonepass seed catalog on the client (no `OPENAI_API_KEY` on the browser). Live OpenAI would require a server route in a later step.

## Components

| File                         | Role                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `DirectorReasoningPanel.tsx` | Renders action, target, reason, confidence, fallback badge, validation errors |
| `fetchDirectorReasoning.ts`  | One-shot gateway call for tests and hook                                      |
| `useDirectorReasoning.ts`    | Client hook used by `WorldPlayScreen`                                         |

## Tests

`apps/web/tests/world-director-reasoning.smoke.test.tsx` — valid suggestion, fallback case, `/play` integration.
