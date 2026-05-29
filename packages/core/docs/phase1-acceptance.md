# Phase 1 acceptance gate

Human approval checkpoint after **W3-S7**. Automated coverage lives in:

- `packages/core/tests/integration/phase1Acceptance.test.ts`
- `packages/core/tests/integration/pathStonepassOgreChoices.test.ts`
- `packages/core/tests/integration/debugTraceRuntime.test.ts`
- `apps/web/tests/phase1-acceptance.smoke.test.tsx`
- `apps/web/tests/world-play.smoke.test.tsx`
- `apps/web/tests/world-ledger-panel.smoke.test.tsx`
- `apps/web/tests/world-debug-trace.smoke.test.tsx`

## Criteria (met by tests)

| Check | Evidence |
| --- | --- |
| Stonepass world loads and cross-file validates | `parseAndValidateWorldDefinition` in acceptance tests |
| Session starts at `beat_ogre_bridge` with `session_loaded` | init + web smoke |
| Five ogre choices list and resolve | `listAvailableChoices` / `resolvePlayerChoice` |
| Consequences apply; ledger flags/events update | ogre path + acceptance |
| Debug trace records choice/consequence/flags/goals | debug integration + UI smoke |
| Invalid choice blocked; turn and ledger unchanged | blocked-choice tests |
| WorldSession + ledger flag invariants after actions | `safeParseWorldSession` + `validateLedgerFlags` |
| Browser `/play` shows ledger + debug without direct mutation | web acceptance smoke |

## Deferred (not Phase 1 gate)

- **Beat progression** after consequence (`currentBeatId` advance) — UI/engine still on Floor 1 bridge beat.
- AI Director, temporary instances, persistence, share.

## Human sign-off

Run from repo root:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run dev -w @playable-worlds/web
```

Open `http://localhost:3000/play`, pick any ogre choice, confirm consequence text, **World remembers** ledger, and **Why it changed** debug panel.

Approve Phase 1 to unlock **W4-S1** (AI Gateway).
