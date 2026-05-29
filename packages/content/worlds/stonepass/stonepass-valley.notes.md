# Stonepass Spire — Floor 1 design notes

> **Product naming (2026-05-29):** The playable product is **Stonepass Spire**, not "Stonepass Valley." The legacy file name `stonepass-valley.world.json` and world id `world_stonepass_valley` remain until **W5-S13** (formal Floor 1 reframe). **Stonepass** may still appear in lore as the region at the tower's foot.

## Floor 1 content (current JSON — single world file)

- **Fight path:** bridge → landslide → cave → dragon (ending / floor boss arc)
- **Peaceful paths** (trick / feed / talk / sneak): bridge → Spire antechamber (→ elder counsel if talk)
- Cave instance is unreachable on peaceful paths because `landslide_triggered` is never set

## Floor 1 climb plan (authoring target)

**Decision (2026-05-29, tracker model):** the entire legacy "Valley" arc is **Floor 1**. The dragon is Floor 1's boss; clearing it sets `floor_01_cleared` (per `W5-S13`). Floor 2 (frozen halls) is the first **new** floor, authored at `W8-S17`.

| Floor 1 stage    | Content (from legacy Valley arc)                    | Systems                             |
| ---------------- | --------------------------------------------------- | ----------------------------------- |
| **Arrival/gate** | Ogre bridge, five entry choices, first consequences | Text runtime, beat flow (Phase 1)   |
| **Labyrinth**    | Landslide aftermath, hidden cave / labyrinth        | Temporary instances (Phase 3)       |
| **Floor boss**   | Dragon boss → `floor_01_cleared` → stairs up        | Tier A combat, boss instances (W5+) |

Until `RegionMap` and separate floor worlds exist (W8+), all Floor 1 stages live in one `WorldDefinition`; the formal Floor 1 reframe lands at `W5-S13`, the physical multi-floor split at W8.
