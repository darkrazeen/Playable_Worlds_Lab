# Analytics & Telemetry from DebugEvents

> **Living document** for aggregating the existing `DebugEvent` trace across sessions into **creator-facing analytics**: choice distributions, branch coverage, drop-off points, dead-end hits, fallback rates, and goal-completion funnels — privacy-respecting, opt-in, deterministic-source insight that guides authoring.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Story_Seed_Determinism_and_Variation_Explorer.md](./Story_Seed_Determinism_and_Variation_Explorer.md), [World_Health_Score_v2_and_AI_Critic_Loop.md](./World_Health_Score_v2_and_AI_Critic_Loop.md), [Authoring_Studio_and_Visual_Beat_Editor.md](./Authoring_Studio_and_Visual_Beat_Editor.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- Analytics is **read-only aggregation**; it never affects gameplay and must respect privacy/consent and `safetyMode`.
- **Out of scope:** ad targeting, third-party trackers, selling data. This is first-party creator insight only.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| DebugEvent aggregation pipeline | Brainstorm / proposed | Phase 6+ (after persistence) | 2026-05-28 |
| Creator analytics dashboards | Brainstorm / proposed | Phase 7–9 | 2026-05-28 |
| Drop-off / coverage / fallback metrics | Brainstorm / proposed | Phase 7–9 | 2026-05-28 |

---

## One-line summary

Because every runtime transition already emits a typed `DebugEvent`, sessions can be aggregated (opt-in, anonymized) into metrics — which choices players pick, where they stall, which branches never get seen, how often AI fell back — surfaced as dashboards that tell creators exactly what to improve.

---

## Why this fits the project and plays to its strengths

- **The instrumentation already exists.** `DebugEvent` logs choice/consequence/flag/goal/fallback/validation events — analytics is aggregation, not new logging.
- **Closes the creator feedback loop.** Pairs with health v2 (static quality) and the variation explorer (single-run causes) to give *population-level* quality signal.
- **Deterministic source of truth.** Metrics derive from validated engine events, not guesswork — trustworthy by construction.
- **Drives authoring + weaving.** Drop-off and unseen-branch data directly inform the [authoring studio](./Authoring_Studio_and_Visual_Beat_Editor.md) and [quest weaving](./Emergent_Goal_and_Director_Quest_Weaving.md).
- **First-party + privacy-respecting.** No third-party trackers; fits a safety-first product.

---

## How this fits the existing architecture

| Existing piece | Role in this feature |
| --- | --- |
| `DebugEvent` | The raw event source (already typed + logged) |
| `WorldSession.choiceHistory` | Per-session route data |
| `WorldLedger` | End-state for completion/goal funnels |
| Persistence (Phase 6, W9) | Stores sessions/events for aggregation |
| `AIResult.fallbackUsed` | Fallback-rate metric |
| Creator Cockpit (W12) | Dashboard host |
| Health v2 / weaving | Consumers of the insight |

**Core mantra unchanged:** AI proposes → validators check → engine executes — analytics only *reads* the resulting events.

---

## Metric model

```text
Event source (existing): DebugEvent stream per session
  choice_selected, consequence_applied, flag_changed, goal_unlocked,
  fallback_used, validation_failed, (proposed) zone_transition, quest_woven, ...

Aggregations (opt-in, anonymized):
  CHOICE DISTRIBUTION   per beat: % picking each choice
  BRANCH COVERAGE       % of beats/branches ever reached
  DROP-OFF              beats where sessions most often end without an ending
  DEAD-END HITS         non-ending beats with no onward action reached
  GOAL FUNNEL           % reaching each goal/ending
  FALLBACK RATE         AI fallback_used per beat/agent
  TIME/TURNS            turns-to-goal distribution
```

All metrics are **counts/rates over events** — no raw free-text content required for the core dashboards.

---

## Schema sketches (illustrative — analytics-side)

```ts
// Opt-in, anonymized event record for aggregation
export const TelemetryEventSchema = z.object({
  worldId: z.string(),
  worldVersionId: z.string(),
  sessionHash: z.string(),         // anonymized session id (no PII)
  turnNumber: z.number().int(),
  eventType: z.string(),           // mirrors DebugEvent type enum
  beatId: z.string().optional(),
  choiceId: z.string().optional(),
  fallbackUsed: z.boolean().optional(),
  consentTier: z.enum(["none", "aggregate_only", "full"]),
});

// Aggregated metric output
export const ChoiceDistributionSchema = z.object({
  beatId: z.string(),
  total: z.number().int(),
  choices: z.array(z.object({ choiceId: z.string(), count: z.number().int(), pct: z.number() })),
});
```

---

## Runtime & integration

1. **Consent.** Player opts into a telemetry tier (`none` / `aggregate_only` / `full`); default privacy-preserving.
2. **Emit.** On consent, anonymized `TelemetryEvent`s derived from `DebugEvent`s are persisted (Phase 6 storage).
3. **Aggregate.** A batch/stream job computes distributions, coverage, drop-off, funnels, fallback rates per world version.
4. **Surface.** Creator Cockpit dashboards visualize metrics; link findings to beats in the authoring studio.

---

## AI proposes / validators check / engine executes

| Step | Who | Constraint |
| --- | --- | --- |
| Emit events | Engine | Derived from existing DebugEvents; consent-gated |
| Aggregate | Deterministic job | Counts/rates; no gameplay effect |
| Interpret (optional) | AI summary | Advisory narrative over metrics; cannot change data |
| Act | Human (author) | Uses insight in studio/weaving |

---

## Security & safety

- Opt-in consent tiers; default does not collect identifying data.
- Session IDs anonymized (hashed); no PII in core metrics.
- `safetyMode` respected; free-text capture only at `full` consent with extra safeguards.
- First-party only — no third-party trackers, no data sale.
- Aggregates suppressed below a minimum sample size (k-anonymity).

---

## Phase map / dependency order

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | Phase 1 DebugEvents (done) | Event source |
| 2 | Phase 6 persistence (W9) | Store events/sessions |
| 3 | Consent model | Privacy-respecting collection |
| 4 | Aggregation job | Metrics |
| 5 | W12 Creator Cockpit | Dashboards |
| 6 | Health v2 / weaving / studio | Consumers |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name | Goal |
| --- | --- | --- |
| AN-S1 | TelemetryEvent schema + consent tiers | Privacy model |
| AN-S2 | Emit anonymized events from DebugEvents | Consent-gated capture |
| AN-S3 | Aggregation job (distributions/coverage/funnel) | Core metrics |
| AN-S4 | Fallback + drop-off + dead-end metrics | Quality signals |
| AN-S5 | k-anonymity suppression | Safe small samples |
| AN-S6 | Creator analytics dashboards | Cockpit visualization |

---

## Definition of done (v1)

- [ ] Opt-in consent tiers gate all collection; default is privacy-preserving
- [ ] Anonymized events derived from existing DebugEvents persist
- [ ] Choice distribution, branch coverage, drop-off, goal funnel, fallback rate compute per world version
- [ ] Small samples suppressed (k-anonymity)
- [ ] Dashboards render in the Creator Cockpit and link to beats
- [ ] No third-party trackers; no PII in core metrics

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Privacy concerns | Opt-in tiers + anonymization + k-anonymity + first-party only |
| Misleading metrics on low data | Sample-size thresholds + confidence notes |
| Storage cost | Aggregate + retain summaries; expire raw events |
| Scope creep to ad/marketing tracking | Hard rule: first-party creator insight only |

---

## Open questions

1. Streaming vs batch aggregation for v1?
2. What (if anything) is captured at `full` consent beyond event types?
3. Retention policy for raw vs aggregated data?
4. Per-world opt-in by the creator in addition to per-player consent?

---

## References

- [Story_Seed_Determinism_and_Variation_Explorer.md](./Story_Seed_Determinism_and_Variation_Explorer.md) — single-run causes (complement to population metrics)
- [World_Health_Score_v2_and_AI_Critic_Loop.md](./World_Health_Score_v2_and_AI_Critic_Loop.md) — static quality (complement to live metrics)
- `packages/core/src/schemas/debugEvent.ts`, `worldSession.ts`
