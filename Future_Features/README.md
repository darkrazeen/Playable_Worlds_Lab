# Future Features

Brainstorm and specification docs for features **scheduled or planned** in the step tracker. When a feature is approved for implementation, ensure step rows exist in `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` and planning sections in `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md` — see each doc's maintainer section.

**Tracker status (2026-05-28):** W7-S7–S11 (content libraries), W8-S6–S12 (WorldBlueprint + quest generation) are in the CSV as `Not started` — implement only when each step is human-approved as `Next`.

**Tracker status (2026-05-29):** the flagship **Stonepass Spire** track and the gameplay systems it needs were added to the CSV, interleaved across Weeks 4–12 (W4-S8–S10, W5-S8–S13, W7-S12–S13, W8-S13–S20, W9-S7–S9, W12-S8). The Phase 2 difficulty/seed rows (W4-S8–S10) are now **Complete**; the rest remain `Not started`. Phase gates are unchanged; the next step is **W5-S1** (Phase 3 — cave from `cave_exposed`). **Product naming:** play **Stonepass Spire — Floor 1** at `/play`; "Stonepass Valley" is deprecated as a product name (see [Stonepass_Spire_Aincrad_Castle.md](./Stonepass_Spire_Aincrad_Castle.md#product-naming-human-approved-2026-05-29)).

**"Earliest implementable" = the prerequisite step/gate that must be `Complete` before this feature can start.** It does not mean the feature is scheduled — proposed features still need human-approved tracker rows. Current build state (2026-05-29): **Phase 0, Phase 1, and Phase 2 (W4-S1–S10) complete**; **W5-S1 is next** (human approval required). `/play` loads **Stonepass Spire — Floor 1**. Tracker has **122 rows** (includes Spire & gameplay systems scheduled 2026-05-29).

### Scheduled in step tracker (CSV rows added 2026-05-28)

| Document                                                                                               | Topic                                                                                                                    | Earliest implementable | Gating prerequisite                                                                |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------- |
| [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) | Player-themed worlds (lava/ocean/machine), **content libraries**, WorldBlueprint knobs, Director + Architect integration | Phase 5                | After W7-S6 (libraries W7-S7+); richest after Phase 3 instances + Phase 4 Director |
| [Quest_Generation.md](./Quest_Generation.md)                                                           | Quest generator, regional quests, **quest blueprint vs AI flavor**                                                       | Phase 5                | After W8-S5 graph generator (rows W8-S9–S12); needs W4-S1 Gateway                  |

### Scheduled: Stonepass Spire & gameplay systems (CSV rows added 2026-05-29)

The flagship **Stonepass Spire** (Aincrad-style 100-floor castle) and the systems it depends on are now interleaved into the tracker as `Not started` rows. Full step cards: `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md` §17 (_Spire & Gameplay Systems track_ in §13).

| Document                                                                                               | Scheduled steps                                | Target phase    |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | --------------- |
| [Stonepass_Spire_Aincrad_Castle.md](./Stonepass_Spire_Aincrad_Castle.md)                               | W5-S13, W8-S15, W8-S16, W8-S17, W9-S7          | Phase 3 / 5 / 6 |
| [Combat_and_Encounter_Resolution.md](./Combat_and_Encounter_Resolution.md)                             | W5-S9, W5-S10, W5-S12, W8-S18, W8-S19 (Tier A) | Phase 3 / 5     |
| [Player_Progression_and_Mastery.md](./Player_Progression_and_Mastery.md)                               | W5-S8, W5-S9, W9-S8                            | Phase 3 / 6     |
| [Item_and_Gear_Template_Library.md](./Item_and_Gear_Template_Library.md)                               | W5-S11, W7-S12, W7-S13, W8-S18                 | Phase 3 / 5     |
| [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md)                   | W8-S13, W8-S14, W8-S16                         | Phase 5         |
| [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md)                                     | W4-S9, W4-S10, W8-S20                          | Phase 2 / 5     |
| [Story_Seed_Determinism_and_Variation_Explorer.md](./Story_Seed_Determinism_and_Variation_Explorer.md) | W4-S8, W9-S9, W12-S8                           | Phase 2 / 6 / 9 |

**Tier B (continuous XP / stateful leveling gear) is NOT scheduled** — it requires an explicit README "What This Project Is Not" boundary amendment.

### Proposed deep-dives (design detail — flagship + gameplay systems above are now scheduled)

Each doc proposes its own suggested step IDs; none are scheduled until human-approved. "Earliest implementable" assumes the gating step is complete and prior phase gates passed.

**Flagship direction: Stonepass Spire (Aincrad-style castle)**

| Document                                                                   | Topic                                                                                                                                                                                    | Earliest implementable                              | Gating prerequisite                                                                                              |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Stonepass_Spire_Aincrad_Castle.md](./Stonepass_Spire_Aincrad_Castle.md)   | 100-floor vertical castle; floor = `WorldDefinition`; ascension gated by `floor_N_cleared`; **Spire Manifest** skeleton; single-player boss raids                                        | Phase 3 (single floor) / Phase 5 (multi-floor)      | After **W5** instance runtime; tower needs vertical **RegionMap** (Phase 5) + libraries to flesh out floors 3+   |
| [Combat_and_Encounter_Resolution.md](./Combat_and_Encounter_Resolution.md) | RuneScape-inspired combat/skills — **Tier A (bounded, approved)**: usage-advanced skill tiers, gear tiers + unlockable specials, discrete outcome bands; Tier B (continuous XP) deferred | Phase 3 (Level 0, no new code) / Phase 5 (resolver) | After **W5** instances; richer with progression + items + Director; **Tier B needs a README boundary amendment** |

**Gameplay systems & remembered state**

| Document                                                                             | Topic                                                                             | Earliest implementable                   | Gating prerequisite                                                                                |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [Faction_and_Reputation_System.md](./Faction_and_Reputation_System.md)               | Ledger-tracked group standing gating beats/choices + NPC attitude                 | Phase 3                                  | After **W3-S1** Consequence Engine; faction-aware NPC tone needs W4-S5; generated factions Phase 5 |
| [NPC_Memory_and_Relationship_Arcs.md](./NPC_Memory_and_Relationship_Arcs.md)         | Persistent per-NPC memory + evolving relationship arcs                            | Phase 3–4                                | After **W3-S1**; memory-aware flavor needs **W4-S5** NPCReactionAgent                              |
| [Item_and_Gear_Template_Library.md](./Item_and_Gear_Template_Library.md)             | Tier/flag-based items + gear (no economy) as a library type                       | Phase 3 (gating) / Phase 5 (library)     | After **W3-S1** for grant/consume; library type after **W7-S7**; reward bounds W8-S9               |
| [Player_Progression_and_Mastery.md](./Player_Progression_and_Mastery.md)             | Milestone/tier/unlock progression (no RPG economy); session-local then persistent | Phase 3 (session) / Phase 6 (persistent) | After **W3-S1** for clamped advancement; persistence after **W9-S5** + region ledger               |
| [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md) | Stitch worlds/zones into a connected region map                                   | Phase 5–6                                | After single-world generation (**W7–W8**) + theme packs **W7-S11**; save/share Phase 6             |

**AI intelligence & quality**

| Document                                                                                               | Topic                                                           | Earliest implementable               | Gating prerequisite                                                                                  |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md)                                     | Bounded Director difficulty/pacing adjustments                  | Phase 2 (basic) / Phase 5 (bounds)   | After **W4-S4** DirectorAgent; variant selection needs W5-S3/S4; `DifficultyProfile` needs **W8-S6** |
| [World_Health_Score_v2_and_AI_Critic_Loop.md](./World_Health_Score_v2_and_AI_Critic_Loop.md)           | Actionable findings + AI patch drafts + human-approved re-score | Phase 6                              | After **W6** health score (critic W6-S4); versioning W9-S3; full loop with W11 + W12                 |
| [Story_Seed_Determinism_and_Variation_Explorer.md](./Story_Seed_Determinism_and_Variation_Explorer.md) | Seeded replay + explainable run-vs-run variation                | Phase 2 (seeds) / Phase 6 (explorer) | Seed plumbing after **W4-S1** Gateway; explorer/replay after **W9-S5** save/load                     |
| [Emergent_Goal_and_Director_Quest_Weaving.md](./Emergent_Goal_and_Director_Quest_Weaving.md)           | Director weaves pre-validated quest modules to fill gaps        | Phase 7                              | After **W8-S9–S12** quest generation **and** **W11** playtester (pool must be pre-validated)         |

**Social (curated, async)**

| Document                                                                                           | Topic                                                     | Earliest implementable | Gating prerequisite                                                                          |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| [Async_Shared_Worlds_and_Asymmetric_Coop.md](./Async_Shared_Worlds_and_Asymmetric_Coop.md)         | Turn-based async co-op + ledger merge (no real-time/chat) | Phase 6                | After **W9-S5** save/load + **W9-S6** share token; branch+merge needs W10 fork               |
| [Curator_and_Community_Library_Contributions.md](./Curator_and_Community_Library_Contributions.md) | Reviewed UGC library contributions (no marketplace)       | Phase 6–7              | After **W7-S7/S8** library schemas + validateLibraryEntry; versioning Phase 6; review UI W12 |

**Output layers (same JSON, richer presentation)**

| Document                                                                             | Topic                                               | Earliest implementable | Gating prerequisite                                                                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| [2D_Map_and_Node_Graph_Play_View.md](./2D_Map_and_Node_Graph_Play_View.md)           | Navigable 2D beat/region graph over the runtime     | Phase 5                | After **W2-S6** play UI; builds on **W8-S4** read-only graph render; region mode needs region composer |
| [Illustrated_Text_and_Scene_Art_Layer.md](./Illustrated_Text_and_Scene_Art_Layer.md) | Optional generated/curated scene art keyed to beats | Phase 8+               | After **W2-S6** play UI + **W4-S1** AI Gateway; cache needs Phase 6; stable keys from W7 libraries     |
| [Voice_Narration_and_TTS_Layer.md](./Voice_Narration_and_TTS_Layer.md)               | Optional TTS narration + per-NPC voices             | Phase 8+               | After **W2-S6** play UI + **W4-S1** AI Gateway; per-NPC voices use NPC memory; cache Phase 6           |

**Tooling & platform**

| Document                                                                                     | Topic                                                     | Earliest implementable | Gating prerequisite                                                                              |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| [Authoring_Studio_and_Visual_Beat_Editor.md](./Authoring_Studio_and_Visual_Beat_Editor.md)   | Visual editor with live validation + AI-assisted drafting | Phase 9                | After **W12** Creator Cockpit; uses W1-S14 validator (done) + health v2 + W9-S3 versioning       |
| [Analytics_and_Telemetry_from_DebugEvents.md](./Analytics_and_Telemetry_from_DebugEvents.md) | Aggregate DebugEvents into creator analytics (opt-in)     | Phase 6                | DebugEvents exist (done); needs **W9** persistence to store/aggregate; dashboards W12            |
| [Accessibility_and_Localization_Layer.md](./Accessibility_and_Localization_Layer.md)         | Locale + reading-level variants + accessibility metadata  | Phase 1+ (incremental) | Accessibility metadata can start now; translation agent needs **W4-S1**; variant bundles Phase 6 |

## Vision stack (how the docs fit together)

```text
LAYER 0  Engine + validators (built now: Phase 0–1)
         loadWorld → session → beat → choice → consequence → ledger

LAYER 1  Generation & content (scheduled: W7-S7+, W8-S6+)
         Player_World_Generation + Content Libraries + Quest_Generation

FLAGSHIP  Stonepass Spire (Aincrad-style 100-floor castle) — single-player
         Castle = vertical RegionMap · Floor = WorldDefinition · Boss raid = instance
         Combat/skills = Tier A bounded (RuneScape-inspired train-by-doing)

LAYER 2  Gameplay systems on remembered state (proposed)
         Faction/Reputation · NPC Memory · Items/Gear · Progression/Mastery · Region Composer

LAYER 3  AI intelligence & quality (proposed)
         Dynamic Difficulty · Health v2 + Critic · Seed/Variation Explorer · Quest Weaving

LAYER 4  Social, curated & async (proposed)
         Async Co-op · Curator Contributions

LAYER 5  Output layers — same JSON (proposed)
         2D Map/Graph · Scene Art · Voice/TTS

LAYER 6  Tooling & platform (proposed)
         Authoring Studio · Analytics · Accessibility/Localization
```

**All proposed features obey the core mantra:** AI proposes → validators check → deterministic engine executes; text-first remains canonical; presentation/output layers never change gameplay.

## Earliest-implementable order (by gating phase)

Roughly chronological — each item can start once its gating step/phase is `Complete`:

```text
Phase 1 (now)   Accessibility/Localization (metadata only, incremental)
Phase 2 (W4)    Dynamic Difficulty (basic) · Seed plumbing (Variation Explorer foundation)
Phase 3 (W5)    Faction & Reputation · NPC Memory & Arcs · Items/Gear (gating) · Progression (session-local)
Phase 5 (W7–W8) Player World Generation · Quest Generation · Content Libraries [scheduled]
                Items/Gear (library) · Region Composer · 2D Map/Graph · Dynamic Difficulty (bounds)
Phase 6 (W9)    World Health Score v2 + Critic · Variation Explorer · Async Co-op
                Curator Contributions · Analytics/Telemetry · Progression (persistent)
Phase 7 (W11)   Emergent Quest Weaving
Phase 8+        Scene Art Layer · Voice/TTS Layer
Phase 9 (W12)   Authoring Studio / Visual Beat Editor
```

> Phases reference the roadmap in `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md` / the step tracker CSV. A feature spanning multiple phases is listed at its **earliest startable** phase; full functionality may need later steps (see each doc's phase map).

When adding a new feature, create a new `.md` file here and link it from this index.
