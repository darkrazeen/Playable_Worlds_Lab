# Stonepass Spire — Aincrad-Style Floor Castle

> **Living document** for retuning the Stonepass proof world into a **vertical castle of 100 floors** (inspired by *Sword Art Online*'s Aincrad) where each floor is its own validated `WorldDefinition` (zone), floors stack into a `RegionMap`-derived tower, and ascension is gated by clearing the floor below. Single-player, text-first, fleshed out one floor at a time on top of a complete 100-floor **skeleton**.
>
> **Status:** Scheduled in step tracker — flagship rows added 2026-05-29 as `Not started`: **W5-S13** (Stonepass → Floor 1), **W8-S15** (SpireManifest), **W8-S16** (ascension edges), **W8-S17** (Floor 2 / Castle proven), **W9-S7** (climb persistence). Implement only when each step reaches `Next` with human approval; move to **Implemented** as steps land.
> **Last updated:** 2026-05-29
> **Related:** [Combat_and_Encounter_Resolution.md](./Combat_and_Encounter_Resolution.md), [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [Player_Progression_and_Mastery.md](./Player_Progression_and_Mastery.md), [Item_and_Gear_Template_Library.md](./Item_and_Gear_Template_Library.md), [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md), [2D_Map_and_Node_Graph_Play_View.md](./2D_Map_and_Node_Graph_Play_View.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- The AI Director may flavor, pace, and select variants; it may **never** set `floor_*_cleared`, grant gear/progression, or mutate the ledger.
- Text-first stays canonical. A floor must be fun as text before any 2D render. No 2D/3D work begins until phase gates pass.
- Single-player only in this scope. **No guilds, no multiplayer/co-op, no AI-authored NPC dialogue.** (Explicitly deferred — see Non-goals.)
- The skeleton (100 floor slots) is **data**, not 100 hand-authored files. Floors are fleshed out incrementally as content libraries and generation mature.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| Spire Manifest (100-floor skeleton registry) | Brainstorm / proposed | Phase 5 (with RegionMap) | 2026-05-28 |
| Floor = WorldDefinition (zone) anatomy | Brainstorm / proposed | Phase 3 (single floor) / Phase 5 (multi) | 2026-05-28 |
| Ascension gating (floor_N_cleared → edge) | Brainstorm / proposed | Phase 5 (RegionMap edges) | 2026-05-28 |
| Boss raid as multi-phase instance (single-player) | Brainstorm / proposed | Phase 3 (instances) | 2026-05-28 |
| Floor difficulty + gear band curve | Brainstorm / proposed | Phase 5 | 2026-05-28 |
| Director-paced climb (recap, hints, variants) | Brainstorm / proposed | Phase 2+ (extends DirectorDecision) | 2026-05-28 |

---

## One-line summary

**Stonepass Spire** is a 100-floor tower where each floor is a self-contained, individually validated `WorldDefinition` (town → field → labyrinth → boss), floors are connected into a vertical `RegionMap` whose "go up" edges require the previous floor's `floor_N_cleared` flag, and the entire 100-floor structure exists as a **manifest skeleton** from day one while individual floors are authored or generated over time.

---

## Vision & goal

### The fantasy

A lone climber ascends an ancient spire rising out of Stonepass Valley. Each floor is a sealed, themed world with its own monsters, labyrinth, and floor boss. You cannot skip ahead: the stairs to the next floor stay locked until you defeat the current floor's boss. Over the climb you grow stronger (skills, gear), the floors grow stranger and deadlier, and the Spire itself seems to notice you. This is the *Aincrad* loop — **progress as literal ascent** — minus VR, minus permadeath, minus multiplayer.

### What we are building

- A **structurally complete 100-floor tower** on day one (the skeleton), with most floors as playable `stub` placeholders and a growing frontier of fully `built` floors.
- A repeatable **floor template** (arrive → prepare → explore → labyrinth → boss → ascend) expressed entirely in existing contracts.
- **Single-player boss "raids"** as multi-phase temporary instances.
- A **pre-planned difficulty + gear curve** so floors authored later slot into a coherent climb.
- Integration with the AI Director for pacing, recaps, and explainable variation.

### What we are explicitly NOT building (in this scope)

- No guilds, parties, or any multiplayer/co-op (async or real-time).
- No AI-authored NPC personalities or NPC memory arcs (authored text only).
- No VR, no real-time action combat, no permadeath.
- No full RPG economy, marketplace, or currency.
- No continuous XP curves or stateful leveling gear **yet** — combat/skills start at **Tier A (bounded)**; see [Combat_and_Encounter_Resolution.md](./Combat_and_Encounter_Resolution.md).

### The guiding constraint

The implementation path does not change: **text-first → 2D → beyond.** The castle is a *content and composition* reframe on top of the existing engine, not a rewrite. Every new capability (region edges, gear tiers, progression, combat resolution) is an additive, validated extension that obeys the core mantra.

---

## Why this fits the project and plays to its strengths

- **The engine's natural units already match Aincrad's natural units.** A floor *is* a `WorldDefinition`; a labyrinth *is* a `TemporaryInstance`; "floor cleared → stairs open" *is* a flag gating a region edge. Almost nothing is forced.
- **The castle is just a vertical `RegionMap`.** The project already designed a region composer (lava → ocean → machine). A tower is the same graph with a **linear, upward, clear-gated topology**. We reuse, not reinvent.
- **It is the cleanest possible single-player showcase.** Removing guilds/NPC-AI/multiplayer leaves exactly the deterministic, text-first, remembered-state core the engine is strongest at.
- **Stonepass content is preserved, not discarded.** The legacy ogre → landslide → cave → dragon arc becomes **Floors 1–3** of the Spire (see [Floors 1–3 plan](#floors-13-early-climb-content-plan)).
- **Incremental by construction.** The manifest lets the tower be complete in *structure* while floors are filled in over many phases as variability (libraries, generation) improves.
- **Determinism survives.** Clears, drops, and progression are engine-owned ledger truth; the Director only proposes flavor/pacing.

---

## Product naming (human-approved 2026-05-29)

| Use | Name |
| --- | --- |
| **Player-facing product / world title** | **Stonepass Spire** — Floor *N* (e.g. **Floor 1** at `/play` today) |
| **Deprecated (do not use for new copy)** | "Stonepass Valley" as a separate game or world product |
| **In-world geography (optional lore)** | *Stonepass* — the region at the foot of the tower (valley/hollow), not the name of the climb |
| **Legacy engineering ids (until W5-S13)** | `world_stonepass_valley`, `stonepass-valley.world.json`, `packages/content/worlds/stonepass/` |

Phase 1 browser play loads **Floor 1** content from the legacy file; formal multi-floor split and id rename land at **W5-S13** (Floor 1 reframe) and **W8** (`RegionMap`, `SpireManifest`).

---

## Floors 1–3: early climb content plan

The original single-world "Valley" arc is delivered across **the first three floors** as engine systems mature. This is the authoring target for the proof climb before the 100-floor manifest fills in.

| Floor | Player fantasy | Legacy Valley arc | Primary systems |
| --- | --- | --- | --- |
| **Floor 1** | Gate at the tower's foot — prove you may climb | Ogre bridge, five choices, first consequences | Text runtime, beat flow (Phase 1 — **live now**) |
| **Floor 2** | Deeper into the tower — the labyrinth opens | Landslide aftermath, hidden cave / dungeon instance | Temporary instances (Phase 3) |
| **Floor 3** | First true floor boss — stairs unlock upward | Dragon (or multi-phase boss), `floor_03_cleared` | Tier A combat, boss instances (W5-S8–S13), ascension edges (W8) |

**Until W8:** Floors 1–3 may share one `WorldDefinition` with narrative floor labels; `/play` is **Floor 1** today. **After W8:** separate floor worlds linked by vertical `RegionMap` and `SpireManifest`.

---

## The reframe: legacy Valley arc → Stonepass Spire

| Before (deprecated product framing) | After (flagship) |
| --- | --- |
| "Stonepass Valley" as the game | **Stonepass Spire** — a 100-floor climb |
| One small world (ogre bridge) | **Floor 1** at the tower's base (ogre gate) |
| Landslide → hidden cave | **Floor 2** labyrinth (`TemporaryInstance`, type `dungeon`) |
| Dragon stirs (ending) | **Floor 3** boss clear → `floor_03_cleared` → stairs to Floor 4+ |
| "The end" | "Ascend the Spire" (`goal_ascend_spire`, macro arc) |

The current canonical `stonepass-valley.world.json` is **Floor 1** content (title: **Stonepass Spire — Floor 1**). Phase 1 proof work is not wasted — it is the first floor of the flagship.

---

## Core mapping: Aincrad → contracts

| Aincrad concept | Contract | Built today? |
| --- | --- | --- |
| The castle (Aincrad / Spire) | `RegionMap` (vertical, clear-gated) | ❌ future (region composer) |
| A floor | `WorldDefinition` (zone) | ✅ |
| Floor theme/biome | `WorldDNA` | ✅ |
| Town / field / scene | `StoryBeat` + `PlayerChoice` | ✅ |
| Labyrinth / dungeon | `TemporaryInstance` (type `dungeon`) + `rooms[]` | ✅ |
| Floor boss raid (single-player) | multi-phase boss `TemporaryInstance` | ✅ (resolution logic = combat doc) |
| "Floor cleared → stairs unlock" | `Consequence.addFlags:[floor_N_cleared]` gates region edge | ✅ flags / ❌ edge |
| Gear / drops | flags + tiers ([items doc](./Item_and_Gear_Template_Library.md)) | ❌ future |
| Skills / leveling / builds | bounded tiers + unlocks ([progression doc](./Player_Progression_and_Mastery.md)) | ❌ future |
| Creatures / monsters | creature library entries | ❌ future (libraries) |
| Difficulty / pacing / hints | `DirectorDecision` + `DifficultyProfile` | ❌ future (Director Phase 2) |
| Combat resolution | EncounterResolver (Tier A) | ❌ **new — see combat doc** |

---

## The 100-floor skeleton: the Spire Manifest

The skeleton is a single **manifest** declaring all 100 floors and their intended place in the climb. The region graph is **derived** from it — no hand-wired edges.

### Floor status lifecycle

```text
locked  → declared in the curve, not yet reachable / not authored
stub    → reserved slot; playable as a soft frontier ("this floor is sealed")
built   → a real WorldDefinition exists and is fully playable
```

You ship with Floors 1–2 `built`, 3–100 `stub`/`locked`. The tower is **structurally complete on day one**; the climbable frontier grows as floors are filled in.

### Manifest model (illustrative)

```text
SpireManifest
├── id: "stonepass_spire"
├── title: "Stonepass Spire"
├── totalFloors: 100
├── startFloor: 1
└── floors[]
      { floor: 1,  theme: "stonepass_fields", status: "built",
        worldDefinitionRef: "floor_01_stonepass", bossId: "boss_dragon_stir",
        difficultyBand: 1, gearBand: 1, clearedFlag: "floor_01_cleared" }
      { floor: 2,  theme: "frozen_halls",      status: "built",
        worldDefinitionRef: "floor_02_frozen",   bossId: "boss_ice_warden",
        difficultyBand: 1, gearBand: 1, clearedFlag: "floor_02_cleared" }
      { floor: 3,  theme: "sunken_archive",    status: "stub",
        worldDefinitionRef: null, bossId: null,
        difficultyBand: 2, gearBand: 2, clearedFlag: "floor_03_cleared" }
      ... floors 4–100 (mostly stub/locked, bands pre-planned) ...
```

### Region graph derived from the manifest

```text
For each floor N (1..totalFloors-1):
  edge: floor_N  →  floor_N+1
        requiredFlags: [ floor_N.clearedFlag ]
        travelConsequenceId: consequence_ascend_to_(N+1)

startZoneId = floor_(startFloor)
```

A `stub` floor renders a placeholder beat and is a **legal soft-ending** of the current climb — not a validation error. When the floor is promoted to `built`, the edge above it simply becomes traversable once the boss is cleared.

### Schema sketch (illustrative — not final)

```ts
// packages/core/src/schemas/spireManifest.ts
export const FloorStatusSchema = z.enum(["locked", "stub", "built"]);

export const SpireFloorSchema = z.object({
  floor: z.number().int().min(1),
  theme: z.string().min(1),
  status: FloorStatusSchema,
  worldDefinitionRef: NamedIdSchema.nullable(),   // null while not built
  bossId: NamedIdSchema.nullable(),
  difficultyBand: z.number().int().min(1),         // pre-planned climb curve
  gearBand: z.number().int().min(1),
  clearedFlag: FlagIdSchema,                        // floor_NN_cleared
});

export const SpireManifestSchema = z.object({
  schemaVersion: SchemaVersionSchema,
  id: NamedIdSchema,
  title: z.string().min(1),
  totalFloors: z.number().int().min(1).max(100),
  startFloor: z.number().int().min(1),
  floors: z.array(SpireFloorSchema).min(1),
});
```

### New validator rules (`validateSpireManifest`)

- Floor numbers are contiguous `1..totalFloors`, no gaps/duplicates.
- `clearedFlag` values are unique and follow `floor_NN_cleared` convention.
- `built` floors must reference an existing, individually valid `WorldDefinition`.
- `built` floors must define a `bossId` whose clear consequence sets `clearedFlag`.
- The frontier is contiguous: you cannot have a `built` floor above a `locked` floor (a `stub` gap is allowed and acts as a soft frontier).
- Difficulty/gear bands are non-decreasing up the tower (monotonic climb curve) unless an authored exception is flagged.

---

## Anatomy of a floor

Every `built` floor follows the same loop, expressed in existing contracts.

```text
WorldDefinition  (zone: floor_NN_<theme>)
├── worldDNA            genre/tone/intensity for the floor's biome
├── startingBeatId      beat_floorNN_arrival
├── storyBeats[]
│     beat_floorNN_arrival        town hub: rest, prepare, learn the floor
│     beat_floorNN_field          explore; minor encounters; find labyrinth entrance
│     beat_floorNN_labyrinth_gate requires prep/gear; enters the dungeon instance
│     beat_floorNN_boss_gate      requires labyrinth_NN_cleared; opens boss raid
│     beat_floorNN_stairs         requires floor_NN_cleared; ASCEND (region edge)
├── consequences[]
│     consequence_clear_labyrinth_NN  addFlags:[labyrinth_NN_cleared]; grant gear (clamped)
│     consequence_clear_boss_NN       addFlags:[floor_NN_cleared]; progression +1; drop (clamped)
├── npcs[]              gatekeeper + authored monster flavor (no AI dialogue)
└── temporaryInstances[]
      instance_floorNN_labyrinth (type: dungeon)  corridors + encounters + a puzzle
      instance_floorNN_boss      (type: dungeon)  boss "phases" as rooms
```

### The floor loop (Aincrad's "explore → clear → ascend")

```text
1. Arrive in the floor town (safe hub: rest, prepare, read the floor)
2. Explore the field (minor encounters; locate the labyrinth)
3. Enter the labyrinth (TemporaryInstance: corridors, encounters, a puzzle)
4. Reach the boss gate (requires labyrinth cleared + gear/skill band)
5. Boss raid (multi-phase instance — see below)
6. Boss falls → floor_NN_cleared → stairs unlock → ascend to floor N+1
```

Town hubs are **safe zones** (no encounters), mirroring Aincrad's town rule and giving the player a deterministic place to prepare.

---

## Boss raids (single-player, multi-phase)

A floor boss is a `TemporaryInstance` whose `rooms[]` are **phases**, each a choice-gated encounter (see combat doc). Entry is gated by a gear/skill band so under-prepared climbers are turned back rather than softlocked.

```text
instance_floorNN_boss (type: dungeon)
  requiredEntryFlags: [ labyrinth_NN_cleared ]      // + gear/skill band gate on the gate beat
  rooms[]:
    phase_1_break_guard    encounter: boss (intensity band)   → tactical choices
    phase_2_enraged        encounter: boss escalates          → new choices unlock w/ skills
    phase_3_finish         completion check
  completionCondition:        "boss_NN_defeated"
  completionConsequenceId:    consequence_clear_boss_NN
  cleanupBehavior:            "seal"                 // the boss chamber seals after the climb
```

`consequence_clear_boss_NN` is the only thing that sets `floor_NN_cleared`, grants the floor drop (clamped to the floor's allowed-reward list), and advances progression. "Raid" here means a **multi-phase gated encounter**, not multiplayer. (Async co-op could later make raids multiplayer — explicitly out of scope now.)

---

## The climb curve (difficulty + gear bands)

The manifest pre-plans each floor's `difficultyBand` and `gearBand`, so floors authored or generated later slot into a coherent ascent instead of being balanced in a vacuum.

```text
Floors 1–10    band 1   tutorial → first real bosses; gear tier 1
Floors 11–25   band 2   skill identity emerges; gear tier 2; first "wall" boss
Floors 26–50   band 3   themed gauntlets; gear tier 3; elite encounters common
Floors 51–75   band 4   harsh climb; gear tier 4; multi-phase bosses standard
Floors 76–99   band 5   endgame ascent; gear tier 5
Floor 100      band 6   the summit (the Spire's "Kayaba" gate)
```

Bands are **planning metadata + validation guards**, not stat math. The combat doc defines how a band maps to encounter intensity and required gear/skill tiers.

---

## AI Director role (within bounds)

The tower gives the Director many *safe* knobs — all flavor/pacing/selection, never truth:

- **Adaptive pacing:** struggling on a floor → raise `hintPolicy`, select a lower encounter-intensity variant from the allowed band. Never changes the boss or the drop.
- **Floor recaps:** deterministic recap from the ledger on ascent ("Floor 7 cleared: parry mastered, dragon-touched gauntlets earned").
- **Spire flavor:** narrate the tower reacting to the climber — pure validated flavor text.
- **Variant selection:** same boss, different presented variant based on the player's build — explainable variation, not random.

See [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md) for the `adjust_difficulty` `DirectorDecision` action and `DifficultyProfile` bounds.

---

## How combat, skills, and gear plug in

Combat/skills/gear are specified in [Combat_and_Encounter_Resolution.md](./Combat_and_Encounter_Resolution.md) (Tier A, bounded). Summary of the seam:

- **Encounters** live in field beats and labyrinth/boss instance rooms.
- **Skills** are bounded tiers advanced by **usage counts** (e.g. defeat N skeletons → swordsmanship tier up); higher tiers **unlock new choices** in combat beats.
- **Gear** is tiers + flag-unlocked specials; floor bosses drop gear clamped to the floor's allowed-reward list.
- **Resolution** is deterministic: discrete outcome bands map to pre-authored consequences.
- **Tier A is a clean stepping stone to Tier B** (continuous XP + stateful leveling gear) if/when that boundary decision is made.

---

## How this fits existing future features

| Existing future feature | Role for the Spire |
| --- | --- |
| [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md) | The tower IS a vertical RegionMap; add linear/upward/clear-gated topology |
| [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) | Creature/encounter/gear/puzzle libraries fill floors past 2–3 |
| [Combat_and_Encounter_Resolution.md](./Combat_and_Encounter_Resolution.md) | Combat, skills (Tier A), encounter resolution |
| [Player_Progression_and_Mastery.md](./Player_Progression_and_Mastery.md) | Skill tiers, unlocks, the climb's mastery record |
| [Item_and_Gear_Template_Library.md](./Item_and_Gear_Template_Library.md) | Gear tiers, boss drops, gear-gated boss entry |
| [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md) | Director-paced climb, hints, variant selection |
| [Quest_Generation.md](./Quest_Generation.md) | Optional per-floor side objectives |
| [2D_Map_and_Node_Graph_Play_View.md](./2D_Map_and_Node_Graph_Play_View.md) | Floor selector + labyrinth map render over the same JSON |
| [Story_Seed_Determinism_and_Variation_Explorer.md](./Story_Seed_Determinism_and_Variation_Explorer.md) | Explain run-to-run differences across the climb |

---

## Phased rollout plan

Aligned to the existing roadmap; do **not** skip gates. The next *step* remains W2-S6.

```text
NOW (Phase 1)      Finish W2-S6 text play + W2-S7 path tests on the EXISTING
                   Stonepass world. (It becomes Floor 1 later.)

Phase 2 (W4)       AI Director v1 → frame as the Spire's pacing + recap director.

Phase 3 (W5)       Temporary-instance runtime (already roadmapped).
                   → Build Floor 1 labyrinth + boss as instances.
                   → Tier A combat (Level 0, choice-gated): no new combat code.
                   → Session-local progression (skill tiers) + gear tiers (gating).

DECISION GATE      Is a single floor genuinely FUN in text? If yes →

Phase 5 (W7–W8)    Content libraries → creature/gear/encounter/puzzle packs.
                   → Spire Manifest + validateSpireManifest.
                   → RegionMap (vertical) + ascension edges; build Floor 2.
                   → (Optional) Tier A combat Level 1 bounded EncounterResolver.

Phase 6 (W9)       Save/resume → "continue your climb."
                   → Persistent progression across floors (climb record).

Phase 8+           2D floor map / labyrinth render over the same data.

Long tail          Author/generate Floors 3 → 100 into the pre-planned bands.
```

**Milestone definitions:**

- **Castle proven** = 2 `built` floors + 1 working ascension gate, playable in text. (~Phase 5.)
- **Castle as a game** = many built floors + gear + builds + bosses — the long content tail, not engine work.

---

## New schemas / what's missing

| Need | New / extends | Notes |
| --- | --- | --- |
| `SpireManifest` + `validateSpireManifest` | **New** | The 100-floor skeleton + frontier rules |
| Vertical `RegionMap` topology | Extends region composer | Linear, upward, clear-gated edges |
| `EncounterResolver` (Tier A) | **New** (combat doc) | Deterministic, discrete outcome bands |
| Skill tiers + usage-count accrual | Extends `ProgressionLedger` | Bounded; stepping stone to Tier B |
| Gear tiers + unlockable specials | Extends items library | Boss drops, gear-gated entry |
| `WorldSession.currentFloor` / region ledger | Extends session | Tracks the climb; persists on save/load |
| Boss/elite tagging on creatures/encounters | Extends libraries | `role: minion \| elite \| floor_boss` + `intensityTier` |
| `schemaVersion` bump | **Reality check** | Region + skills + gear push past `0.2.0` → migrations become real |

---

## Boundaries & non-goals (hold the line)

- **Text-first stays canonical.** Floors must be fun as text before any 2D.
- **No stat-sim creep.** Tier A is **discrete tiers/flags only**. If combat ever needs continuous HP / damage numbers / RNG-as-truth, stop and re-decide (that is Tier B and requires an explicit README boundary amendment).
- **AI never owns truth.** Director flavors and paces; the engine sets `floor_*_cleared` and grants gear/progression via validated consequences.
- **Do not hand-author 100 floors.** Prove 2–3, then let libraries + generation fill the bands. Hand-authoring 100 floors is the trap that kills the project.
- **One step at a time.** This doc is the destination; the next step is still W2-S6.
- **No guilds / multiplayer / AI NPCs** in this scope (deferred deliberately, not forgotten).

---

## Open questions / decisions

- **Floor 1 identity:** does the current Stonepass world become Floor 1 directly, or a Floor 0 tutorial that feeds into a fresh Floor 1? (Recommend: reuse as Floor 1.)
- **Stub floor UX:** what does a sealed floor say/offer? (Recommend: a short authored "the way up is sealed" beat + the ledger recap of the climb so far.)
- **Save granularity:** save per-floor on clear, or continuous? (Defer to Phase 6 persistence.)
- **Summit (Floor 100):** authored set-piece vs generated capstone. (Defer; reserve the band.)

---

## Maintainer section (when approved for implementation)

When a human approves any part of this for the step tracker:

1. Add step rows to `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` with the standard five documentation columns.
2. Add planning sections to `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md`.
3. Suggested step groupings (IDs to be assigned by the human):
   - **Spire skeleton:** `SpireManifest` schema + `validateSpireManifest` + Floors 1–2 stubs.
   - **Vertical region:** extend RegionMap with upward/clear-gated edges + ascension consequence.
   - **Floor 1 build:** reframe Stonepass as Floor 1 (labyrinth + boss instances).
   - **Combat Tier A:** see [Combat_and_Encounter_Resolution.md](./Combat_and_Encounter_Resolution.md) maintainer section.
4. Move this doc's status to **Implemented** and link code paths / step IDs as each lands.

When adding or revising, keep this doc and the combat doc in sync, and update the index in [README.md](./README.md).
