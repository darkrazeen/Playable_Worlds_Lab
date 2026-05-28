# @playable-worlds/content

World data and JSON fixtures — **no runtime logic**.

## Owns

- `worlds/stonepass/` — canonical Stonepass Valley (`stonepass-valley.world.json`)
- `examples/` — schema example fixtures and invalid validator demos
- `src/index.ts` — package marker (loader API arrives in W2-S1)

## Depends on

- Nothing (JSON only). Validation uses `@playable-worlds/core` from tests and loaders.

## Conventions

- Authored worlds omit `generationSeed`; generated worlds include it.
- World files use `schemaVersion: "0.2.0"` and v4.2 field names.
- See [examples/README.md](./examples/README.md) for fixture index.

## Tests

Stonepass integration: `packages/core/tests/unit/content/stonepassWorld.test.ts`
