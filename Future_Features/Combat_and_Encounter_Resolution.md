# Combat & Encounter Resolution

> **Living document** for a deterministic, text-first combat and skill system inspired by RuneScape's *train-by-doing* progression — delivered in two stages. **Tier A (approved direction): bounded** — skills as discrete usage-advanced tiers, gear as tiers + unlockable specials, encounters resolved into discrete outcome bands. **Tier B (deferred): continuous** — XP curves and stateful leveling gear, which would require an explicit README boundary amendment. This doc specifies Tier A in full and maps the clean upgrade path to Tier B.
>
> **Status:** Brainstorm / proposed direction — **Tier A approved as design direction; not in step tracker yet** (Future_Features only).
> **Last updated:** 2026-05-28
> **Related:** [Stonepass_Spire_Aincrad_Castle.md](./Stonepass_Spire_Aincrad_Castle.md), [Player_Progression_and_Mastery.md](./Player_Progression_and_Mastery.md), [Item_and_Gear_Template_Library.md](./Item_and_Gear_Template_Library.md), [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [Story_Seed_Determinism_and_Variation_Explorer.md](./Story_Seed_Determinism_and_Variation_Explorer.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- AI **never** grants skill advancement, gear, or combat outcomes directly. All advancement happens via validated, **clamped** `Consequence` objects applied by the engine.
- **Tier A stays inside the README MVP boundary:** no continuous XP curves, no stat-sim numbers, no per-instance stateful inventory, no economy. **Discrete tiers + flags + unlocks only.**
- **Tier B is a deliberate boundary change.** It must not be implemented until a human explicitly amends the README "What This Project Is Not" section. Until then it is documentation only.
- Combat resolution is **deterministic**: no RNG-as-truth. Any seeded variation must be explainable (see variation explorer).
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| Level 0: choice-gated encounters | Brainstorm / proposed | Phase 3 (no new code) | 2026-05-28 |
| Tier A skills (bounded, usage-advanced) | Brainstorm / proposed | Phase 3 (session) / Phase 6 (persistent) | 2026-05-28 |
| Tier A gear (tiers + unlockable specials) | Brainstorm / proposed | Phase 5 (with items library) | 2026-05-28 |
| Level 1: bounded `EncounterResolver` | Brainstorm / proposed | Phase 5 (after a floor is fun) | 2026-05-28 |
| Director `adjust_difficulty` integration | Brainstorm / proposed | Phase 2+ | 2026-05-28 |
| Tier B (continuous XP + leveling gear) | **Deferred** (needs README amendment) | Post-decision | 2026-05-28 |

---

## One-line summary

Combat is a **deterministic, choice-driven encounter** gated by the player's **skill tiers** and **gear tiers**; skills rise through **usage counts** (defeat N of a creature class → tier up) and higher tiers **unlock new combat choices**; encounters resolve into **discrete outcome bands** (`clean | victory | costly | repelled | defeat`) that map to pre-authored, clamped `Consequence` objects — giving RuneScape's *train-by-doing* and build-identity feel without continuous XP, stat math, or a stateful inventory.

---

## Vision & goal

### The fantasy (RuneScape-inspired)

You get better at what you do. Swing a sword often and your swordsmanship rises; the more you fight, the more techniques open up. Your weapon grows familiar in your hands and unlocks special moves. Builds diverge naturally — a parry-focused duelist plays differently from a reckless brawler — not because you spent points, but because of **what you actually did**.

### The honest boundary

RuneScape's defining mechanics (continuous 1–99 XP curves, stat numbers, stateful leveling gear) are exactly what the project's README defers:

> *"Not a full RPG stat, inventory, economy, or combat simulator."* — Progression = *"milestone flags + bounded tiers + unlocks only."*

So this feature is delivered in two tiers:

- **Tier A (approved):** bounded tiers + usage counts + unlockable specials + discrete outcome bands. Stays inside the rule. ~75–80% of the RuneScape *feel*.
- **Tier B (deferred):** continuous XP, overall level = sum of skills, stateful leveling gear with stats. A real boundary change — requires an explicit README amendment and is documentation-only until then.

**Tier A is designed as a clean stepping stone to Tier B**, so starting bounded costs nothing if you later choose to promote it.

### Goal

A combat/skill loop that is **fun in text first**, deterministic, inspectable, and generation-ready — the engine that powers floor encounters and boss raids in [Stonepass Spire](./Stonepass_Spire_Aincrad_Castle.md).

---

## Why this fits the project and plays to its strengths

- **Determinism survives.** Usage-based advancement is deterministic math; XP/levels are engine-owned ledger truth; AI never grants them. The core mantra is untouched.
- **Extends an existing seam.** Skills extend the proposed `ProgressionLedger`; gear extends the items library; difficulty extends `DirectorDecision`. No orphan system.
- **Build identity without a point-buy screen.** Unlocks are earned by play, then surfaced as **new choices** in combat beats — more inspectable than a stat sheet.
- **Generation-ready.** Creature/encounter templates carry `intensityTier`; the Architect assembles floors within difficulty bands.
- **Replayable + explainable.** Outcomes are discrete bands mapped to authored consequences; the variation explorer can explain why two fights differed.

---

## The two levels of combat (start at Level 0)

### Level 0 — Choice-gated encounters (no new code; works after instances ship)

An encounter is a **beat (or instance room) with tactical choices**, resolved by `Consequence`, gated by skill/gear tiers and flags:

```text
beat_skeleton_knight   (labyrinth room)
  choice_attack_high     requiredGearTier:{ weapon: ">=1" }            → consequence_win_clean
  choice_parry_counter   requiredUnlock:[unlock_parry]                 → consequence_win_scratched
  choice_attack_reckless                                              → consequence_wounded (addFlags:[injured])
  choice_flee                                                          → consequence_retreat (no clear)
```

No numbers. Outcomes are discrete flags. This already feels like committing to a Sword-Skill combo (risk/reward). **It uses only contracts that exist after the instance runtime lands — zero new combat code.** This is where combat starts.

### Level 1 — Bounded `EncounterResolver` (new; only after a floor is fun)

A small **deterministic** module that maps discrete inputs to a discrete outcome band — no continuous HP, no RNG-as-truth:

```text
resolveEncounter({
  encounterIntensity: 1..N,                  // from creature/encounter template
  skillTiers:  { sword: 2, guard: 1 },       // from ProgressionLedger
  gearTiers:   { weapon: 2, armor: 1 },       // from ledger flags/tiers
  tactic:      "attack_high" | "guard" | "skill_x",
  difficultyTier: <clamped by Director within DifficultyProfile>,
}) -> outcome: "clean" | "victory" | "costly" | "repelled" | "defeat"
```

The outcome maps to a **pre-authored `Consequence`** (the engine still executes only validated truth). The resolver is a pure function over discrete tiers — **still flags + bounded tiers, not a stat sim.** Build it only once a Level-0 floor is genuinely enjoyable; don't tune resolution math before the loop is proven fun.

---

## Tier A skill model (bounded, usage-advanced)

### Primitives (all ledger-backed, all bounded)

```text
SKILL TIERS     bounded scalar tracks advanced by USAGE COUNTS
                  swordsmanship 0..10, defence 0..10, evasion 0..10, lore 0..10, ...
OVERALL LEVEL   derived = sum (or weighted sum) of skill tiers (display only)
UNLOCKS         capabilities gated by tier:  unlock_parry @ defence>=3
MILESTONES      discrete earned facts:  mastery_dual_strike, slayer_of_ice_warden
```

### Usage-based advancement (the RuneScape "train by doing")

Advancement is driven by **counts of validated actions**, not free XP:

```text
WorldLedger tracks usage counters (engine-owned):
  usage.skeletons_defeated, usage.parries_landed, usage.puzzles_solved, ...

A clamped Consequence increments counters and may tier up:
  consequence_defeat_skeleton:
    progressionChanges: [ { usage: "skeletons_defeated", +1 },
                          { skillTierCheck: "swordsmanship" } ]

Tier-up rule (deterministic, authored thresholds):
  swordsmanship tier N reached at usage thresholds [5, 15, 35, 70, ...] (clamped to max)
  on tier-up: emit DebugEvent progression_advanced; maybe grant an unlock
```

### Gates read skills

```text
beat_boss_gate_floorNN   requiredTier:{ swordsmanship: ">=2" }   // under-geared climbers turned back
choice_freeclimb_shaft   requiredTier:{ evasion: ">=3" }
beat_council_cipher      requiredUnlock:[unlock_runic_lore]
```

### Build identity

Different play produces different unlocked choices: a defence-trainer unlocks `parry_counter`; an evasion-trainer unlocks `flank`; a lore-trainer unlocks `exploit_weakness`. The world graph is identical; the **available choices** differ — explainable, deterministic build divergence.

---

## Tier A gear model (tiers + unlockable specials)

Gear stays **stateless** in Tier A (possession + tier flags), per the items library. "Weapon gets stronger with use" is delivered via **usage-unlocked specials and tier-ups granted by clamped consequences**, not per-instance XP.

```text
Possession:   has_item_<id>           (iron_sword, dragon_fang)
Graded tier:  gear_tier_weapon = 0..N (upgrade via boss drops / smith beats, clamped)
Specials:     unlock_weapon_special_<id>   (cleave, pierce) gated by gear tier + usage milestone

Gates:
  beat_enter_boss   requiredGearTier:{ weapon: ">=2" }
  choice_cleave     requiredUnlock:[unlock_weapon_special_cleave]

Boss drops (clamped to floor allowed-reward list):
  consequence_clear_boss_NN:
    grantItems: [floor_NN_drop]          // clamped; AI cannot grant off-list
    gearTierDelta: { weapon: +1 }         // clamped to gearBand cap
```

> **Note — the Tier B difference:** the "a specific weapon levels up through usage and gains its own stats + special skills" vision (per-instance weapon XP) is **Tier B**, because it requires **stateful item instances** (an inventory of owned objects with their own state/history). Tier A approximates the feel with shared gear tiers + usage-unlocked specials. The upgrade path is in the migration section.

---

## Encounter & creature model

Encounters and creatures are **library entry types** (Phase 5 content libraries) carrying difficulty metadata:

```text
CreatureTemplate
  id, name, role: "minion" | "elite" | "floor_boss"
  intensityTier: 1..N
  themeTags: [ice, undead, machine, ...]
  authoredFlavor: text (no AI dialogue in this scope)

EncounterTemplate
  id, creatureRefs[], intensityTier
  tacticChoices[]  (which Level-0 choices this encounter offers)
  outcomeConsequences  (band → consequenceId map)
```

Floors assemble encounters within their `difficultyBand` (see Spire doc's climb curve).

---

## Combat resolution (deterministic outcome bands)

```text
Outcome bands (discrete, ordered):
  clean     flawless: clear + bonus usage credit, no cost
  victory   standard clear
  costly    clear but a setback flag (injured, gear_strained)
  repelled  no clear; must retry or take another route
  defeat    run setback (return to floor town; never real-life/permadeath)

Each band maps to a PRE-AUTHORED Consequence. The engine applies only that
validated consequence. Level 0 picks the band by choice + gates; Level 1 derives
the band from the bounded resolver. No continuous HP, no damage numbers.
```

Defeat is bounded and humane: it returns the climber to the floor town with a setback flag, never a hard loss of progress (and never the SAO death-game stakes).

---

## How this maps to contracts

| Existing / proposed piece | Role |
| --- | --- |
| `ProgressionLedger` ([progression doc](./Player_Progression_and_Mastery.md)) | Hosts skill tiers, unlocks, milestones, usage counters |
| `Consequence` | New `progressionChanges[]` (usage +1, tier check, unlock) — **clamped** |
| `Consequence` (items) | `grantItems[]` / `gearTierDelta` — clamped to floor allowed-reward list |
| `StoryBeat` / `PlayerChoice` | New `requiredTier` / `requiredUnlock` / `requiredGearTier` / `requiredItems` gates |
| `TemporaryInstance` rooms | Encounters and boss phases live here |
| `WorldLedger` | Usage counters + outcome flags = engine truth |
| `DirectorDecision` | `adjust_difficulty` action selects encounter intensity within bounds |
| `DifficultyProfile` ([difficulty doc](./Dynamic_Difficulty_Director.md)) | Immutable bounds the resolver/Director clamp to |
| `validateWorldDefinition` | Gate refs resolve; every intensity band remains completable |
| `EncounterResolver` | **New** pure deterministic function (Level 1) |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Schema sketches (illustrative — not final)

```ts
// Skill tiers + usage counters live in the ProgressionLedger
export const SkillTierSchema = z.object({
  skill: NamedIdSchema,           // swordsmanship, defence, evasion, lore
  tier: z.number().int().min(0),  // bounded by track maxTier
});

export const UsageCounterSchema = z.object({
  key: NamedIdSchema,             // skeletons_defeated, parries_landed
  count: z.number().int().min(0),
});

// Consequence extension (clamped at apply-time)
export const ProgressionChangeSchema = z.object({
  usage: NamedIdSchema.optional(),          // increment a usage counter
  skillTierCheck: NamedIdSchema.optional(), // re-evaluate a skill's tier vs thresholds
  unlock: NamedIdSchema.optional(),         // grant a capability unlock
  gearTierDelta: z.record(z.number().int()).optional(), // clamped to gearBand cap
});

// Bounded resolver (Level 1) — pure function, deterministic
export const EncounterOutcomeSchema = z.enum([
  "clean", "victory", "costly", "repelled", "defeat",
]);
```

---

## AI Director integration

The Director may propose an `adjust_difficulty` decision based on deterministic ledger signals (turns taken, retries, failed checks, current gear/skill tier) and the engine **clamps** it to the floor's `DifficultyProfile`. It affects **encounter intensity selection and hint level only** — never the outcome consequence, the drop, or the ledger. See [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md).

---

## Tier A → Tier B migration path (the stepping stone)

Tier A is deliberately a subset of Tier B along the same seams, so promotion is additive, not a rewrite:

| Seam | Tier A (now) | Tier B (if approved later) |
| --- | --- | --- |
| **Skills** | discrete tiers from usage counts | continuous XP from the same accrual hook; tier = curve(XP) |
| **Overall level** | sum of tiers (display) | sum of skill levels (1–99 curves) |
| **Advancement hook** | `progressionChanges` increments usage → tier check | same hook grants XP → level recompute |
| **Gear** | shared tiers + usage-unlocked specials | per-instance stateful weapons with own XP/stats |
| **Inventory** | stateless flags/tiers | owned item instances with state (new system) |
| **Validation** | band completability | band completability **+ level-band balance proofs** |
| **README rule** | no change | **requires explicit boundary amendment** |

**Promotion trigger:** only after Floors 1–3 are built and fun, and a human decides the continuous model is worth its cost (balancing 100 floors against a curve, stateful inventory, larger save model, harder generation-time validation).

---

## Phased rollout plan

```text
Phase 3 (W5)     Level 0 choice-gated encounters in Floor 1 labyrinth/boss (no new code).
                 Session-local skill tiers + gear-tier gates.

DECISION GATE    Is the floor fun in text?

Phase 5 (W7–W8)  Creature/encounter/gear libraries with intensityTier.
                 (Optional) Level 1 bounded EncounterResolver.
                 Director adjust_difficulty within DifficultyProfile.

Phase 6 (W9)     Persistent progression across floors (the climb's mastery record).

Post-decision    Tier B (continuous XP + stateful leveling gear) — only after an
                 explicit README boundary amendment.
```

---

## Boundaries & non-goals (hold the line)

- **Tier A only for now:** discrete tiers, usage counts, unlocks, discrete outcome bands. No continuous XP, no stat math, no per-instance inventory, no economy.
- **AI never grants combat outcomes, skills, or gear.** Clamped consequences applied by the engine only.
- **Deterministic resolution.** No RNG-as-truth; seeded variation must be explainable.
- **Humane defeat.** Setback flag + return to floor town; never permadeath, never SAO death-game stakes.
- **Don't build Level 1 before Level 0 is fun.** Prove the loop with authored choices first.
- **Tier B is a documented decision, not drift.** Implementing it without amending the README boundary is forbidden.

---

## Open questions / decisions

- **Skill list:** what is the starter set of skills for the Spire? (Recommend a small set: swordsmanship, defence, evasion, lore — expand with libraries.)
- **Usage thresholds:** authored per-skill thresholds vs a shared curve table. (Recommend a shared, tunable threshold table.)
- **Defeat cost:** what setback is fair on `defeat`? (Recommend: return to town + minor `injured` flag, no progress loss.)
- **Overall level use:** purely cosmetic, or a gate itself? (Recommend cosmetic in Tier A.)

---

## Maintainer section (when approved for implementation)

When a human approves any part of this for the step tracker:

1. Add step rows to `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` with the standard five documentation columns.
2. Add planning sections to `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md`.
3. Suggested step groupings (IDs assigned by the human):
   - **Level 0 combat:** authored choice-gated encounters in Floor 1 instances (no new schema).
   - **Tier A skills:** `ProgressionLedger` skill tiers + usage counters + `progressionChanges` consequence extension + gates.
   - **Tier A gear:** gear tiers + unlockable specials (with items library).
   - **Level 1 resolver:** `EncounterResolver` pure function + outcome-band → consequence mapping.
   - **Director difficulty:** `adjust_difficulty` `DirectorDecision` action + `DifficultyProfile` clamp.
4. **Tier B is NOT a step** until the README "What This Project Is Not" boundary is explicitly amended by a human.
5. Move this doc's status to **Implemented** and link code paths / step IDs as each lands.

Keep this doc and [Stonepass_Spire_Aincrad_Castle.md](./Stonepass_Spire_Aincrad_Castle.md) in sync, and update the index in [README.md](./README.md).
