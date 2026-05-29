# Emergent Goal & Director Quest Weaving

> **Living document** for letting the AI Director **weave** pre-validated quest modules and side-goals into an in-progress session to fill narrative gaps — pulling from the library of approved `QuestBlueprint`/`QuestDraft` packages, gated by playtester + health, never authoring raw new mechanics at runtime.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Quest_Generation.md](./Quest_Generation.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [World_Health_Score_v2_and_AI_Critic_Loop.md](./World_Health_Score_v2_and_AI_Critic_Loop.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- The Director may **select and schedule pre-approved quest modules**; it may **not** invent unvalidated beats, rewards, or completion rules at runtime.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature                                     | Status                | Target phase (approx.)                       | Last updated |
| ------------------------------------------- | --------------------- | -------------------------------------------- | ------------ |
| Quest module pool + eligibility             | Brainstorm / proposed | Phase 5–7 (after quest generation W8-S9–S12) | 2026-05-28   |
| Director weave decision (select + schedule) | Brainstorm / proposed | Phase 7 (after playtester)                   | 2026-05-28   |
| Gap detection → side-goal injection         | Brainstorm / proposed | Phase 7+                                     | 2026-05-28   |

---

## One-line summary

When the player has no clear next goal, the Director picks an **eligible, pre-validated quest module** from a pool and **schedules** it (offer beat appears); the module was already validated + playtested + health-checked at authoring time, so weaving is selection + merge of trusted content, never freestyle authoring.

---

## Why this fits the project and plays to its strengths

- **Selection, not generation, at runtime.** The risky part (authoring beats/rewards) happens offline through the quest pipeline (W8-S9–S12) and is human/health-approved; the Director only _chooses when_ to surface a trusted module.
- **Directly answers "no next goal."** Playtester step W11-S4 detects missing-goal worlds; this feature is the live-play counterpart that prevents stalls.
- **Reuses everything.** QuestBlueprint, validateQuestDraft, merge-into-WorldDefinition (W8-S12), DirectorDecision, and DebugEvents all already exist or are planned.
- **Bounded emergence.** Worlds feel alive and reactive without sacrificing determinism or safety.
- **Showcase value.** A Stonepass that offers a contextually relevant side-errand when you're idle feels far richer than a static graph.

---

## How this fits the existing architecture

| Existing piece                                                          | Role in this feature                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------- |
| `QuestBlueprint` / `QuestDraft` (W8-S9–S12)                             | The pre-validated modules in the pool                    |
| `mergeQuestDraft` (W8-S12)                                              | Mechanism to splice a chosen module into the live world  |
| `DirectorDecision`                                                      | New `weave_quest` action (select + schedule module)      |
| `WorldLedger` / session                                                 | Eligibility signals (no active goal, standing, location) |
| Playtester (W11)                                                        | Every poolable module is pre-playtested                  |
| Health score (W6 / [v2](./World_Health_Score_v2_and_AI_Critic_Loop.md)) | Modules must meet a quality threshold to be poolable     |
| `DebugEvent`                                                            | `quest_woven` event for transparency                     |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Weave model

```text
QuestModulePool: validated + playtested QuestDrafts tagged with
  eligibility: { requiredFlags, requiredStanding, biomeTags, minTurn, oncePerWorld }

Gap detection (deterministic):
  player has no unlocked goal AND no active instance AND idle for N turns
  → request a weave

Director weave (bounded):
  filters pool by eligibility against current ledger
  proposes ONE module to schedule (weave_quest decision)
  engine validates eligibility again + merges offer beat (does not auto-complete)
  player may accept/decline (normal choices)
```

The module is **trusted content**; the Director only decides relevance + timing.

---

## Schema sketches (illustrative — not final)

```ts
// Eligibility wrapper around a validated QuestDraft
export const PoolableQuestSchema = z.object({
  questId: z.string().min(1),
  draftRef: z.string().min(1), // points to a validated QuestDraft
  healthScore: z.number().min(0).max(100),
  playtested: z.literal(true),
  eligibility: z.object({
    requiredFlags: z.array(z.string()).default([]),
    blockedByFlags: z.array(z.string()).default([]),
    requiredStanding: z.record(z.string()).optional(),
    biomeTags: z.array(z.string()).default([]),
    minTurn: z.number().int().default(0),
    oncePerWorld: z.boolean().default(true),
  }),
});

// Extends DirectorDecision
export const WeaveQuestDecisionSchema = z.object({
  action: z.literal("weave_quest"),
  questId: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});
```

---

## Runtime & integration

1. **Detect gap.** Deterministic check: no next goal + idle threshold → eligible for weave.
2. **Filter pool.** Engine narrows the module pool by eligibility against the current ledger/standing/biome.
3. **Propose.** Director returns a `weave_quest` decision (AIResult); fallback = pick highest-health eligible module deterministically, or do nothing.
4. **Merge offer.** Engine re-checks eligibility and merges the module's **offer beat** via `mergeQuestDraft`; logs `quest_woven`. The player still chooses to accept.

---

## AI proposes / validators check / engine executes

| Step                         | Who                                | Constraint                                         |
| ---------------------------- | ---------------------------------- | -------------------------------------------------- |
| Detect gap                   | Engine                             | Deterministic signals                              |
| Pick module                  | Director                           | From pre-validated pool only; `weave_quest` schema |
| Validate eligibility + merge | Engine + `validateWorldDefinition` | Merged world stays valid; offer only               |
| Play                         | Player                             | Normal accept/decline choices                      |

---

## Security & safety

- Only **pre-validated, playtested, health-passing** modules are poolable — runtime never authors new mechanics.
- Eligibility re-checked at merge time (not just at proposal).
- `oncePerWorld` and cooldowns prevent spam.
- All weaves logged + visible in the reasoning panel.

---

## Phase map / dependency order

| Order | Prerequisite                  | Enables                    |
| ----- | ----------------------------- | -------------------------- |
| 1     | W8-S9–S12 quest generation    | Validated modules          |
| 2     | W11 playtester                | Pre-playtested pool        |
| 3     | W6 / health v2                | Quality threshold for pool |
| 4     | Phase 2 DirectorAgent         | Selection decisions        |
| 5     | Faction/standing + NPC memory | Richer eligibility         |
| 6     | Phase 9 Creator Cockpit       | Pool management UI         |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name                                   | Goal                     |
| ------------------- | -------------------------------------- | ------------------------ |
| EW-S1               | PoolableQuest schema + pool store      | Eligibility metadata     |
| EW-S2               | Deterministic gap detection            | No-next-goal/idle signal |
| EW-S3               | Add weave_quest to DirectorDecision    | Bounded selection action |
| EW-S4               | Eligibility filter + re-check at merge | Safe scheduling          |
| EW-S5               | Merge offer beat via mergeQuestDraft   | Live splice + DebugEvent |
| EW-S6               | Cooldown / oncePerWorld controls       | Anti-spam                |
| EW-S7               | Pool management + reasoning panel      | Creator visibility       |

---

## Definition of done (v1)

- [ ] Only validated/playtested/health-passing modules enter the pool
- [ ] Deterministic gap detection triggers a weave request
- [ ] Director selects an eligible module; engine re-checks + merges an offer beat
- [ ] Merged world still passes `validateWorldDefinition`
- [ ] Cooldown / oncePerWorld prevent repeats
- [ ] `quest_woven` events appear in the trace + reasoning panel

---

## Risks & mitigations

| Risk                             | Mitigation                                             |
| -------------------------------- | ------------------------------------------------------ |
| Irrelevant/spammy quests         | Eligibility filters + cooldowns + confidence threshold |
| Merge breaks host world          | Validate merged world before commit                    |
| Runtime authoring temptation     | Hard rule: select from pre-validated pool only         |
| Player overwhelmed by side-goals | Max active woven quests cap                            |

---

## Open questions

1. Pool is per-world, per-region, or global (shared library)?
2. Deterministic fallback selection when AI is unavailable — highest health, or none?
3. Should woven quests persist across sessions/forks?
4. How does this interact with author-placed quests (priority)?

---

## References

- [Quest_Generation.md](./Quest_Generation.md) — the pipeline that produces poolable modules
- [World_Health_Score_v2_and_AI_Critic_Loop.md](./World_Health_Score_v2_and_AI_Critic_Loop.md) — quality threshold for the pool
- [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) — Director flavor/selection layer
- `packages/core/src/schemas/directorDecision.ts`
