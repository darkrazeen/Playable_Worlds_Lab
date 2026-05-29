# Dynamic Difficulty Director

> **Living document** for letting the AI Director **propose** pacing and difficulty adjustments — hint frequency, encounter intensity tier, optional-branch emphasis — based on ledger signals, always **inside immutable WorldBlueprint bounds**, never mutating truth.
>
> **Status:** Scheduled in step tracker — rows added 2026-05-29 as `Not started`: **W4-S9** (ledger-signal heuristics), **W4-S10** (`adjust_difficulty` action), **W8-S20** (`DifficultyProfile`). Implement only when each step reaches `Next` with human approval.  
> **Last updated:** 2026-05-28  
> **Related:** [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [Item_and_Gear_Template_Library.md](./Item_and_Gear_Template_Library.md), [Story_Seed_Determinism_and_Variation_Explorer.md](./Story_Seed_Determinism_and_Variation_Explorer.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- The Director may **adjust difficulty parameters within bounds**; it may **never** change the ledger, rewards, or completion rules.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| DifficultyProfile in WorldBlueprint | Brainstorm / proposed | Phase 5 (with WorldBlueprint W8-S6) | 2026-05-28 |
| Director difficulty decisions (bounded) | Brainstorm / proposed | Phase 2+ extension of DirectorDecision | 2026-05-28 |
| Ledger-signal difficulty heuristics | Brainstorm / proposed | Phase 2–3 | 2026-05-28 |

---

## One-line summary

The Director reads deterministic ledger signals (turns taken, retries, failed checks, gear tier) and proposes a **difficulty parameter** (hint level, encounter intensity, branch emphasis) as a new `DirectorDecision` action; the engine clamps it to the world's `DifficultyProfile` bounds and applies only **presentation/selection** effects — the underlying graph and rewards stay fixed.

---

## Why this fits the project and plays to its strengths

- **Pure extension of an existing seam.** `DirectorDecision` already models "AI suggests, engine executes." This adds one bounded action type, not a new system.
- **Keeps AI on the safe side of the line.** Difficulty knobs touch *selection and flavor*, never ledger truth — fits the README "AI may do" list exactly.
- **Signals already exist.** Turn count, choice history, retries, and (with the item feature) gear tier are all in the ledger/session — no new telemetry needed.
- **Strengthens replayability.** The same world feels different at easy vs hard without authoring two worlds.
- **Composable.** Pairs with encounter/puzzle libraries (pick a higher-intensity variant) and the seed/variation explorer (difficulty as an explained variation axis).

---

## How this fits the existing architecture

| Existing piece | Role in this feature |
| --- | --- |
| `DirectorDecision` | New `adjust_difficulty` action with bounded target value |
| `WorldBlueprint` (W8-S6) | Holds `DifficultyProfile` (min/max intensity, hint policy) — immutable bounds |
| `WorldLedger` / `WorldSession` | Source of deterministic signals (turns, retries, history) |
| `DirectorAgent` (Phase 2, W4-S4) | Produces the suggestion via AI Gateway, validated + clamped |
| Encounter/Puzzle templates (W7-S7) | Carry `intensityTier`; Director selects within allowed band |
| `DebugEvent` | `difficulty_adjusted` event for trace/UI transparency |
| `validateWorldDefinition` / health | Ensure each intensity band remains completable |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Difficulty model

```text
DifficultyProfile (immutable, in WorldBlueprint):
  baseLevel:       easy | normal | hard
  allowedRange:    [minTier, maxTier]   (e.g. encounter intensity 1..3)
  hintPolicy:      none | on_struggle | generous
  adaptive:        boolean              (may the Director nudge at all?)

Runtime (Director proposes, engine clamps):
  signals → suggested difficultyTier
  engine clamps to allowedRange
  affects: which encounter/puzzle VARIANT is selected, hint visibility,
           optional-branch emphasis — NOT rewards, NOT the graph, NOT the ledger
```

A world author can set `adaptive: false` to lock difficulty entirely.

---

## Schema sketches (illustrative — not final)

```ts
// Extends WorldBlueprint (W8-S6)
export const DifficultyProfileSchema = z.object({
  baseLevel: z.enum(["easy", "normal", "hard"]).default("normal"),
  allowedRange: z.tuple([z.number().int(), z.number().int()]),
  hintPolicy: z.enum(["none", "on_struggle", "generous"]).default("on_struggle"),
  adaptive: z.boolean().default(true),
});

// Extends DirectorDecision action enum
//   "adjust_difficulty"
export const DifficultyDecisionSchema = z.object({
  action: z.literal("adjust_difficulty"),
  suggestedTier: z.number().int(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

// Deterministic signal snapshot (input to the agent, computed by engine)
export const DifficultySignalsSchema = z.object({
  turnNumber: z.number().int(),
  retriesThisInstance: z.number().int(),
  failedChecks: z.number().int(),
  highestGearTier: z.number().int().optional(),
});
```

---

## Runtime & engine integration

1. **Compute signals.** Engine derives `DifficultySignals` from session/ledger (deterministic, no AI).
2. **Propose.** `DirectorAgent` returns an `adjust_difficulty` decision wrapped in `AIResult`; on failure, fallback keeps current tier.
3. **Clamp + apply.** Engine clamps `suggestedTier` to `DifficultyProfile.allowedRange`; stores `currentDifficultyTier` in session; logs `difficulty_adjusted`.
4. **Use.** Encounter/puzzle selection and hint visibility read `currentDifficultyTier`; the graph and rewards are untouched.

---

## AI proposes / validators check / engine executes

| Step | Who | Constraint |
| --- | --- | --- |
| Compute signals | Engine | Deterministic from ledger/session |
| Propose tier | DirectorAgent | `DifficultyDecisionSchema`; AIResult wrapper; fallback on fail |
| Clamp + apply | Engine | Within `allowedRange`; only selection/flavor effects |
| Reject overreach | Engine | If world `adaptive: false`, ignore + log |

---

## Security & safety

- The Director can never exceed `allowedRange` or touch rewards/graph — clamped + validated.
- `adaptive: false` fully disables AI difficulty changes.
- All adjustments are logged (`difficulty_adjusted`) and visible in the reasoning panel.
- Determinism preserved: given the same seed + signals + provider response, results reproduce (see [seed explorer](./Story_Seed_Determinism_and_Variation_Explorer.md)).

---

## Phase map / dependency order

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | Phase 1 runtime + ledger (done) | Difficulty signals |
| 2 | Phase 2 DirectorAgent (W4-S4) | Bounded suggestions |
| 3 | Phase 3 encounter/puzzle (W5-S3/S4) | Variant selection by tier |
| 4 | W8-S6 WorldBlueprint | DifficultyProfile bounds |
| 5 | Phase 9 Creator Cockpit | Difficulty config + reasoning panel |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name | Goal |
| --- | --- | --- |
| DD-S1 | Create DifficultyProfile schema | In WorldBlueprint + examples |
| DD-S2 | Add adjust_difficulty to DirectorDecision | Action + validation |
| DD-S3 | Compute deterministic difficulty signals | Engine helper + tests |
| DD-S4 | Clamp + apply difficulty tier in session | Bounded apply + DebugEvent |
| DD-S5 | Encounter/puzzle variant selection by tier | Library tier wiring |
| DD-S6 | Difficulty reasoning panel | Show signals + decision + clamp |

---

## Definition of done (v1)

- [ ] `DifficultyProfile` validates as part of WorldBlueprint
- [ ] Director proposes `adjust_difficulty`; engine clamps to allowed range
- [ ] Encounter/puzzle variants and hints respond to `currentDifficultyTier`
- [ ] Rewards, ledger, and graph provably unaffected by difficulty changes
- [ ] `adaptive: false` disables adjustment
- [ ] Reasoning panel shows signals, suggestion, and applied (clamped) value

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Difficulty makes a path uncompletable | Health/playtester verify each tier is completable |
| AI overreach into rewards/graph | Hard clamp + schema; only selection/flavor effects |
| Oscillating difficulty (yo-yo) | Hysteresis / min turns between adjustments |
| Non-determinism | Snapshot signals + seed; record provider response |

---

## Open questions

1. Difficulty as a single scalar tier or per-axis (combat vs puzzle vs hints)?
2. Should gear tier feed difficulty (rubber-banding) or stay independent?
3. Player-visible difficulty setting vs silent adaptation, or both?
4. Do generated worlds get a conservative default `adaptive: false` until trusted?

---

## References

- [Item_and_Gear_Template_Library.md](./Item_and_Gear_Template_Library.md) — gear tier as a difficulty signal
- [Story_Seed_Determinism_and_Variation_Explorer.md](./Story_Seed_Determinism_and_Variation_Explorer.md) — difficulty as an explained variation axis
- [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) — WorldBlueprint bounds + Director flavor layer
- `packages/core/src/schemas/directorDecision.ts`, `worldSession.ts`
