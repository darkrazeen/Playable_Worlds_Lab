# FakeProvider (W4-S2)

Deterministic stand-in for real AI providers in tests and local dev. No API keys required.

## Scenario kinds

| Kind      | Behavior                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------- |
| `success` | Canned `value` validated against the requested Zod schema                                       |
| `invalid` | Canned `raw` output that fails schema parse → `AIResult` with `ok: false`, `fallbackUsed: true` |
| `error`   | Throws (gateway converts to `AIResult` when using `AIGateway`)                                  |

## Configuration priority

1. `responsesByTask[task]`
2. `responsesBySeed[generationSeed]` (single scenario or `{ default, byTask }` bundle)
3. `scenarioCatalog[hash(seed) % length]` when `generationSeed` is set
4. `scenario` default
5. Error: no scenario configured

## Stonepass presets

Import from `@playable-worlds/ai`:

- `STONEPASS_DIRECTOR_LANDSLIDE`
- `STONEPASS_DIRECTOR_VALLEY`
- `STONEPASS_DIRECTOR_INVALID`
- `STONEPASS_DIRECTOR_ERROR`
- `STONEPASS_DIRECTOR_SEED_CATALOG`

## Reproducibility

Same `generationSeed` + same `task` + same options → same resolved scenario and same `AIResult` on repeat calls.
