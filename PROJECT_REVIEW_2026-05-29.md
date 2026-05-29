# Playable Worlds Lab — Project Review

**Review date:** 2026-05-29
**Reviewed by:** AI deep-dive (agent)
**Scope:** Entire repository — tooling, `packages/core`, `packages/ai`, `packages/content`, `apps/web`, tests, CI, docs/tracker
**Build state at review:** Phase 0 complete; Phase 1 complete (W2-S1–S7, W3-S1–S7); **258 tests passing (39 files)**; `typecheck`, `lint`, `build` green.

---

## 1. Executive summary

The project is in **strong shape for its stage**. The schema-first architecture is clean, the deterministic engine is well-isolated, the cross-file validator is genuinely thorough, and test coverage is broad for the surface area built so far. The "AI proposes → validators check → engine executes" mantra is reflected in the actual code structure, not just the docs.

The main risks are **not** in the core engine — they are in **process hygiene and a few latent runtime gaps**:

- CI does **not lint the bulk of the web app** (only `app/`, not `features/`).
- There is **no test coverage measurement** and **no formatting gate** in CI.
- A couple of **latent runtime bugs** exist that don't bite today only because content is a single non-progressing beat (duplicate world-event IDs on repeated consequence application; no beat progression).
- **Documentation has sprawled** (README 2,331 lines, FULL_CURSOR 10,288 lines) and **status is duplicated across 3+ files**, which has already caused visible drift.

None of these are blockers for the Phase 1 gate. They are the right things to tidy **now**, before Phase 2 (AI Director) adds non-determinism and more moving parts.

### Scorecard

| Area                                  | Grade  | One-line assessment                                            |
| ------------------------------------- | :----: | -------------------------------------------------------------- |
| Architecture & separation of concerns |   A    | Clean package/module boundaries; single mutation path          |
| Schema design (Zod)                   |   A    | Consistent, typed, well-defaulted, good ID discipline          |
| Cross-file validation                 |   A    | Reference/dup/reachability/dead-end checks are excellent       |
| Deterministic runtime                 |   A−   | Solid; minor latent bugs around repeated application           |
| Test suite                            |   B+   | Broad and meaningful; missing coverage metrics + a few gaps    |
| CI / tooling                          |   B−   | Good baseline; **web lint gap**, no coverage, no format gate   |
| Web app                               |   B+   | Clean, accessible, read-only panels; beat progression deferred |
| AI package                            |   B    | Good contracts; placeholders only, untyped request context     |
| Docs & tracker                        |   B−   | Excellent discipline but heavy sprawl + status duplication     |
| **Overall**                           | **A−** | **Healthy foundation; tighten process before Phase 2**         |

---

## 2. What's working well (keep doing this)

1. **Schema-first, everything validated.** Every contract is a Zod schema with `parseX`/`safeParseX` helpers and an inferred type. IDs are centrally constrained to `lowercase_snake_case` (`packages/core/src/schemas/ids.ts`). This is exactly the right backbone.
2. **Single deterministic mutation path.** All ledger changes flow through `applyConsequenceEngine` → `applyConsequenceToLedger`. No feature mutates the ledger directly, including the web app (it calls runtime only). This is the most important architectural property in the repo and it's intact.
3. **The cross-file validator is a standout.** `validateWorldDefinition.ts` does duplicate-ID detection, reference integrity, flag-known checks, **flag-fixpoint reachability**, and **dead-end detection**. This is well beyond what most prototypes have and will pay off massively when AI starts generating worlds.
4. **Debug trace is a first-class model.** Typed event builders (`buildDebugEvents.ts`) plus `appendValidationFailure` give real traceability, and the runtime emits `session_loaded` / `choice_selected` / `consequence_applied` / `flags_changed` / `goal_unlocked` / `validation_failed`.
5. **Flag lifecycle is documented and centralized.** `flagLifecycle.ts` + `docs/flag-lifecycle.md`, with gate helpers shared by beats, choices, and consequences. The `system_`/`external_` exempt-flag convention is a nice touch.
6. **Subpath package exports.** `@playable-worlds/core/{runtime,session,story,consequence,ledger,world,schemas}` keep imports intentional.
7. **Process discipline.** Phase gating, a decision log, a session handoff doc, and a richly-columned step tracker. This is unusually mature for a prototype and is worth protecting.
8. **Failure-as-data.** Loaders and validators return `{ ok, errors }` rather than throwing; the engine returns a traced session even on failure. Predictable and testable.

---

## 3. Weaknesses, risks & issues

Severity: **[High]** = fix before Phase 2 · **[Medium]** = fix soon · **[Low]** = opportunistic/cleanup.

### 3.1 Tooling & CI

- **[High] Web lint coverage gap.** `apps/web/package.json` → `"lint": "eslint app --max-warnings 0"`. This lints **only `app/`**. The entire `features/` tree (`WorldPlayScreen`, `WorldLedgerPanel`, `DebugTracePanel`, `worldPlayRuntime`) and `tests/` are **never linted in CI**. Most of the web logic is effectively unlinted.
  - **Fix:** `"lint": "eslint app features tests --max-warnings 0"` (or migrate to a single flat config that globs the workspace).
- **[Medium] No test-coverage measurement.** `vitest.config.ts` has no `coverage` block and there's no `@vitest/coverage-v8`. You can't see what 258 tests actually exercise, or guard against regressions in coverage.
  - **Fix:** add `@vitest/coverage-v8`, a `test:coverage` script, and (optionally) modest thresholds. Print coverage in CI.
- **[Medium] Formatting is configured but not enforced.** `format:check` exists in root `package.json` but CI (`.github/workflows/ci.yml`) never runs it. Prettier drift won't fail a build.
  - **Fix:** add `- run: npm run format:check` to CI.
- **[Low] CI is single-Node (20).** `engines.node >= 20` is fine; consider a 20/22 matrix once the project stabilizes. Not urgent.

### 3.2 Core engine — latent runtime bugs

- **[Medium] Duplicate `worldEvents` IDs on repeated consequence application.** `applyConsequenceToLedger.ts` derives `eventId = "event_" + consequence.id.replace(/^consequence_/, "")`. If the same consequence is applied more than once (which is currently _possible_ — see next item), two `WorldEvent`s share the same `id`. `WorldLedgerSchema` does **not** enforce world-event ID uniqueness, so this passes validation silently.
  - **Fix:** make event IDs unique, e.g. `event_<id>_t<turnNumber>` or append an incrementing index. Add a regression test that applies a consequence twice and asserts unique event IDs.
- **[Medium] No beat progression → choices are infinitely re-applicable.** The Stonepass start beat `beat_ogre_bridge` has **no `blockedByFlags`**, so `selectStoryBeat` keeps returning it after a choice. In the browser you can click "Fight the ogre" repeatedly: each click increments `turnNumber`, re-applies the consequence, and appends another (duplicate-ID) world event. This is the documented "beat progression deferred" gap, but today it manifests as a _re-application_ bug, not just a missing feature.
  - **Fix (content-first, smallest):** give the bridge beat a retirement gate (e.g. `blockedByFlags: ["bridge_open"]`) and add follow-up beats keyed off the outcome flags, OR
  - **Fix (engine guard):** in the engine/runtime, reject (or no-op with a `validation_failed`) a consequence whose effects are already fully present, or guard against re-applying a consequence that the current beat has already resolved this turn.
  - Either way: **add a test for "apply same choice twice"** so the intended behavior is pinned.
- **[Low] `isExemptFlag` is duplicated.** Defined in both `ledger/flagLifecycle.ts` and `validators/validateWorldDefinition.ts` (line 12). They agree today; they will drift eventually.
  - **Fix:** import the single implementation from `flagLifecycle.ts` into the validator.

### 3.3 Persistence readiness

- **[Medium] No serialization round-trip test for `WorldSession`.** `WorldSession` is explicitly the save-state, and persistence is a near-future phase. There is no test proving `JSON.parse(JSON.stringify(session))` re-parses cleanly through `WorldSessionSchema` (including `debugEvents` and `metadata` records).
  - **Fix:** add a small round-trip test now; it's cheap insurance before the persistence phase.

### 3.4 AI package (Phase 2 prerequisites)

- **[Low/Medium] `AIRequest.context` is untyped** (`z.record(z.unknown())`), already flagged by its own `TODO(Phase 2)`. Before the Director lands, define per-agent typed request/response schemas so provider output validation is meaningful end-to-end.
- **[Low] Gateway/agents are placeholders.** `packages/ai/src/gateway/.gitkeep` and `agents/.gitkeep` are empty. Expected at this phase, but note that **nothing currently consumes `FakeProvider`** in the runtime — the wiring is the substance of W4-S1.
- **[Low] Safety mode is modeled but unenforced.** `SafetyMode` (teen/adult) exists in `WorldDNA` but no runtime path enforces it. This becomes important the moment AI generates content. Plan where safety gating lives (likely in the gateway/Director validation step).

### 3.5 Web app

- **[Low] Beat progression / "what happens next" is not shown.** Functionally tied to §3.2. Once beats advance, the play screen should reflect the new beat rather than re-rendering the same one.
- **[Low] `parseAndValidateWorldDefinition` runs on every `/play` request.** `loadStonepassWorld()` re-reads and re-validates the JSON from disk per request. Fine for a prototype; consider memoizing once content grows or if it ever hits a hot path.
- **[Low] No error boundary / loading state beyond the load-failure branch.** Acceptable now; revisit when sessions become async (persistence).

### 3.6 Documentation & tracker

- **[Medium] Documentation sprawl.** `README.md` is **2,331 lines** and `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md` is **10,288 lines**, alongside `AGENT_SESSION_HANDOFF.md`, `docs/` (3 files), two package READMEs, and **20 `Future_Features/` specs**. Onboarding signal is diluted; the README tries to be both a landing page and a spec.
  - **Fix:** make the README a short landing page (what it is, how to run, where the canonical docs live) and push detail into the existing dedicated docs. Keep FULL_CURSOR as the spec-of-record.
- **[Medium] Status is duplicated across files and has already drifted.** Phase/step status lives in the tracker CSV **and** the README **and** the handoff doc. The README still contains a stale line (`Status: … Next: W3-S1`) even though the project is at the end of Phase 1. Three copies of the truth = guaranteed drift.
  - **Fix:** designate the **CSV as the single source of truth** for step status; have README/handoff link to it and stop restating per-step status, or generate the summary table from the CSV.
- **[Low] No `LICENSE` file.** Repo is private, so this may be intentional — but it's worth an explicit decision (especially before any sharing/showcase phase).
- **[Low] Two near-identical decision logs.** `docs/decision-log.md` and `AGENT_SESSION_HANDOFF.md §10` both track human decisions. Pick one as canonical and link the other.

---

## 4. Prioritized recommendations

### Do now (before starting W4-S1 / Phase 2)

These are small, mechanical, and de-risk everything that follows.

1. **Fix the web lint scope** so `features/` and `tests/` are linted in CI. _(~5 min, High value)_
2. **Add `format:check` to CI.** _(~2 min)_
3. **Add coverage tooling** (`@vitest/coverage-v8` + `test:coverage` script). Don't gate on a threshold yet — just get visibility. _(~15 min)_
4. **Make world-event IDs unique** and add a "apply same consequence twice" regression test. _(~20 min, prevents a real bug)_
5. **Decide & document beat-progression behavior** (content gate vs. engine guard) and pin it with a test — even if the decision is "intentionally re-applicable for now." _(~30 min)_
6. **De-duplicate `isExemptFlag`.** _(~5 min)_
7. **Add a `WorldSession` JSON round-trip test.** _(~15 min)_

### Do soon (early Phase 2)

8. **Type `AIRequest.context` per agent** and define Director request/response schemas before wiring the gateway.
9. **Decide where SafetyMode is enforced** and add a failing-path test (e.g., adult content rejected under teen mode).
10. **Trim the README** to a landing page; move spec detail into the dedicated docs.
11. **Designate the CSV as the single status source**; remove restated status from README/handoff.

### Do later (opportunistic)

12. Memoize world load/validation in the web layer once content grows.
13. Consider a Node version matrix in CI.
14. Add a `LICENSE` decision.
15. Consider a tiny `scripts/validate-content.ts` CLI (already noted as "not created yet" in the README) so authored/generated worlds can be validated outside tests.

---

## 5. Concrete change checklist

Copy-pasteable task list for the human operator / next agent. None of these change Phase 1 behavior.

- [ ] `apps/web/package.json`: `"lint": "eslint app features tests --max-warnings 0"`
- [ ] `.github/workflows/ci.yml`: add `- run: npm run format:check`
- [ ] Add dev dep `@vitest/coverage-v8`; add root script `"test:coverage": "vitest run --coverage"`; add a `coverage` block to `vitest.config.ts`
- [ ] `packages/core/src/consequence/applyConsequenceToLedger.ts`: make `eventId` unique (include `turnNumber`)
- [ ] New test: `packages/core/tests/integration/repeatedConsequence.test.ts` — apply a choice twice, assert unique world-event IDs and intended turn/flag behavior
- [ ] Decide beat progression: either add `blockedByFlags`/follow-up beats in `stonepass-valley.world.json`, or add an engine guard; pin with a test
- [ ] `packages/core/src/validators/validateWorldDefinition.ts`: import `isExemptFlag` from `../ledger/flagLifecycle.js` instead of re-declaring
- [ ] New test: `WorldSession` JSON serialize → parse round-trip (incl. `debugEvents`)
- [ ] `packages/ai/src/contracts/aiRequest.ts`: replace `context: z.record(z.unknown())` with typed per-agent context (Phase 2)
- [ ] README.md: reduce to landing page; link to FULL_CURSOR / handoff / tracker for detail
- [ ] Remove restated per-step status from README/handoff; point to the CSV
- [ ] Decide on `LICENSE`
- [ ] Pick one canonical decision log (`docs/decision-log.md` **or** handoff §10)

---

## 6. Phase 2 (AI Director) readiness notes

The foundation is ready for the Director, with these caveats baked into the plan:

- **The engine already owns truth.** `DirectorDecision` is schema-validated, and the runtime never lets non-engine code mutate the ledger. The gateway should return `AIResult<DirectorDecision>` and the engine should _act on_ validated decisions only — keep that boundary strict.
- **Determinism vs. AI:** `AIRequest.generationSeed` and `FakeProvider` already enable deterministic tests. Make sure every Director test runs through `FakeProvider` so CI stays deterministic and offline (no real keys, per `.env.example`).
- **Beat selection is the natural first Director action** (`select_next_beat`) — but it depends on **beat progression actually working** (§3.2). Resolve that first or the Director will operate on a world that never advances.
- **Safety:** wire `SafetyMode` enforcement into the gateway/validation step now, while there's only one consumer.

---

## 7. Appendix — notable file-level observations

| File                                                            | Note                                                                                    |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/web/package.json`                                         | Lint scope limited to `app/` — **highest-value fix**                                    |
| `packages/core/src/consequence/applyConsequenceToLedger.ts`     | Non-unique `event_<id>` IDs on re-apply                                                 |
| `packages/content/worlds/stonepass/stonepass-valley.world.json` | Start beat has no `blockedByFlags` → never retires                                      |
| `packages/core/src/validators/validateWorldDefinition.ts`       | Excellent validator; duplicates `isExemptFlag` (line 12)                                |
| `packages/ai/src/contracts/aiRequest.ts`                        | Untyped `context`; self-flagged `TODO(Phase 2)`                                         |
| `packages/core/src/schemas/worldSession.ts`                     | Save-state model is clean; add round-trip test                                          |
| `vitest.config.ts`                                              | No coverage config                                                                      |
| `.github/workflows/ci.yml`                                      | Solid, but no `format:check`, no coverage                                               |
| `README.md` / `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md`         | 2.3k / 10.3k lines — sprawl + status duplication                                        |
| `packages/core/package.json`                                    | Exports `.ts` directly (no `dist`/`types`) — fine internally, not externally consumable |

---

## 8. Bottom line

You are **on track**. The architecture choices that are expensive to change later (schema-first contracts, a single deterministic mutation path, a strong validator, a typed debug trace) are all **right**. The work remaining before Phase 2 is mostly **hygiene**: close the lint gap, add coverage and a format gate, fix two latent runtime bugs that a single non-progressing beat is currently hiding, and stop duplicating status across docs.

Knock out the **"Do now"** list (a few focused hours), and the project will be in excellent condition to take on the AI Director without inheriting avoidable debt.

---

## 9. Remediation status (2026-05-29)

The **"Do now"** checklist from §5 was implemented in the same review session:

| Item                                                       | Status |
| ---------------------------------------------------------- | ------ |
| Web lint scope (`features/`, `tests/`)                     | Done   |
| CI `format:check` + `test:coverage`                        | Done   |
| Unique world-event IDs (`_t{turnNumber}`)                  | Done   |
| Beat progression (`blockedByFlags` + `advanceSessionBeat`) | Done   |
| `isExemptFlag` de-duplicated                               | Done   |
| `WorldSession` JSON round-trip tests                       | Done   |
| Tracker as status source of truth (README/handoff links)   | Done   |
| `LICENSE` (private proprietary)                            | Done   |
| Canonical `docs/decision-log.md`                           | Done   |
| Prettier format pass (repo-wide, for CI gate)              | Done   |

**Tests after remediation:** 264 passing (42 files). Run `npm test` and `npm run test:coverage` locally to confirm.
