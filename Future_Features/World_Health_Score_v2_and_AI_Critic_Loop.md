# World Health Score v2 & AI Critic Loop

> **Living document** for evolving the Phase 6 World Health Score (W6) into an **actionable** quality system: deterministic checks produce concrete, machine-readable fix suggestions; an optional AI critic proposes patch drafts; a human approves; the world is re-scored — a closed quality loop that never auto-edits truth.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Emergent_Goal_and_Director_Quest_Weaving.md](./Emergent_Goal_and_Director_Quest_Weaving.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- The AI critic is **advisory**; deterministic checks always run first and cannot be overridden by AI. No auto-apply of AI fixes.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature                                      | Status                | Target phase (approx.)              | Last updated |
| -------------------------------------------- | --------------------- | ----------------------------------- | ------------ |
| Actionable health findings (fix suggestions) | Brainstorm / proposed | Phase 6+ (extends W6 health score)  | 2026-05-28   |
| AI critic patch drafts                       | Brainstorm / proposed | Phase 6–7 (with critic agent W6-S4) | 2026-05-28   |
| Re-score / approve loop                      | Brainstorm / proposed | Phase 7–9 (with Creator Cockpit)    | 2026-05-28   |

---

## One-line summary

Health checks emit **structured findings** (code, location, severity, suggested fix); an AI critic may turn a finding into a **validated patch draft**; the human reviews a before/after diff + new score; on approve, the engine applies it as a new world version — quality improves through a deterministic-first, human-gated loop.

---

## Why this fits the project and plays to its strengths

- **Builds directly on W6.** The Phase 6 health score already defines categories (goal clarity, consequence quality, completion path, flag consistency, replayability). v2 makes each finding _fixable_, not just a number.
- **The natural answer to generated-world quality.** As player generation (Phase 5) and quest weaving scale, "is this world good?" needs to become "here's exactly what to fix."
- **Reuses the whole safety spine.** Critic output is a `WorldDefinition` patch that must pass `validateWorldDefinition` + re-score before a human approves — same guardrails as generation.
- **Inspectable + deterministic-first.** Deterministic findings are authoritative; AI is advisory garnish, matching the README/critic-agent design (W6-S4).
- **Feeds the Creator Cockpit** approve/rollback flow (W12-S7) with real content.

---

## How this fits the existing architecture

| Existing piece                       | Role in this feature                              |
| ------------------------------------ | ------------------------------------------------- |
| Health score (W6-S2–S6)              | Source of categories + base score                 |
| `validateWorldDefinition`            | Findings reuse its reference/graph checks         |
| AI Critic Agent (W6-S4)              | Upgraded from "summary" to "patch draft proposer" |
| `WorldDefinition` versioning (W9-S3) | Each approved fix → new version with lineage      |
| `AIResult`                           | Wraps critic output; fallback when AI unavailable |
| Creator Cockpit (W12)                | Diff review, approve/rollback, re-score UI        |
| Playtester (W11)                     | Cross-checks fixes don't break paths              |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Finding & loop model

```text
HealthFinding (deterministic):
  code:        e.g. DEAD_END_NON_ENDING, NO_NEXT_GOAL, UNUSED_FLAG, NOOP_CHOICE
  severity:    info | warn | error
  location:    beatId / choiceId / consequenceId
  message:     human-readable
  suggestedFix: optional structured hint (machine-readable intent)

Loop:
  1. Deterministic checks → findings + score          (authoritative)
  2. (optional) AI critic turns a finding into a patch draft
  3. Patch draft → validateWorldDefinition + re-score   (must improve / not regress)
  4. Human reviews diff + score delta → Approve / Reject
  5. Approve → new world version (lineage tracked)
```

AI never closes the loop alone; step 4 is always human.

---

## Schema sketches (illustrative — not final)

```ts
// packages/core/src/health/healthFinding.ts
export const HealthFindingSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(["info", "warn", "error"]),
  location: z.object({
    beatId: z.string().optional(),
    choiceId: z.string().optional(),
    consequenceId: z.string().optional(),
  }),
  message: z.string().min(1),
  suggestedFix: z
    .object({
      intent: z.string(), // "add_next_goal" | "remove_unused_flag" | ...
      details: z.record(z.unknown()),
    })
    .optional(),
});

export const HealthReportV2Schema = z.object({
  score: z.number().min(0).max(100),
  categoryScores: z.record(z.number()),
  findings: z.array(HealthFindingSchema),
  deterministic: z.literal(true),
  aiCriticNotes: z.array(z.string()).default([]), // advisory only
});

// AI critic patch draft (must validate as a WorldDefinition diff)
export const WorldPatchDraftSchema = z.object({
  targetFindingCode: z.string(),
  patch: z.unknown(), // structured WorldDefinition delta
  rationale: z.string(),
});
```

---

## Runtime & integration

1. **Score.** Deterministic checks produce `HealthReportV2` with findings (reusing validator internals).
2. **Draft (optional).** For a chosen finding, the critic returns a `WorldPatchDraft` via `AIResult`.
3. **Validate.** Apply patch to a **copy**; run `validateWorldDefinition` + re-score; reject if it regresses or breaks the graph.
4. **Review.** Cockpit shows before/after diff, score delta, playtester results.
5. **Approve.** Engine commits a new world version; lineage recorded; original untouched.

---

## AI proposes / validators check / engine executes

| Step                     | Who                                  | Constraint                                             |
| ------------------------ | ------------------------------------ | ------------------------------------------------------ |
| Compute findings + score | Deterministic checks                 | Authoritative; no AI                                   |
| Propose patch draft      | AI Critic                            | `WorldPatchDraftSchema`; AIResult; fallback = no draft |
| Validate patch           | `validateWorldDefinition` + re-score | Must not regress/break                                 |
| Approve + version        | Human + engine                       | New version; lineage; original preserved               |

---

## Security & safety

- Deterministic findings cannot be overridden by AI.
- No auto-apply: a human always approves the diff.
- Patches validate on a copy before anything is committed.
- Versioning preserves the original; rollback always possible.

---

## Phase map / dependency order

| Order | Prerequisite                          | Enables                  |
| ----- | ------------------------------------- | ------------------------ |
| 1     | W6 health score                       | Categories + base score  |
| 2     | W1-S14 validateWorldDefinition (done) | Finding reuse            |
| 3     | W6-S4 AI critic                       | Patch drafting           |
| 4     | W9-S3 world versioning                | Approved-fix lineage     |
| 5     | W11 playtester                        | Fix regression checks    |
| 6     | W12 Creator Cockpit                   | Diff/approve/re-score UI |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name                                    | Goal                             |
| ------------------- | --------------------------------------- | -------------------------------- |
| HS-S1               | HealthFinding + HealthReportV2 schemas  | Structured findings              |
| HS-S2               | Emit findings from deterministic checks | Map validator results → findings |
| HS-S3               | WorldPatchDraft schema + apply-on-copy  | Safe patch sandbox               |
| HS-S4               | AI critic patch-draft mode              | Finding → draft via AIResult     |
| HS-S5               | Re-score + regression gate              | Reject non-improving patches     |
| HS-S6               | Cockpit diff + approve/re-score UI      | Human-gated loop                 |

---

## Definition of done (v1)

- [ ] Deterministic checks emit structured `HealthFinding`s with locations
- [ ] AI critic can draft a validated patch for at least the common finding codes
- [ ] Patches validate on a copy and are rejected if they regress score/graph
- [ ] Human approves a diff; engine commits a new version with lineage
- [ ] Stonepass (and a deliberately broken world) demonstrate the loop
- [ ] AI notes are clearly marked advisory vs deterministic findings

---

## Risks & mitigations

| Risk                                 | Mitigation                                             |
| ------------------------------------ | ------------------------------------------------------ |
| AI patches introduce subtle breakage | Validate on copy + playtester + re-score gate          |
| Over-trust in AI suggestions         | Deterministic-first; human approval mandatory          |
| Score gaming                         | Categories deterministic + documented; review diffs    |
| Patch format drift                   | Patch is a structured WorldDefinition delta, validated |

---

## Open questions

1. Patch format: full-object replace, JSON-patch, or structured intent ops?
2. Batch multiple fixes per review, or one finding at a time?
3. Minimum score delta required to accept a patch?
4. Should accepted patterns become deterministic auto-suggestions over time?

---

## References

- README roadmap — World Health Score v1 (Phase 6, W6)
- [Emergent_Goal_and_Director_Quest_Weaving.md](./Emergent_Goal_and_Director_Quest_Weaving.md) — quality gating for generated content
- `packages/core/src/validators/validateWorldDefinition.ts`
