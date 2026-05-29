# Faction & Reputation System

> **Living document** for a deterministic faction + reputation layer: named groups (clans, guilds, settlements, species) whose standing toward the player is tracked in the `WorldLedger`, gates beats/choices, and shapes NPC attitude — without any economy, combat math, or real-time systems.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [NPC_Memory_and_Relationship_Arcs.md](./NPC_Memory_and_Relationship_Arcs.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [Quest_Generation.md](./Quest_Generation.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- AI **never** directly mutates faction standing; standing changes only through validated `Consequence` objects applied by the engine.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature                          | Status                | Target phase (approx.)                                          | Last updated |
| -------------------------------- | --------------------- | --------------------------------------------------------------- | ------------ |
| Faction schema + ledger standing | Brainstorm / proposed | Phase 3–5 (after consequence engine W3, before/with generation) | 2026-05-28   |
| Reputation-gated beats & choices | Brainstorm / proposed | Phase 3–5                                                       | 2026-05-28   |
| Faction-aware NPC attitude       | Brainstorm / proposed | Phase 4+ (with NPCReactionAgent)                                | 2026-05-28   |

---

## One-line summary

A `Faction` is a named group with a player-facing **standing score/tier** stored in the `WorldLedger`; `Consequence` objects nudge standing within bounds; beats, choices, and NPC attitude read standing to gate content — all deterministic, all explainable, no economy required.

---

## Why this fits the project and plays to its strengths

- **Pure schema + flag/score math.** No combat system, inventory, or netcode needed — exactly the kind of mechanic the engine is already shaped for.
- **Reinforces "remembered world state."** Standing is the clearest expression of the core promise: the world remembers how you treated the ogre clan vs. the elders.
- **Drop-in for `Consequence`.** The existing consequence model already carries `addFlags` / `npcUpdates`; faction deltas are a natural sibling field.
- **Replayability engine.** Different standings produce different reachable beats from the **same** `WorldDefinition` — feeds the explainable-variation guardrail.
- **Generation-ready.** Library themes (lava/ocean/machine) ship with theme-appropriate factions; the Architect composes them like any other template.

---

## How this fits the existing architecture

| Existing piece                  | Role in this feature                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `WorldLedger`                   | New `factionStanding` map (factionId → score/tier) lives here as engine-owned truth        |
| `Consequence`                   | New optional `factionChanges[]` field; Consequence Engine clamps and applies               |
| `StoryBeat` / `PlayerChoice`    | New optional `requiredStanding` / `blockedByStanding` gates alongside existing flag gates  |
| `Npc`                           | Optional `factionId`; NPC attitude can derive from faction standing                        |
| `WorldDefinition`               | New top-level `factions[]` array (validated like NPCs)                                     |
| `validateWorldDefinition`       | Reference integrity: every referenced `factionId` must exist; standing thresholds in range |
| `DebugEvent`                    | New `faction_standing_changed` event type for the trace/UI                                 |
| `WorldArchitectAgent` (Phase 5) | Proposes factions + standing effects; never applies them                                   |
| `DirectorAgent` (Phase 2)       | May reference standing for flavor; cannot change it                                        |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Standing model

```text
Per faction, the ledger stores a bounded score and a derived tier:

  score: integer in [FACTION_MIN .. FACTION_MAX]   (e.g. -100 .. +100)
  tier:  hostile | wary | neutral | friendly | allied   (derived from score thresholds)

Consequences nudge score by bounded deltas:
  feed_ogre        → ogre_clan +20
  trick_ogre       → ogre_clan -15, elders +5
  side_with_elders → elders +25, ogre_clan -30

Beats/choices gate on tier or score:
  beat_ogre_feast        requiredStanding: { ogre_clan: ">= friendly" }
  choice_call_in_favor   requiredStanding: { elders: ">= allied" }
```

Standing is **monotonic only by rule**, not by default — a `Consequence` can both raise and lower different factions in one application (betrayal mechanics fall out naturally).

---

## Schema sketches (illustrative — not final)

```ts
// packages/core/src/schemas/faction.ts
export const FactionTierSchema = z.enum(["hostile", "wary", "neutral", "friendly", "allied"]);

export const FactionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  defaultTier: FactionTierSchema.default("neutral"),
  // thresholds map a score to a tier; validated as ascending
  tierThresholds: z.object({
    wary: z.number().int(),
    neutral: z.number().int(),
    friendly: z.number().int(),
    allied: z.number().int(),
  }),
  themeTags: z.array(z.string()).default([]), // for library/Architect selection
});

// Consequence addition (extends existing Consequence schema)
export const FactionChangeSchema = z.object({
  factionId: z.string().min(1),
  delta: z.number().int(), // clamped to per-world bounds by the engine
  reason: z.string().optional(),
});

// Ledger addition (extends WorldLedger)
//   factionStanding: Record<factionId, number>   // current scores
```

```ts
// Gate sketch on StoryBeat / PlayerChoice
requiredStanding?: Record<string, string>;   // { ogre_clan: ">= friendly" }
blockedByStanding?: Record<string, string>;  // { elders: ">= allied" }
```

---

## Runtime & engine integration

1. **Init.** `initializeWorldSession` seeds `factionStanding` from each faction's `defaultTier` midpoint (or explicit start scores).
2. **Apply.** Consequence Engine (W3-S1) applies `factionChanges[]`, **clamps** to `[FACTION_MIN, FACTION_MAX]`, recomputes tier, and logs `faction_standing_changed`.
3. **Gate.** `beatAccessibility` / `isPlayerChoiceAccessible` evaluate `requiredStanding` / `blockedByStanding` alongside existing flag checks.
4. **NPC attitude.** When an NPC has a `factionId`, its effective attitude derives from faction tier unless an explicit per-NPC override exists (see [NPC_Memory_and_Relationship_Arcs.md](./NPC_Memory_and_Relationship_Arcs.md)).

---

## AI proposes / validators check / engine executes

| Step                                | Who                              | Constraint                                                                    |
| ----------------------------------- | -------------------------------- | ----------------------------------------------------------------------------- |
| Propose factions + standing effects | WorldArchitect / quest generator | Output validates against `FactionSchema` + `FactionChangeSchema`              |
| Validate                            | `validateWorldDefinition`        | All `factionId` refs exist; thresholds ascending; deltas within per-world cap |
| Execute                             | Consequence Engine               | Clamps deltas; recomputes tier; writes ledger; logs DebugEvent                |
| Flavor                              | DirectorAgent                    | May read standing to color text; **cannot** write standing                    |

---

## Security & safety

- Standing is engine-owned; no AI path writes it directly.
- Per-world `maxFactionDelta` prevents a single generated consequence from swinging standing absurdly.
- `safetyMode` unaffected — faction names/descriptions pass the same content filters as NPCs.
- Share/fork snapshots include `factionStanding` so a shared run reproduces relationships.

---

## Phase map / dependency order

| Order | Prerequisite                                | Enables                             |
| ----- | ------------------------------------------- | ----------------------------------- |
| 1     | W1-S5 Consequence, W1-S6 WorldLedger (done) | Data shape for standing             |
| 2     | W3-S1 Consequence Engine                    | Deterministic standing application  |
| 3     | W1-S14 validateWorldDefinition (done)       | Reference + threshold checks        |
| 4     | Phase 4 NPCReactionAgent                    | Faction-aware NPC tone              |
| 5     | Phase 5 WorldArchitect + libraries          | Generated worlds ship factions      |
| 6     | Phase 9 Creator Cockpit                     | Faction editor + standing inspector |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name                                                | Goal                                        |
| ------------------- | --------------------------------------------------- | ------------------------------------------- |
| FR-S1               | Create Faction + FactionTier schemas                | Zod schema, thresholds validation, examples |
| FR-S2               | Add factionStanding to WorldLedger                  | Ledger field + helpers + tests              |
| FR-S3               | Add factionChanges to Consequence + clamp in engine | Bounded apply + DebugEvent                  |
| FR-S4               | Add requiredStanding/blockedByStanding gates        | Beat/choice accessibility checks            |
| FR-S5               | Faction-aware NPC attitude resolution               | Derive attitude from tier + override        |
| FR-S6               | Stonepass faction pack (ogre clan, elders)          | Dogfood on canonical world                  |
| FR-S7               | Faction standing debug/creator panel                | Read-only inspector                         |

_Place after Phase 3 consequence engine work; exact week IDs assigned at approval time._

---

## Definition of done (v1)

- [ ] `Faction` + standing validate and round-trip through `WorldDefinition`
- [ ] Consequence Engine applies clamped `factionChanges[]` and logs `faction_standing_changed`
- [ ] Beats/choices gate on standing; Stonepass demonstrates ogre-clan vs elders divergence
- [ ] NPC attitude derives from faction tier with explicit override support
- [ ] Generated worlds (theme packs) ship at least one faction each
- [ ] Debug/creator panel shows current standing and recent changes

---

## Risks & mitigations

| Risk                                   | Mitigation                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| Standing creep makes worlds unwinnable | Per-world delta caps + playtester check for unreachable beats                     |
| Designers confuse flags vs standing    | Standing = scalar relationships; flags = discrete facts. Document in §22 contract |
| AI invents off-tone factions           | Same content filter + human approve before publish                                |
| Score thresholds inconsistent          | Validator requires ascending thresholds                                           |

---

## Open questions

1. Score range fixed engine-wide or per-world (`FactionConfig`)?
2. Tier set fixed (5) or configurable per world?
3. Do factions relate to each other (ally/enemy graph) in v1, or keep flat until v2?
4. Should standing decay over turns, or only change via consequences?

---

## References

- [NPC_Memory_and_Relationship_Arcs.md](./NPC_Memory_and_Relationship_Arcs.md) — per-NPC memory that layers on faction tier
- [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) — theme packs ship factions
- [Quest_Generation.md](./Quest_Generation.md) — quests can require/grant standing within bounds
- `packages/core/src/schemas/consequence.ts`, `worldLedger.ts`, `npc.ts`
