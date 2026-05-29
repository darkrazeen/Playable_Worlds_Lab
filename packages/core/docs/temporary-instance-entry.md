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

## Not in scope (later steps)

- Wiring `/play` UI to enter the cave or move rooms
- Encounter interactions (`W5-S3`)
- Instance completion / cleanup (`W5-S5`)
