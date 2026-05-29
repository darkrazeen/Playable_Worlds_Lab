# Player Progression & Mastery

> **Living document** for a unified, deterministic **progression model**: player growth expressed as **tiers, unlocks, milestones, and mastery flags** in a dedicated `ProgressionLedger` — session-local or persistent across worlds/regions — granted only through validated, clamped `Consequence` objects. Explicitly **not** a full RPG stat/XP-curve/economy system.
>
> **Status:** Scheduled in step tracker — rows added 2026-05-29 as `Not started`: **W5-S8** (ProgressionLedger), **W5-S9** (clamped `progressionChanges`), **W9-S8** (persistent progression). Implement only when each step reaches `Next` with human approval.  
> **Last updated:** 2026-05-28  
> **Related:** [Item_and_Gear_Template_Library.md](./Item_and_Gear_Template_Library.md), [Faction_and_Reputation_System.md](./Faction_and_Reputation_System.md), [NPC_Memory_and_Relationship_Arcs.md](./NPC_Memory_and_Relationship_Arcs.md), [Quest_Generation.md](./Quest_Generation.md), [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- AI **never** grants progression directly; advancement happens only via validated, **clamped** `Consequence` objects applied by the engine.
- **Stays inside README MVP boundary:** no full RPG stat builder, no XP economy, no combat-sim numbers. Progression = **milestone flags + bounded tiers + unlocks** only.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| ProgressionLedger (tiers/unlocks/milestones) | Brainstorm / proposed | Phase 3 (gating) | 2026-05-28 |
| Session-local progression | Brainstorm / proposed | Phase 3 | 2026-05-28 |
| Persistent (cross-world/region) progression | Brainstorm / proposed | Phase 6+ (after persistence) | 2026-05-28 |

---

## One-line summary

A `ProgressionLedger` records **what the player has earned** — mastery milestones, capability unlocks, and bounded tiers (e.g. `tier_explorer = 2`); consequences advance it within per-world caps; beats, choices, items, and difficulty read it; it can be **session-local** or **persisted** across a region/account — meaningful character growth without an RPG economy.

---

## Why this fits the project and plays to its strengths

- **It unifies what's already scattered.** Faction standing, NPC arcs, gear tiers, quest rewards, and ledger flags each express a *slice* of progression. This gives them one coherent home and a shared vocabulary.
- **Pure flag/tier/milestone math.** Exactly the engine's wheelhouse — no stat sheets, no damage formulas, no currency. Honors the README "no full economy / no RPG builder" boundary by construction.
- **Reuses the clamp + validate spine.** Advancement is a clamped `Consequence` effect, validated like rewards (the same mechanism Quest_Generation already defines for XP/loot bounds).
- **Deterministic & inspectable.** Growth is ledger truth, replayable and explainable — feeds the variation explorer and analytics.
- **Persistence is a clean Phase 6 extension.** Cross-world/region progression rides on the existing save/load + region ledger work rather than inventing new infrastructure.

---

## How this fits the existing architecture

| Existing piece | Role in this feature |
| --- | --- |
| `WorldLedger` | Hosts a `progression` block (or a sibling `ProgressionLedger`) — engine-owned truth |
| `Consequence` | New `progressionChanges[]` (grant milestone, unlock, tier delta) — **clamped** |
| `StoryBeat` / `PlayerChoice` | New `requiredMilestone` / `requiredTier` / `requiredUnlock` gates |
| `WorldDefinition` | Optional `progressionTracks[]` defining tracks, tiers, and caps |
| `QuestBlueprint` (W8-S9) | `allowedRewardIds` + `rewardTier` cap already plan bounded advancement |
| Gear tiers ([items doc](./Item_and_Gear_Template_Library.md)) | A progression input/output (gear unlocks are progression) |
| Faction standing / NPC memory | Relationship-flavored progression that can feed milestones |
| `WorldSession` | Carries session-local progression; persists on save/load |
| RegionMap ([region doc](./Procedural_Region_and_Biome_Composer.md)) | Region ledger carries cross-zone persistent progression |
| `validateWorldDefinition` | Track/tier/unlock reference integrity + caps |
| `DebugEvent` | `progression_advanced` event for trace/UI |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Progression model

```text
Three primitives (all ledger-backed, all bounded):

  MILESTONES   discrete earned facts:  mastery_fire_walking, befriended_ogre_clan
  UNLOCKS      gated capabilities:     unlock_deep_dive, unlock_machine_override
  TIERS        bounded scalar tracks:  tier_explorer 0..N, tier_diplomat 0..N

Tracks group tiers + milestones with caps:
  progressionTracks: [
    { id: "explorer", maxTier: 3, milestones: [...] },
    { id: "diplomat", maxTier: 3, milestones: [...] },
  ]

Advancement (consequence-driven, clamped):
  complete_cave        → tier_explorer +1 (clamped to maxTier), milestone += spelunker
  side_with_elders     → tier_diplomat +1, unlock += unlock_council_seat

Gates read progression:
  beat_council_summit   requiredUnlock: [unlock_council_seat]
  choice_freeclimb      requiredTier: { explorer: ">= 2" }
```

### Two scopes

```text
SESSION-LOCAL (Phase 3+)
  progression lives in WorldSession; resets per new run
  proves the mechanic with zero persistence risk

PERSISTENT (Phase 6+)
  selected milestones/unlocks/tiers promote to a region or account profile
  carried into new zones (region) or new worlds (account), under explicit rules
  what persists is author/blueprint-controlled (no silent global power creep)
```

No XP curve, no numeric stat block — **earned facts + capped tiers + unlocks** only.

---

## Schema sketches (illustrative — not final)

```ts
// packages/core/src/schemas/progression.ts
export const ProgressionTrackSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  maxTier: z.number().int().min(0),
  milestones: z.array(z.string()).default([]),   // declared milestone IDs
});

// Ledger block (extends WorldLedger / region ledger)
export const ProgressionStateSchema = z.object({
  tiers: z.record(z.number().int()).default({}),       // { explorer: 2 }
  unlocks: z.array(z.string()).default([]),            // [unlock_deep_dive]
  milestones: z.array(z.string()).default([]),         // [mastery_fire_walking]
});

// Consequence addition (clamped by engine)
export const ProgressionChangeSchema = z.object({
  trackId: z.string().optional(),
  tierDelta: z.number().int().optional(),    // clamped to track.maxTier
  addUnlocks: z.array(z.string()).default([]),
  addMilestones: z.array(z.string()).default([]),
  persist: z.boolean().default(false),       // promote to persistent profile?
});

// Gate sketches on StoryBeat / PlayerChoice
requiredMilestone?: z.array(z.string());
requiredUnlock?: z.array(z.string());
requiredTier?: z.record(z.string());        // { explorer: ">= 2" }
```

---

## Runtime & engine integration

1. **Declare.** `WorldDefinition.progressionTracks[]` defines tracks, caps, and valid milestone/unlock IDs.
2. **Init.** `initializeWorldSession` seeds session progression from an empty state (or from a persistent profile if one is attached).
3. **Advance.** Consequence Engine applies `progressionChanges[]`: clamps `tierDelta` to `maxTier`, unions unlocks/milestones, logs `progression_advanced`.
4. **Gate.** Beat/choice accessibility evaluates `requiredMilestone` / `requiredUnlock` / `requiredTier` alongside existing flag/standing/item checks.
5. **Persist (Phase 6+).** Changes flagged `persist: true` promote to the region ledger or account profile per blueprint rules; new worlds/zones can read them.

---

## AI proposes / validators check / engine executes

| Step | Who | Constraint |
| --- | --- | --- |
| Propose advancement in generated content | WorldArchitect / quest gen | Only declared tracks/milestones/unlocks; validated; within caps |
| Validate | `validateWorldDefinition` + Consequence preconditions | Refs exist; tier ≤ maxTier; persist rules respected |
| Execute advancement | Consequence Engine | Clamps; unions; writes ledger; logs DebugEvent |
| Flavor | DirectorAgent | Narrate growth; **cannot** grant progression |

---

## Security & safety

- Advancement is engine-owned and **clamped** to declared caps — the model can't fabricate runaway power.
- Persistent promotion is **explicit** (`persist: true` + blueprint policy); no silent cross-world power creep.
- `safetyMode` unaffected; track/milestone labels pass the same content filters.
- Save/fork/region snapshots include progression so runs reproduce; forks can choose to reset or inherit.
- Playtester/health check: no beat gated on a milestone/unlock the world can never grant (soft-lock guard).

---

## Phase map / dependency order

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | W1-S5 Consequence, W1-S6 ledger (done) | Progression data shape |
| 2 | W3-S1 Consequence Engine | Clamped advancement |
| 3 | W1-S14 validateWorldDefinition (done) | Track/tier/unlock integrity |
| 4 | Items/Gear + Faction + NPC memory (proposed) | Rich progression inputs |
| 5 | W8-S9 QuestBlueprint | Bounded quest-driven advancement |
| 6 | W9-S5 save/load + region ledger | **Persistent** progression |
| 7 | Phase 9 Creator Cockpit | Track editor + progression inspector |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name | Goal |
| --- | --- | --- |
| PG-S1 | ProgressionTrack + ProgressionState schemas | Tracks, tiers, unlocks, milestones + examples |
| PG-S2 | Add progression block to WorldLedger/session | Engine-owned state + helpers + tests |
| PG-S3 | Add progressionChanges to Consequence + clamp | Bounded advancement + DebugEvent |
| PG-S4 | Add requiredMilestone/Unlock/Tier gates | Beat/choice accessibility |
| PG-S5 | Validate progression refs + soft-lock guard | validateWorldDefinition + health/playtester check |
| PG-S6 | Stonepass progression pack | Dogfood (explorer/diplomat tracks) |
| PG-S7 | Persistent profile promotion (region/account) | persist:true rules + region ledger carry |
| PG-S8 | Progression creator/debug panel | Read-only inspector + track editor |

*Place after Phase 3 consequence engine work (session-local), with persistence after Phase 6; exact week IDs assigned at approval time.*

---

## Definition of done (v1 — session-local)

- [ ] `progressionTracks` declare validated tracks, caps, milestone/unlock IDs
- [ ] Consequence Engine applies clamped `progressionChanges[]` and logs `progression_advanced`
- [ ] Beats/choices gate on milestones, unlocks, and tiers
- [ ] Soft-lock guard rejects gates on never-grantable progression
- [ ] Stonepass demonstrates at least one track (e.g. explorer) advancing a gated beat
- [ ] Progression survives save/load within a session

## Definition of done (v2 — persistent)

- [ ] `persist: true` changes promote to region/account profile under blueprint rules
- [ ] New zones/worlds can read persistent progression; forks can reset or inherit
- [ ] No silent cross-world power creep (promotion is explicit + bounded)

---

## Relationship to other features (avoiding overlap)

| Feature | Boundary |
| --- | --- |
| [Items & Gear](./Item_and_Gear_Template_Library.md) | Gear **tiers/unlocks are a progression track input**; possession stays in the item flags |
| [Faction & Reputation](./Faction_and_Reputation_System.md) | Standing is *relationship* state; a milestone may be *earned from* standing, not the same store |
| [NPC Memory](./NPC_Memory_and_Relationship_Arcs.md) | NPC-local memory ≠ player progression; arcs can grant player milestones |
| [Quest Generation](./Quest_Generation.md) | Quest reward bounds are the **grant mechanism**; progression is the **persistent record** |
| [Dynamic Difficulty](./Dynamic_Difficulty_Director.md) | May read tiers as a signal; never writes progression |

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Scope creep into full RPG/economy | Hard rule: milestones + bounded tiers + unlocks only; no XP curve/economy |
| Power creep across worlds | Explicit `persist` + blueprint caps + fork reset option |
| Soft-locks from progression gates | Health/playtester "never-grantable gate" check |
| Overlap/confusion with standing/gear | Documented boundaries (table above) + reserved flag namespaces |
| Generated content inventing tracks | Only declared tracks/IDs allowed; validator rejects unknowns |

---

## Open questions

1. Is progression a block inside `WorldLedger` or a sibling `ProgressionLedger` object?
2. Persistence scope for v2 — per **region** first, or jump to an **account** profile?
3. Do tiers ever decay/reset, or are they monotonic within a run?
4. Should gear unlocks *be* progression unlocks, or stay a separate (linked) namespace?
5. How much progression may transfer through fork/remix vs reset to baseline?

---

## References

- [Item_and_Gear_Template_Library.md](./Item_and_Gear_Template_Library.md) — gear tiers/unlocks as progression inputs
- [Quest_Generation.md](./Quest_Generation.md) — reward clamping = the bounded grant mechanism
- [Faction_and_Reputation_System.md](./Faction_and_Reputation_System.md), [NPC_Memory_and_Relationship_Arcs.md](./NPC_Memory_and_Relationship_Arcs.md) — relationship inputs to milestones
- [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md) — region ledger carries persistent progression
- README MVP scope — no full RPG stat/inventory/economy/combat simulator
- `packages/core/src/schemas/consequence.ts`, `worldLedger.ts`, `worldDefinition.ts`
