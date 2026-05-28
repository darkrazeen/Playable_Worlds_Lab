# @playable-worlds/content

World data and JSON fixtures — **no runtime logic**.

## Owns

- `worlds/stonepass/` — canonical Stonepass Valley (`stonepass-valley.world.json`)
- `examples/` — schema example fixtures and invalid validator demos
- `src/paths.ts` — `contentRoot`, `worldsDir`, `examplesDir`, canonical Stonepass paths
- `src/index.ts` — re-exports path constants

## Depends on

- Nothing (JSON only). Validation uses `@playable-worlds/core` from tests and loaders.

## Conventions

- Authored worlds omit `generationSeed`; generated worlds include it.
- World files use `schemaVersion: "0.2.0"` and v4.2 field names.
- See [examples/README.md](./examples/README.md) for fixture index.

## Tests

Stonepass integration: `packages/core/tests/unit/content/stonepassWorld.test.ts`
