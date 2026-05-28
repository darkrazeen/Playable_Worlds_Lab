# Integration tests

Cross-package loader and runtime tests live here.

- `loadStonepassWorld.test.ts` (W2-S1) — loads canonical Stonepass via `loadWorldFromFile` / `loadWorld`.
- `initStonepassSession.test.ts` (W2-S2) — loads Stonepass and initializes a play-ready `WorldSession`.
- `selectStonepassBeat.test.ts` (W2-S3) — selects the ogre bridge beat for a fresh Stonepass session.
- `resolveStonepassChoice.test.ts` (W2-S4) — resolves `fight_ogre` on a fresh Stonepass session.
