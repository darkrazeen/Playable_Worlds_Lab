# Story Seed Determinism & Variation Explorer

> **Living document** for first-class **seeds** plus a tool that explains *why* two playthroughs of the same world diverged — attributing every variation to a profile, route, seed, flag, NPC attitude, validated AI suggestion, or approved remix, enforcing the project's replay-variation guardrail.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md), [Analytics_and_Telemetry_from_DebugEvents.md](./Analytics_and_Telemetry_from_DebugEvents.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- Every variation must be **explainable** by one of the allowed sources (see guardrail in FULL_CURSOR §1 / Replay Variation).
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| Seed propagation through runtime + AI | Brainstorm / proposed | Phase 1–2 (seed plumbing) | 2026-05-28 |
| Variation attribution (per-difference cause) | Brainstorm / proposed | Phase 2–6 | 2026-05-28 |
| Variation Explorer UI (run A vs run B diff) | Brainstorm / proposed | Phase 6–9 | 2026-05-28 |

---

## One-line summary

A run is reproducible from a `generationSeed` + recorded provider responses; the **Variation Explorer** compares two sessions of the same world and labels each divergence with its cause — turning the abstract "replay variation must be explainable" rule into a concrete, inspectable tool.

---

## Why this fits the project and plays to its strengths

- **Operationalizes a stated principle.** The replay-variation guardrail already exists in the spec; this makes it testable and visible rather than aspirational.
- **DebugEvents already capture causes.** Every transition logs choice/consequence/flag/AI/fallback — the data needed for attribution is mostly present.
- **AIResult already carries `generationSeed`.** Seed plumbing is a small extension of an existing field.
- **Trust + transparency.** "Why was my run different?" is answerable, which matters for creators, playtesters, and shared worlds.
- **Pairs with difficulty + Director features** by giving them a deterministic backbone and an audit surface.

---

## How this fits the existing architecture

| Existing piece | Role in this feature |
| --- | --- |
| `AIResult.generationSeed` | Seed recorded per AI call; enables replay |
| `WorldSession.choiceHistory` | Player route — a primary variation source |
| `DebugEvent` | Per-transition causes (choice/consequence/flag/fallback) |
| `WorldLedger` | End-state diff between runs |
| `DirectorDecision` | Validated AI suggestions tagged as a variation source |
| Fork/remix lineage (Phase 6) | "Approved remix" as an explained source |
| Save/load (W9-S5) | Persist seeds + recorded responses for replay |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Variation source taxonomy

```text
Allowed causes of divergence (everything must map to one):
  PROFILE       player/safety/session settings differ
  ROUTE         different choices taken (choiceHistory)
  SEED          different generationSeed
  FLAG          ledger flag state differs at a gate
  NPC_ATTITUDE  NPC memory/attitude differs (see NPC Memory feature)
  AI_SUGGESTION validated DirectorDecision differed
  REMIX         approved fork/remix changed the WorldDefinition

A divergence with NO mapping = a bug (logged as UNEXPLAINED_VARIATION).
```

The explorer's job: take two runs, walk their DebugEvent timelines, and tag the first point of divergence + its cause.

---

## Schema sketches (illustrative — not final)

```ts
// Recorded run manifest for replay
export const RunManifestSchema = z.object({
  worldId: z.string(),
  worldVersionId: z.string(),
  rootSeed: z.string(),                  // master seed for the run
  profile: z.record(z.unknown()),        // settings snapshot
  aiResponses: z.array(z.object({        // recorded for deterministic replay
    callId: z.string(),
    seed: z.string(),
    response: z.unknown(),
  })),
});

// Variation finding (output of the explorer)
export const VariationFindingSchema = z.object({
  turnNumber: z.number().int(),
  cause: z.enum([
    "PROFILE", "ROUTE", "SEED", "FLAG",
    "NPC_ATTITUDE", "AI_SUGGESTION", "REMIX", "UNEXPLAINED_VARIATION",
  ]),
  detail: z.string(),
  runARef: z.string(),
  runBRef: z.string(),
});
```

---

## Runtime & integration

1. **Seed plumb.** A `rootSeed` is derived per run; sub-seeds feed each AI call (recorded in `AIResult.generationSeed`).
2. **Record.** Optionally persist a `RunManifest` (seed + provider responses) so a run can be deterministically replayed.
3. **Compare.** The explorer aligns two runs' `DebugEvent` timelines, finds first divergence, classifies the cause.
4. **Flag bugs.** Any divergence that can't be attributed → `UNEXPLAINED_VARIATION` finding (a correctness alarm).

---

## AI proposes / validators check / engine executes

| Step | Who | Constraint |
| --- | --- | --- |
| Generate with seed | AI agents | Seed recorded in AIResult |
| Replay run | Engine | Uses recorded responses; deterministic |
| Classify divergence | Explorer (deterministic) | Maps to allowed cause or flags UNEXPLAINED |
| Surface | UI | Read-only; no state change |

---

## Security & safety

- Recorded provider responses may contain content — store under the same `safetyMode`/privacy rules as sessions.
- Replay uses recorded responses (no new external calls unless explicitly re-running).
- Explorer is read-only; it never mutates worlds or ledgers.

---

## Phase map / dependency order

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | Phase 1 runtime + DebugEvents (done) | Cause data |
| 2 | Phase 2 AI Gateway + AIResult seed | Seeded AI calls |
| 3 | W9-S5 save/load | Persist run manifests |
| 4 | NPC memory / Director features | Richer cause taxonomy |
| 5 | Phase 9 Creator Cockpit | Explorer UI |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name | Goal |
| --- | --- | --- |
| SV-S1 | Root + sub-seed derivation | Deterministic seed plumbing |
| SV-S2 | RunManifest schema + record | Capture seed + AI responses |
| SV-S3 | Deterministic run replay | Replay from manifest |
| SV-S4 | Variation classifier | Diff two runs → causes |
| SV-S5 | UNEXPLAINED_VARIATION alarm + tests | Correctness gate |
| SV-S6 | Variation Explorer UI | Run A vs B visual diff |

---

## Definition of done (v1)

- [ ] Every AI call records a seed; a run replays deterministically from its manifest
- [ ] The explorer classifies the first divergence between two runs
- [ ] Any unattributable divergence raises `UNEXPLAINED_VARIATION`
- [ ] Stonepass: two routes diff cleanly to `ROUTE`/`FLAG` causes
- [ ] Explorer UI shows aligned timelines + cause labels
- [ ] Replays use recorded responses (no surprise external calls)

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Provider non-determinism | Record + replay responses; seed where supported |
| Manifest size | Store compactly; optional retention policy |
| Privacy of recorded content | Same safety/privacy rules as sessions |
| False "unexplained" alarms | Expand taxonomy as features add sources |

---

## Open questions

1. Store full provider responses or hashes + cache?
2. Per-call seed strategy when providers ignore seeds?
3. Should the explorer support N-run comparison, or A/B only in v1?
4. Retention/expiry policy for run manifests?

---

## References

- FULL_CURSOR §1 — Replay Variation guardrail (allowed variation sources)
- [Analytics_and_Telemetry_from_DebugEvents.md](./Analytics_and_Telemetry_from_DebugEvents.md) — aggregate view of the same data
- [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md) — difficulty as a variation axis
- `packages/core/src/schemas/aiResult.ts`, `debugEvent.ts`, `worldSession.ts`
