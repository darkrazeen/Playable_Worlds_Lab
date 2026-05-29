# Design drafts — NON-PRODUCTION, illustrative only

> **These files are NOT production content and are NOT test fixtures.**

The JSON in this folder is **illustrative design sketches** that accompany brainstorm specs in
[`Future_Features/`](../../../../Future_Features/README.md). They exist so a reader can see the
_shape_ of a proposed data structure before any schema or runtime is built.

**Why these are different from `../` (the real examples):**

| `packages/content/examples/*.example.json`     | `packages/content/examples/_design_drafts/*.draft.json` |
| ---------------------------------------------- | ------------------------------------------------------- |
| Validate against an **implemented** Zod schema | Reference a **not-yet-implemented** proposed schema     |
| Covered (or coverable) by tests                | **Never** loaded by tests                               |
| Production / canonical shapes                  | Throwaway illustrations; will change                    |

**Hard rules:**

- Files use the `.draft.json` suffix (never `.example.json`) so any future example-sweep test cannot pick them up.
- Nothing in `packages/core`, `packages/ai`, or `apps/web` imports or loads this folder.
- These drafts have **no authority**: they do not override the step tracker, FULL_CURSOR, or phase gates.
- When a proposed schema is actually implemented and approved, promote a real fixture into `../` and delete or update the matching draft here.

## Index

| File                                  | Illustrates                                                                             | Spec                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `stonepass-spire-manifest.draft.json` | `SpireManifest` — the 100-floor skeleton (floors 1–2 `built`, 3–5 `stub`, rest implied) | [Stonepass_Spire_Aincrad_Castle.md](../../../../Future_Features/Stonepass_Spire_Aincrad_Castle.md)             |
| `stonepass-spire-region.draft.json`   | Vertical (tower) `RegionMap` derived from the manifest — upward, clear-gated edges      | [Procedural_Region_and_Biome_Composer.md](../../../../Future_Features/Procedural_Region_and_Biome_Composer.md) |
