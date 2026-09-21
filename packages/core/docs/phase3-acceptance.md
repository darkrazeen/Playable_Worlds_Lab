# Phase 3 acceptance gate

Human approval checkpoint after **W5-S7** (temporary instance fantasy chain). Automated coverage lives in:

- `packages/core/tests/integration/phase3TemporaryInstanceAcceptance.test.ts`
- `packages/core/tests/integration/helpers/stonepassCaveAcceptance.ts`
- Related instance integration tests: `loadStonepassHiddenCave.test.ts`, `navigateStonepassCaveRooms.test.ts`, `stonepassCaveEncounter.test.ts`, `stonepassCavePuzzle.test.ts`, `stonepassCaveCompletion.test.ts`, `stonepassDragonAwakeningPath.test.ts`
- Content fixture: `packages/content/examples/world-session-stonepass-cave-active.example.json`

**Status (2026-09-20):** Automated criteria below are met by tests. Tracker has advanced past this gate: **W5-S8 Complete**, **W5-S9 Next**. Optional human sign-off still confirms the fight-path fantasy matches intent. **Cave/instance UI in `/play` remains deferred** (not a gate blocker).

## Criteria (met by tests)

| Check                                                                                | Evidence                             |
| ------------------------------------------------------------------------------------ | ------------------------------------ |
| Hidden cave instance contract (rooms, encounter, puzzle, completion, collapse)       | world instance contract test         |
| Entry requires `cave_exposed`; peaceful ogre paths stay blocked                      | entry gates + peaceful path loop     |
| Session validates before/after instance load, activation, and completion             | `assertValidSession` at checkpoints  |
| Invalid room move, early completion, bad encounter/puzzle rejected                   | failure path tests                   |
| Full fight path: ogre → landslide → cave → bats → runes → dragon awake → warn valley | `runFullStonepassCaveAcceptancePath` |
| Instance cleanup clears session pointers; debug records collapse                     | full cave flow assertions            |

## Deferred (not Phase 3 instance gate)

- `/play` UI for cave navigation, encounters, puzzles
- Consequence `progressionChanges` / Tier A combat runtime (**W5-S9+**; schema `ProgressionLedger` already landed as **W5-S8**)
- Deterministic path runner (`packages/core/playtest`, W11-S2)
- Floor 1 cleared flag (W5-S13)

## Human sign-off

Run from repo root:

```bash
npm test
npm run typecheck
npm run lint
```

Review `phase3TemporaryInstanceAcceptance.test.ts` and confirm the fight-path cave chain matches the intended Floor 1 fantasy.

Sign-off confirms the **temporary instance** gate. Progression work already continues at **W5-S9** (clamped `progressionChanges`) when human-approved.
