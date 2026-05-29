# NPC Memory & Relationship Arcs

> **Living document** for persistent, per-NPC memory: an NPC remembers what the player did to/with them across the whole playthrough, evolves a personal attitude and relationship arc, and reacts accordingly — all stored in engine-owned state and surfaced as validated context to the NPC flavor agent.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Faction_and_Reputation_System.md](./Faction_and_Reputation_System.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- AI **never** writes NPC memory directly; memory changes only through validated `Consequence.npcUpdates[]` applied by the engine.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature                               | Status                | Target phase (approx.)                  | Last updated |
| ------------------------------------- | --------------------- | --------------------------------------- | ------------ |
| Per-NPC memory in ledger              | Brainstorm / proposed | Phase 3–4 (extends existing npcUpdates) | 2026-05-28   |
| Relationship arc / attitude evolution | Brainstorm / proposed | Phase 4 (with NPCReactionAgent)         | 2026-05-28   |
| Memory-aware NPC flavor prompts       | Brainstorm / proposed | Phase 4+                                | 2026-05-28   |

---

## One-line summary

Each NPC carries a small **memory record** in the `WorldLedger` (attitude, known facts, last interactions, milestones); `Consequence.npcUpdates[]` mutates it deterministically; the NPC flavor agent receives that record as **read-only context** so the ogre who you fed treats you differently three beats later.

---

## Why this fits the project and plays to its strengths

- **Already half-built.** `Consequence` has structured `npcUpdates[]` and `Npc` has an attitude enum + `knownFlags`. This feature formalizes the _persistence + arc_ on top of existing contracts.
- **The emotional payoff of "remembered state."** Faction standing is the macro relationship; NPC memory is the intimate one — together they make choices feel consequential.
- **Bounded, structured, safe.** Memory is a typed record, not free text the model owns; the flavor agent only _reads_ it.
- **Showcase-critical.** Stonepass's ogre/elder arcs become genuinely reactive, strengthening the v2 showcase.
- **Generation-ready.** `NpcArchetype` library entries (Phase 5, W7-S7) define default memory shapes; generated worlds inherit reactive NPCs for free.

---

## How this fits the existing architecture

| Existing piece                      | Role in this feature                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `Npc` schema                        | Adds optional `memoryDefaults` (starting attitude, baseline known facts)       |
| `Consequence.npcUpdates[]`          | The **only** write path: attitude shifts, learned facts, milestone flags       |
| `WorldLedger`                       | New `npcMemory` map (npcId → memory record) — engine-owned truth               |
| `NPCReactionAgent` (Phase 4, W4-S5) | Receives memory record as read-only prompt context; output validated + bounded |
| `Faction` (proposed)                | NPC effective attitude = blend of faction tier + personal memory override      |
| `DebugEvent`                        | New `npc_memory_updated` event for trace/UI                                    |
| `WorldSession`                      | Memory persists in session; survives save/load (Phase 6)                       |
| `validateWorldDefinition`           | `npcUpdates` reference existing NPC IDs; attitudes in enum                     |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Memory record model

```text
Per NPC, the ledger stores:

  attitude:        one of the Npc attitude enum (friendly|neutral|hostile|afraid|curious|trusting|fearful)
  knownFacts:      string[]  (flag-like facts the NPC has "learned": player_helped_me, player_lied)
  milestones:      string[]  (arc beats reached: first_met, saved_my_life, betrayed_me)
  lastInteractionTurn: number
  interactionCount:    number

Arc transitions are data, not vibes:
  feed_ogre        → ogre.attitude: hostile→curious, knownFacts += player_helped_me, milestones += shared_a_meal
  trick_ogre       → ogre.attitude: hostile→fearful, knownFacts += player_lied
  later beat reads ogre.milestones to unlock beat_ogre_alliance
```

The **arc** is the ordered set of milestones; the **attitude** is the current snapshot; **knownFacts** gate dialogue and beats.

---

## Schema sketches (illustrative — not final)

```ts
// Extends packages/core/src/schemas/npc.ts
memoryDefaults: z.object({
  attitude: NpcAttitudeSchema.default("neutral"),
  knownFacts: z.array(z.string()).default([]),
}).optional();

// New ledger record (extends WorldLedger)
export const NpcMemorySchema = z.object({
  attitude: NpcAttitudeSchema,
  knownFacts: z.array(z.string()).default([]),
  milestones: z.array(z.string()).default([]),
  lastInteractionTurn: z.number().int().nonnegative().default(0),
  interactionCount: z.number().int().nonnegative().default(0),
});
//   npcMemory: Record<npcId, NpcMemory>

// Extends Consequence.npcUpdates[] (already structured today)
export const NpcUpdateSchema = z.object({
  npcId: z.string().min(1),
  setAttitude: NpcAttitudeSchema.optional(),
  addKnownFacts: z.array(z.string()).default([]),
  addMilestones: z.array(z.string()).default([]),
});
```

---

## Runtime & engine integration

1. **Init.** `initializeWorldSession` seeds `npcMemory` from each NPC's `memoryDefaults`.
2. **Apply.** Consequence Engine applies `npcUpdates[]`: sets attitude, unions known facts/milestones, bumps `interactionCount` + `lastInteractionTurn`; logs `npc_memory_updated`.
3. **Gate.** Beats/choices may require `npcKnownFact` or `npcMilestone` (e.g. only offer alliance if `saved_my_life`).
4. **Flavor.** `NPCReactionAgent` prompt includes the memory record + `toneRules`; the model writes a line _consistent with_ memory; output validated for tone/safety/length. AI never edits the record.

---

## AI proposes / validators check / engine executes

| Step                                        | Who                                                   | Constraint                                             |
| ------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| Propose memory-aware reaction               | NPCReactionAgent                                      | Reads memory; output validated for tone/length/safety  |
| Propose npcUpdates in generated consequence | WorldArchitect / quest gen                            | Validates against `NpcUpdateSchema`; refs existing NPC |
| Validate                                    | `validateWorldDefinition` + Consequence preconditions | NPC IDs exist; attitudes in enum                       |
| Execute                                     | Consequence Engine                                    | Deterministic union/set; logs DebugEvent               |

---

## Security & safety

- Memory is a typed record; the model cannot inject arbitrary persistent facts — only `addKnownFacts` strings inside a validated consequence authored/approved through the pipeline.
- `safetyMode` + `toneRules` constrain generated reaction text.
- Save/fork snapshots carry `npcMemory` so relationships reproduce.
- Optional cap on `knownFacts`/`milestones` length to bound prompt size.

---

## Phase map / dependency order

| Order | Prerequisite                         | Enables                     |
| ----- | ------------------------------------ | --------------------------- |
| 1     | W1-S5 Consequence, W1-S9 NPC (done)  | Memory record shape         |
| 2     | W3-S1 Consequence Engine             | Deterministic memory writes |
| 3     | Phase 4 NPCReactionAgent (W4-S5)     | Memory-aware flavor         |
| 4     | Faction system (proposed)            | Blended attitude resolution |
| 5     | Phase 5 NpcArchetype library (W7-S7) | Generated reactive NPCs     |
| 6     | Phase 9 Creator Cockpit              | NPC memory inspector        |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name                                      | Goal                                             |
| ------------------- | ----------------------------------------- | ------------------------------------------------ |
| NM-S1               | Extend NPC schema with memoryDefaults     | Schema + examples                                |
| NM-S2               | Add npcMemory to WorldLedger              | Ledger field + helpers + tests                   |
| NM-S3               | Extend npcUpdates + apply in engine       | Set attitude, union facts/milestones, DebugEvent |
| NM-S4               | Add npcKnownFact / npcMilestone gates     | Beat/choice accessibility                        |
| NM-S5               | Memory context in NPCReactionAgent prompt | Read-only context, bounded output                |
| NM-S6               | Stonepass ogre/elder arc                  | Dogfood reactive arc                             |
| NM-S7               | NPC memory creator/debug panel            | Read-only inspector                              |

---

## Definition of done (v1)

- [ ] NPC memory validates and seeds from defaults at session init
- [ ] `npcUpdates[]` deterministically mutate memory and log `npc_memory_updated`
- [ ] Beats/choices gate on known facts and milestones
- [ ] NPCReactionAgent produces memory-consistent, in-tone reactions
- [ ] Stonepass ogre treats "fed" vs "tricked" players differently downstream
- [ ] Memory survives save/load and travels with forks

---

## Risks & mitigations

| Risk                          | Mitigation                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| Prompt bloat from long memory | Cap facts/milestones; summarize older entries                                             |
| Model contradicts memory      | Memory is read-only context + validator rejects off-tone output; fallback line on failure |
| Memory vs faction confusion   | NPC memory = personal; faction = group. Document blend rule                               |
| Combinatorial beat gating     | Health/playtester checks for unreachable memory-gated beats                               |

---

## Open questions

1. Effective attitude formula when faction tier and personal memory disagree (override vs weighted blend)?
2. Do milestones ever expire or are they permanent arc markers?
3. Should NPCs "share" facts (gossip) in v1, or keep memory strictly local?
4. Cap on tracked NPCs per session for performance/prompt size?

---

## References

- [Faction_and_Reputation_System.md](./Faction_and_Reputation_System.md) — group standing that blends with personal memory
- [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) — NpcArchetype library entries
- `packages/core/src/schemas/npc.ts`, `consequence.ts`, `worldLedger.ts`
