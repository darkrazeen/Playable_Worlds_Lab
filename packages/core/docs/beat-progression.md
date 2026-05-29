# Beat progression (Phase 1)

## Behavior

1. **Content gate:** `beat_ogre_bridge` has `blockedByFlags: ["bridge_open"]`. Every ogre consequence adds `bridge_open`, so the bridge beat cannot be re-entered after the first crossing.
2. **Selector:** `selectStoryBeat` returns the current beat when accessible, otherwise the next accessible beat in story order (`source: "next"`).
3. **Session persistence:** `advanceSessionBeat` runs at the end of `applyConsequenceEngine` and sets `session.currentBeatId` when the selector surfaces a new beat.

## Outcomes after ogre bridge (Stonepass Floor 1)

| Choice                                  | Next beat                                                            |
| --------------------------------------- | -------------------------------------------------------------------- |
| `fight_ogre`                            | `beat_landslide_aftermath` (requires `landslide_triggered`)          |
| `trick_ogre`, `feed_ogre`, `sneak_ogre` | `beat_valley_square` (requires `ogre_peaceful_crossing`)             |
| `talk_ogre`                             | `beat_valley_square` (peaceful path; elder beat is later in the arc) |

## Tests

- `packages/core/tests/integration/beatProgression.test.ts`
- `packages/core/tests/integration/repeatedConsequence.test.ts`
