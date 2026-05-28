# Future Features

Brainstorm and specification docs for features **scheduled or planned** in the step tracker. When a feature is approved for implementation, ensure step rows exist in `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` and planning sections in `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md` — see each doc's maintainer section.

**Tracker status (2026-05-28):** W7-S7–S11 (content libraries), W8-S6–S12 (WorldBlueprint + quest generation) are in the CSV as `Not started` — implement only when each step is human-approved as `Next`.

| Document | Topic |
| --- | --- |
| [Quest_Generation.md](./Quest_Generation.md) | Quest generator, regional quests, **quest blueprint vs AI flavor** |
| [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) | Player-themed worlds (lava/ocean/machine), **content libraries**, WorldBlueprint knobs, Director + Architect integration |

## Vision stack (how the docs fit together)

```text
Player_World_Generation_and_Content_Libraries.md  →  full worlds + libraries + theme knobs
Quest_Generation.md                               →  quest modules inside those worlds
Playable_Worlds_Lab_v4_1_FULL_CURSOR.md           →  phased step cards (when approved)
Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv  →  execution status per step
```

When adding a new feature, create a new `.md` file here and link it from this index.
