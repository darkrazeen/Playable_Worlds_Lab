# @playable-worlds/core

Deterministic world engine: Zod schemas, validators, consequence/runtime loop, temporary instances, and debug helpers.

## Owns

- `src/schemas/` — data contracts (`WorldDefinition`, `WorldSession`, `Consequence`, `ProgressionLedger`, temporary instances, etc.)
- `src/validators/` — `validateWorldDefinition`, `parseAndValidateWorldDefinition`
- `src/world/` / `src/session/` / `src/story/` / `src/runtime/` — load → session → beat select → choice apply
- `src/consequence/` — consequence engine (W3-S1+)
- `src/instances/` — temporary instance entry, rooms, encounters, puzzles, completion (W5-S1–S7)
- `src/ledger/` — flag lifecycle (`applyFlagChanges`, gate helpers) — see `docs/flag-lifecycle.md`
- `src/debug/` — typed debug builders (`buildDebugEvents`), batch append (`appendDebugEvents`), validation failure logging

## Depends on

- `zod` only (no AI, HTTP, filesystem, or UI)

## Used by

- `@playable-worlds/ai` — typed `AIResult` wrappers
- `@playable-worlds/web` — thin presentation over runtime
- Content loaders and integration tests

## Status (2026-09-20)

Phase 0–2 runtime complete. Phase 3 temporary instances complete in engine. `ProgressionLedger` schema on optional `WorldSession.progression` (**W5-S8**). **Next:** clamped `progressionChanges` on Consequence (**W5-S9**). Cave play is not yet exposed in `/play`.

## Tests

```bash
npm test -w @playable-worlds/core
# or from repo root: npm test
```

- `tests/unit/schemas/` — per-schema positive/negative cases
- `tests/unit/validators/` — graph validation
- `tests/unit/content/` — Stonepass canonical world
- `tests/integration/` — ogre paths, Phase 1/3 acceptance, temporary instances

## Contract version

`CURRENT_SCHEMA_VERSION = "0.2.0"` — see FULL_CURSOR §22.
