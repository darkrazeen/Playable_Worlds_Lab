# @playable-worlds/core

Deterministic world engine: Zod schemas, cross-file validation, and debug helpers.

## Owns

- `src/schemas/` — all data contracts (`WorldDefinition`, `WorldSession`, `Consequence`, etc.)
- `src/validators/` — `validateWorldDefinition`, `parseAndValidateWorldDefinition`
- `src/debug/` — immutable session debug trace (`appendDebugEvent`)

## Depends on

- `zod` only (no AI, HTTP, filesystem, or UI)

## Used by

- `@playable-worlds/ai` — typed `AIResult` wrappers
- `@playable-worlds/web` — runtime and UI (Phase 1+)
- Content loaders and integration tests

## Tests

```bash
npm test -w @playable-worlds/core
# or from repo root: npm test
```

- `tests/unit/schemas/` — per-schema positive/negative cases
- `tests/unit/validators/` — graph validation (11+ cases)
- `tests/unit/content/` — Stonepass canonical world integration
- `tests/integration/` — reserved for W2-S7+

## Contract version

`CURRENT_SCHEMA_VERSION = "0.2.0"` — see FULL_CURSOR §22.
