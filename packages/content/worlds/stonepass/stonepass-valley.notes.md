# Stonepass Spire — Floor 1 design notes

> **Product naming (2026-05-29):** The playable product is **Stonepass Spire**, not "Stonepass Valley." The legacy file name `stonepass-valley.world.json` and world id `world_stonepass_valley` remain until **W5-S13** (formal Floor 1 reframe). **Stonepass** may still appear in lore as the region at the tower's foot.

## Floor 1 content (current JSON — single world file)

- **Fight path:** bridge → landslide → cave → dragon (ending / floor boss arc)
- **Peaceful paths** (trick / feed / talk / sneak): bridge → Spire antechamber (→ elder counsel if talk)
- Cave instance is unreachable on peaceful paths because `landslide_triggered` is never set

## Floors 1–3 climb plan (authoring target)

The original "Valley" vision is delivered across the **first three Spire floors** as systems land:

| Floor       | Content (from legacy Valley arc)                    | Systems                             |
| ----------- | --------------------------------------------------- | ----------------------------------- |
| **Floor 1** | Ogre bridge, five entry choices, first consequences | Text runtime, beat flow (Phase 1)   |
| **Floor 2** | Landslide aftermath, hidden cave / labyrinth        | Temporary instances (Phase 3)       |
| **Floor 3** | Floor boss (dragon), `floor_03_cleared` → stairs up | Tier A combat, boss instances (W5+) |

Until `RegionMap` and separate floor worlds exist (W8+), Floor 1–3 beats may live in one `WorldDefinition` with narrative floor labels; physical split happens at W5-S13 / W8.
