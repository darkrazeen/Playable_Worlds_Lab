# Temporary instance entry (W5-S1)

Load and activate short-lived instances only when ledger flags allow entry.

## Gate flag

Stonepass hidden cave requires **`cave_exposed`**, set by:

- `consequence_fight_ogre` (landslide exposes the cave mouth)
- `consequence_survey_landslide` (survey confirms the exposed cave)

Peaceful ogre paths never set `cave_exposed`, so the cave cannot load.

## Entry API

```typescript
import {
  activateStonepassHiddenCave,
  activateTemporaryInstance,
  loadStonepassHiddenCave,
  loadTemporaryInstance,
} from "@playable-worlds/core";

// Read-only: validate flags + resolve instance definition
const loaded = loadStonepassHiddenCave(world, session);

// Mutates session: sets activeTemporaryInstanceId + currentTemporaryRoomId (first room)
const activated = activateStonepassHiddenCave(world, session);
```

`loadTemporaryInstance` / `activateTemporaryInstance` work for any instance id on a `WorldDefinition`.

## Room navigation (W5-S2)

Move through rooms using `connectedRoomIds` on the active instance. Room ids must exist in the instance; moves to non-adjacent rooms are rejected.

```typescript
import {
  getCurrentTemporaryInstanceRoom,
  moveToTemporaryRoom,
  resolveSessionTemporaryInstanceRoom,
} from "@playable-worlds/core";

const context = resolveSessionTemporaryInstanceRoom(world, session);
const moved = moveToTemporaryRoom(world, session, "room_fallen_rocks");
```

## Instance encounters (W5-S3)

Rooms may declare an optional `encounter` id. Encounter JSON lives under `packages/content/encounters/` and links bounded choices to existing world consequences.

```typescript
import {
  applyInstanceEncounterChoice,
  loadInstanceEncounter,
  resolveCurrentRoomEncounter,
} from "@playable-worlds/core";

const resolved = resolveCurrentRoomEncounter(world, session, {
  kind: "contentRoot",
  contentRoot: "/path/to/packages/content",
});

const applied = applyInstanceEncounterChoice(world, session, "scare_bats", {
  kind: "contentRoot",
  contentRoot: "/path/to/packages/content",
});
```

`applyInstanceEncounterChoice` validates the active instance room hook, applies the linked consequence through the consequence engine, and records instance ledger + debug events.

Stonepass: `room_fallen_rocks` hooks `encounter_cave_bats` (wave torch / push through swarm).

## Instance puzzles (W5-S4)

Rooms may declare an optional `puzzle` id. Puzzle JSON lives under `packages/content/puzzles/` and links bounded solutions to existing world consequences. At least one solution must set `completesPuzzle: true`.

```typescript
import {
  loadInstancePuzzle,
  resolveCurrentRoomPuzzle,
  submitInstancePuzzleSolution,
} from "@playable-worlds/core";

const resolved = resolveCurrentRoomPuzzle(world, session, {
  kind: "contentRoot",
  contentRoot: "/path/to/packages/content",
});

const submitted = submitInstancePuzzleSolution(world, session, "align_awakening_sequence", {
  kind: "contentRoot",
  contentRoot: "/path/to/packages/content",
});
```

`submitInstancePuzzleSolution` validates the room puzzle hook and solution id, applies the linked consequence, and records instance ledger + debug events (including `completesPuzzle` in metadata). Unknown solution ids fail without applying a consequence.

Stonepass: `room_dragon_chamber` hooks `puzzle_dragon_runes` (trace warm rune / align awakening sequence).

## Instance completion (W5-S5)

When the player satisfies `completionCondition` in the active instance, apply `completionConsequenceId`, log cleanup metadata for `cleanupBehavior`, and clear `activeTemporaryInstanceId` / `currentTemporaryRoomId` so control returns to the main world.

```typescript
import {
  completeStonepassHiddenCave,
  completeTemporaryInstance,
  validateTemporaryInstanceCompletion,
} from "@playable-worlds/core";

const validated = validateTemporaryInstanceCompletion(world, session);
const completed = completeTemporaryInstance(world, session);
```

Stonepass: `reached_dragon_chamber` completes from `room_dragon_chamber` with `consequence_cave_complete` and `cleanupBehavior: "collapse"`. Completing the cave sets `dragon_awake`, unlocks `goal_face_dragon`, and advances to `beat_dragon_stirring` (landslide beat is blocked once the dragon wakes).

## Not in scope (later steps)

- Wiring `/play` UI to enter the cave, move rooms, resolve encounters, submit puzzles, or complete instances
- W5-S7 temporary instance acceptance test gate
