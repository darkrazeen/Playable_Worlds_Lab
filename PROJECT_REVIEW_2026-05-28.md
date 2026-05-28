# Playable Worlds Lab — Full Project Review

**Date:** 2026-05-28 (initial review, post W1-S16)
**Remediation completed:** 2026-05-28 (Passes A, B, C from §10)
**Reviewer:** AI Code Review (Claude Opus 4.7)
**Project state:** **Phase 0 complete (16 / 16 steps).** **167 tests** passing across **18 test files**. Next approved step: **W2-S1 — World JSON loader.**

**Remediation summary:** Documentation reconciled; ID naming enforced; validator/loader error model unified; CI + workspace lint added; `docs/` and package READMEs created; Phase 1/2 directory stubs in place. **W2-S1 loader not yet implemented.**

**Reference documents reviewed:**

- `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md` (source of truth)
- `AGENT_SESSION_HANDOFF.md`
- `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv`
- `README.md`
- `Future_Features/README.md`, `Future_Features/Quest_Generation.md`
- All source under `packages/core/`, `packages/ai/`, `packages/content/`, `apps/web/`
- Tooling: root `package.json`, `tsconfig.base.json`, `vitest.config.ts`, `.prettierrc`, `.env.example`, `.gitignore`, `.nvmrc`
- All tests (`tests/`, `packages/*/tests/`)
- The canonical Stonepass world JSON and the invalid fixture

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Project Status](#2-current-project-status)
3. [Architecture Review](#3-architecture-review)
4. [Code Quality Review](#4-code-quality-review)
5. [Documentation Review](#5-documentation-review)
6. [Testing Review](#6-testing-review)
7. [Tooling and CI/CD Review](#7-tooling-and-cicd-review)
8. [Content Review (Stonepass)](#8-content-review-stonepass)
9. [Consolidated Issues and Weaknesses](#9-consolidated-issues-and-weaknesses)
10. [Recommended Updates / Changes / Additions](#10-recommended-updates--changes--additions)
11. [Future Feature Suggestions](#11-future-feature-suggestions)
12. [Risk Assessment](#12-risk-assessment)
13. [Summary Scorecard](#13-summary-scorecard)
14. [Remediation Log (2026-05-28)](#14-remediation-log-2026-05-28)

---

## 1. Executive Summary

The project is in **excellent structural health** at the end of Phase 0. The schema-first discipline is real, the AI governance model is enforced by code rather than just by convention, and the canonical Stonepass world JSON passes both Zod and the cross-file validator end-to-end.

**Initial review (morning):** The main gaps were documentation drift (README/handoff/FULL_CURSOR §22), several medium-priority code issues (ID naming, inconsistent `parseAndValidateWorldDefinition` errors, no `schemaVersion` gate), and thin tooling (lint limited to web, no CI).

**After remediation (same day):** Passes A, B, and C from §10 are **complete**. Documentation is reconciled with `Last reconciled` stamps. Code hygiene items C-1, C-2, C-3, C-5 (documented), C-6, C-8 (TODO), E-1, E-2, E-3, T-1, T-2, D-1–D-8, CT-1, CT-2, A-1, A-3, A-7 are **done**. Verification: **167 tests**, `typecheck` and **workspace lint** green; `.github/workflows/ci.yml` added (first green run on GitHub not yet confirmed in this session).

**Remaining before Phase 1 feels “done”:** **W2-S1 world JSON loader** (the actual next step), optional `validate-worlds` CLI, example-JSON sweep test (T-6), coverage tooling (T-5), and Phase 2 items (C-4, C-7, typed AI contexts, migrations).

**Honest bottom line:** The repo crossed from “strong Phase 0 with cleanup debt” to **ready to implement W2-S1**. Architecture was never the blocker; the review’s own Pass A/B/C work removed the friction that would have confused the next agent or broken the loader contract.

---

## 2. Current Project Status

### 2.1 What is complete

| Area | Status | Evidence |
| --- | --- | --- |
| Repo skeleton (W1-S1) | Complete | npm workspaces, Next.js 15, Tailwind, Vitest, ESLint, Prettier |
| All 13 Phase 0 schemas (W1-S2 → W1-S13) | Complete | `packages/core/src/schemas/*.ts` (14 files) |
| Cross-file validator (W1-S14) | Complete | `validateWorldDefinition.ts` — refs, duplicates, flag fixpoint, dead-ends, reachability |
| Debug helper (W1-S12 / W1-S14) | Complete | `packages/core/src/debug/appendDebugEvent.ts` (immutable append) |
| Canonical Stonepass world (W1-S15) | Complete | `packages/content/worlds/stonepass/stonepass-valley.world.json` |
| Invalid Stonepass fixture (W1-S15) | Complete | `packages/content/examples/world-definition-stonepass-invalid.example.json` |
| AIProvider + AIRequest + FakeProvider (W1-S16) | Complete | `packages/ai/src/contracts/*`, `packages/ai/src/providers/fakeProvider.ts` |
| Review remediation (Passes A–C) | Complete | Docs, IDs, validator, CI, lint all workspaces, `docs/`, package READMEs |
| Verification | Green | `npm test` → **167 passed (18 files)**; `npm run typecheck` → pass; `npm run lint` → pass (all workspaces) |

### 2.2 What is next

| Step | Phase | Name | Status |
| --- | --- | --- | --- |
| **W2-S1** | Phase 1 — Text Runtime | Build world JSON loader | **Next ← approved** |
| W2-S2 | Phase 1 | Initialize WorldSession | Not started |
| W2-S3 | Phase 1 | Story beat selector | Not started |
| W2-S4 | Phase 1 | Choice resolver | Not started |
| W2-S5 | Phase 1 | Apply first consequence | Not started |
| W2-S6 | Phase 1 | Text play screen | Not started |
| W2-S7 | Phase 1 | Manual Stonepass path tests | Not started |

---

## 3. Architecture Review

### 3.1 What is working very well

**Schema-first design is real, not aspirational.** Every data contract has a Zod schema, derived `z.infer` type, and `parse*` / `safeParse*` helpers. Types and runtime validation cannot drift apart because both come from the same source.

**The "AI proposes → validators check → engine executes" mantra is enforced by code, not just docs.** `AIResultOf<T>` requires a typed value, and `FakeProvider.generateStructured` re-parses both the inner value and the wrapper through `createAIResultSchema(schema).parse(...)`. There is no exit path that returns unvalidated model output.

**Cross-file validator is sophisticated.** `validateWorldDefinition.ts` implements a flag-fixpoint algorithm: it expands the achievable flag set by repeatedly applying every accessible choice's consequence until the set stabilizes, then reports unreachable non-hidden, non-ending beats and dead-end beats. This is correctness work that most projects of this stage skip.

**Package boundaries are clean.**

- `@playable-worlds/core` — schemas, validators, debug helpers, no AI, no HTTP, no DB
- `@playable-worlds/ai` — AI contracts and providers, depends only on `core`
- `@playable-worlds/content` — world data only, no logic
- `@playable-worlds/web` — placeholder UI, no game logic yet

**Versioned contract.** `schemaVersion: "0.2.0"` is a required field on `WorldDefinition` and `WorldSession`. The v4.2 hybrid contract is documented as the conflict resolution authority (`§22` in `FULL_CURSOR`). The repo already implements all v4.2 renames.

**Immutable update patterns are honored.** `appendDebugEvent` returns a new `WorldSession` rather than mutating. The same pattern should be enforced as Phase 1 runtime functions are added (consequence engine, choice resolver, beat selector).

### 3.2 Structural concerns

| Concern | Status (post-remediation) |
| --- | --- |
| `packages/ai` missing `gateway/` + `agents/` | **Resolved** — stub dirs at `packages/ai/src/gateway/`, `agents/` |
| `packages/content` no `loadWorld()` API | **Open** — W2-S1; `src/index.ts` still exports constant only |
| No `docs/` directory | **Resolved** — `docs/source-priority.md`, `content-safety-rules.md`, `decision-log.md` |
| `apps/web` no `features/` scaffolding | **Resolved** — `apps/web/features/.gitkeep` |
| No `migrations/` directory | **Open** — defer until `schemaVersion` bumps past `0.2.0` |
| Web app does not import workspace packages | **Open** — document `transpilePackages` before W2-S6 (`apps/web/README.md` notes this) |
| No `packages/core/src/world/` loader | **Open** — **W2-S1** deliverable |

---

## 4. Code Quality Review

This section catalogs concrete code issues with file references and severity. Severity is project-aware: a `Medium` here is something that will hurt Phase 1 / 2 work; a `Low` is opportunistic cleanup.

### 4.1 Strengths

- All schemas use `default([])` on optional arrays — partial JSON parses cleanly, no `?? []` boilerplate at call sites.
- `createEmptyWorldLedger()` and `createWorldSession()` factories prevent callers from re-deriving defaults.
- `createAIResultSchema<T>(valueSchema)` is a clean generic for typed AI output; `FakeProvider` uses it as the return-shape validator, which means even buggy provider code cannot return a malformed `AIResultOf<T>` without throwing.
- `isExemptFlag` (`system_` / `external_` prefix) is a clean escape hatch documented in `FULL_CURSOR §11`.
- ESM is honored consistently: `"type": "module"`, `.js` import suffixes, `moduleResolution: "bundler"`.
- **`EntityIdSchema` / `NamedIdSchema`** (`packages/core/src/schemas/ids.ts`) enforce `lowercase_snake_case` across flags, beats, consequences, sessions, etc.
- **`parseAndValidateWorldDefinition`** returns a single `{ ok, errors }` shape for schema and graph failures.
- **`SUPPORTED_SCHEMA_VERSIONS`** gates unsupported world files at validation time.

### 4.2 Issues found (original audit → remediation status)

#### C-1 — `FlagIdSchema` has no naming convention (MEDIUM) — **FIXED**

**File:** `packages/core/src/schemas/playerChoice.ts:4`

```ts
export const FlagIdSchema = z.string().min(1);
```

Any non-empty string is a valid flag ID. Two AI-generated worlds could use `"landslide_triggered"` and `"Landslide Triggered"` (or `"landslide-triggered"`) and they would be considered different flags by the validator, even though they semantically mean the same thing.

**Fix:**

```ts
export const FlagIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9_]*$/, "Flag IDs must be lowercase_snake_case starting with a letter");
```

Apply consistently to `GoalIdSchema`, `LocationIdSchema`, `NpcIdSchema`, `WorldEventIdSchema`, `DebugEventIdSchema`, `TemporaryInstanceIdSchema`, `WorldIdSchema`, `StoryBeatIdSchema`, `ChoiceIdSchema`. (Choice and beat IDs may want a slightly wider rule like `^[a-z][a-z0-9_-]*$` if you prefer kebab-case for some.) The earlier this lands, the fewer authored worlds need to be rewritten later.

#### C-2 — `parseAndValidateWorldDefinition` throws on Zod failure but returns on cross-file failure (MEDIUM) — **FIXED**

**File:** `packages/core/src/validators/validateWorldDefinition.ts:289-296`

```ts
export function parseAndValidateWorldDefinition(input: unknown): WorldValidationResult & {
  world?: WorldDefinition;
} {
  const parsed = parseWorldDefinition(input);          // throws ZodError on failure
  const validation = validateWorldDefinition(parsed);
  return { ...validation, world: parsed };
}
```

The function's return type implies a typed result, but callers receive `ZodError` exceptions on shape failures and `{ ok: false, errors: [...] }` on graph failures. The loader (W2-S1) will need a consistent error model.

**Fix:** Catch `ZodError`, convert each issue to a string, and return `{ ok: false, errors: [...] }`. Two implementation options:

```ts
import { ZodError } from "zod";

export function parseAndValidateWorldDefinition(input: unknown):
  WorldValidationResult & { world?: WorldDefinition } {
  const parseResult = WorldDefinitionSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      ok: false,
      errors: parseResult.error.issues.map((i) =>
        `schema: ${i.path.join(".") || "<root>"}: ${i.message}`),
    };
  }
  const validation = validateWorldDefinition(parseResult.data);
  return { ...validation, world: parseResult.data };
}
```

#### C-3 — `validateWorldDefinition` does not check `schemaVersion` (MEDIUM) — **FIXED**

**File:** `packages/core/src/validators/validateWorldDefinition.ts` (entire file)

`SchemaVersionSchema` (`packages/core/src/schemas/schemaVersion.ts:6`) accepts any non-empty string. The validator never compares `world.schemaVersion` to `CURRENT_SCHEMA_VERSION`. A world claiming `schemaVersion: "0.1.0"` or `"99.0.0"` parses and validates.

**Fix:** Add a soft-warning or hard-error rule:

```ts
const SUPPORTED_SCHEMA_VERSIONS = new Set(["0.2.0"]);
if (!SUPPORTED_SCHEMA_VERSIONS.has(world.schemaVersion)) {
  errors.push(
    `schemaVersion: "${world.schemaVersion}" is not in supported set (${[...SUPPORTED_SCHEMA_VERSIONS].join(", ")})`,
  );
}
```

This is also where the future migration utility will hook in.

#### C-4 — Validator does not verify consequence ↔ temporary-instance flag handshake (LOW) — **OPEN**

**File:** `packages/core/src/validators/validateWorldDefinition.ts:189-205`

A consequence may reference `temporaryInstances: ["instance_hidden_cave"]` while never adding `landslide_triggered` (the cave's required entry flag). The reachability fixpoint will eventually catch the missing flag if no other consequence produces it, but an authored world with one consequence that "starts" an instance it can never legally open is silently accepted.

**Fix (optional, can defer to W6 Health Score):** For each `consequence` that lists `temporaryInstances`, confirm that for at least one of those instances, the consequence's `addFlags` includes one of `instance.requiredEntryFlags`, OR another consequence in the world produces those flags before the linking consequence becomes reachable.

#### C-5 — Dead-end detection uses the union of all achievable flags (LOW, design choice) — **DOCUMENTED**

**File:** `packages/core/src/validators/validateWorldDefinition.ts:271-284`

```ts
for (const beatId of reachableBeatIds) {
  const beat = beatById.get(beatId);
  if (!beat || beat.isEnding) continue;
  const hasPlayableChoice = beat.availableChoices.some((_, choiceIndex) =>
    choiceAccessible(beat, choiceIndex, flagUnion),   // ← full union
  );
  ...
}
```

`flagUnion` accumulates every flag any branch can produce. A beat whose only playable choice requires `flag_from_dead_branch` is marked playable here even if the player who actually reaches it never has that flag.

**Fix:** Document the approximation in a JSDoc on `validateWorldDefinition`. A more precise per-path simulation belongs in the W11 AI Playtester deterministic path runner.

#### C-6 — `createWorldSession` accepts any `startingBeatId` string (LOW) — **FIXED** (Option B)

**File:** `packages/core/src/schemas/worldSession.ts:50-62`

The factory takes raw strings and never sees the world. If a Phase 1 caller forgets to validate first, the session points at a nonexistent beat.

**Fix (Option A, lightweight):** Add a JSDoc note: "Caller must pass a `startingBeatId` from a previously validated `WorldDefinition`."

**Fix (Option B, stronger):** Add an overload:

```ts
export function createWorldSession(input: CreateWorldSessionInput, world?: WorldDefinition): WorldSession {
  if (world && !world.storyBeats.some((b) => b.id === input.startingBeatId)) {
    throw new Error(`startingBeatId "${input.startingBeatId}" not found in world "${world.id}"`);
  }
  // ...rest unchanged
}
```

Phase 1 W2-S2 should adopt Option B.

#### C-7 — `WorldEventTypeSchema` is too coarse compared to `DebugEventTypeSchema` (LOW) — **OPEN**

**Files:** `packages/core/src/schemas/worldLedger.ts:9-17` vs `packages/core/src/schemas/debugEvent.ts:5-15`

```ts
WorldEventTypeSchema  = "choice" | "consequence" | "flag" | "goal" | "instance" | "ai" | "system"
DebugEventTypeSchema  = "choice_selected" | "consequence_applied" | "flags_changed"
                       | "goal_unlocked"  | "ai_suggestion" | "fallback_used"
                       | "validation_failed" | "session_loaded" | "session_saved"
```

The ledger's `"ai"` collapses all AI events into one bucket, which makes downstream filtering harder than it needs to be. When runtime starts writing to the ledger (Phase 1+), it will likely want at least `"ai_suggestion"` and `"validation_failed"` as separate event types.

**Fix:** Either expand `WorldEventTypeSchema` to include `"ai_suggestion" | "fallback_used" | "validation_failed"`, or document the convention that the ledger uses coarse categories while the debug log uses fine-grained ones.

#### C-8 — `AIRequest.context` is `z.record(z.unknown())` (LOW) — **PARTIAL** (TODO in source; typed contexts deferred to Phase 2)

**File:** `packages/ai/src/contracts/aiRequest.ts:6`

`context` is an unstructured bag. Once `DirectorAgent`, `NPCReactionAgent`, and `WorldArchitectAgent` ship, each will pass different context shapes (a `WorldSession` summary, an NPC profile, a `WorldDNA` blob). An undisciplined free-form `context` is the path of least resistance toward contract drift.

**Fix:** Introduce per-agent typed request schemas in Phase 2 (e.g., `DirectorRequestContextSchema`) and have each agent extend `AIRequestSchema` with `.extend({ context: DirectorRequestContextSchema })`. Mark a TODO on the current contract.

#### C-9 — Mixed import-path styles (very minor) — **OPEN**

**Files:** `packages/core/src/schemas/worldSession.ts:4-5`

```ts
import { TemporaryInstanceIdSchema } from "./consequence.js";
import { TemporaryInstanceRoomIdSchema } from "./temporaryInstance.js";
```

`TemporaryInstanceIdSchema` lives in `temporaryInstance.ts` semantically; pulling it from `consequence.ts` is correct but reads as a layering smell because `consequence.ts` re-exports the ID. Not a bug; just consider moving the ID schemas closer to their owning entity, or add ESLint `import/order` rules.

#### C-10 — `index.ts` re-export lists are getting long and unsorted (very minor) — **OPEN**

**File:** `packages/core/src/schemas/index.ts`

The file is correct and exhaustive. As more schemas land, drift will start (alphabetical, recency, grouped, ungrouped). Worth applying `import/order` + `sort-keys` ESLint rules once `packages/core` is linted (see Issue E-1 in §7).

---

## 5. Documentation Review

The documentation suite (FULL_CURSOR, step tracker CSV, handoff, Future_Features) is the project's strongest unique asset.

**Post-remediation:** P0 drift (D-1–D-5) is **resolved**. `README.md` and `AGENT_SESSION_HANDOFF.md` carry `Last reconciled: 2026-05-28`. Standalone `docs/` mirrors source-priority, safety rules, and decision log. Per-package READMEs and `packages/content/examples/README.md` reduce handoff duplication.

**Remaining doc risk:** Step tracker CSV rows for W2-S1+ still need updating as Phase 1 steps complete — same process discipline as Phase 0.

### 5.1 Strengths

- `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md` is a genuine source of truth. Step cards are detailed enough to onboard a new agent.
- The step tracker CSV's five documentation columns (`Completion Evidence`, `Implementation Added Changed`, `Project Relevance`, `Future Features Impact`, `Tests And Verification`) are filled in for every complete step.
- `Future_Features/Quest_Generation.md` is rare for a project at this stage — it preserves design intent for unimplemented features without forcing them into the step tracker.
- `AGENT_SESSION_HANDOFF.md §1` source-priority table is a clear escape hatch when documents conflict.

### 5.2 Stale documentation (P0 — **resolved 2026-05-28**)

#### D-1 — `README.md` is six steps behind reality — **FIXED**

**File:** `README.md:62, 78, 94, 116, 118`

| Line | Says | Reality |
| --- | --- | --- |
| 62 | "Phase 0 / W1-S1–S10 complete" | Phase 0 complete (W1-S1 through W1-S16) |
| 78 | "next step W1-S11" | next step W2-S1 |
| 94 | "W1-S11 … W1-S16 \| Not started" | All Done |
| 116 | "W1-S10 done when (met)..." (last in table) | Should list W1-S11–S16 done conditions |
| 118 | "**Next step:** W1-S11 — Create WorldSession schema" | Should be W2-S1 — Build world JSON loader |

**Fix:** Update the table to mark W1-S11..W1-S16 as Done, add done-when blurbs for the missing rows (or replace with a summary), and change "next step" to W2-S1.

#### D-2 — `AGENT_SESSION_HANDOFF.md` is half-updated — **FIXED**

The top header (Section 3) was updated to "16/16, Phase 0 gate complete." Sections below were not. Specifically:

| Section | Issue |
| --- | --- |
| Header line 5 | "Purpose: ... work completed through Phase 0 W1-S14, and the next approved step." → should say "through W1-S16" |
| §4 heading | "Work completed (cumulative **through W1-S14**)" → through W1-S16 |
| §4.5 final bullet | "**Not yet:** canonical full Stonepass world ... W1-S15. The minimal example is a composition demo, not the production world file." → W1-S15 done; production file at `worlds/stonepass/stonepass-valley.world.json` |
| §4.7 | "`npm test  # 142 tests passing (15 test files)`" → 150 tests, 17 files |
| §6 layout | "`ai/  # Stub — W1-S16 FakeProvider goes here`" → `ai/` now has `contracts/aiRequest.ts`, `contracts/aiProvider.ts`, `providers/fakeProvider.ts`, `tests/unit/providers/fakeProvider.test.ts` |
| §8 | Entire section is "Next step: W1-S15 — Stonepass Valley world JSON" with W1-S15 deliverables → replace with W2-S1 (world JSON loader) deliverables |
| §12.3, §12.4 | "W1-S15 step card... row W1-S15 (`Next`)" → W2-S1 step card, row W2-S1 (Next) |
| §13 | "DirectorDecision → AIResult<T> → FakeProvider (**W1-S16, next after Stonepass JSON**)" → W1-S16 is Done; the next layer is the loader |

**Fix:** Rewrite Sections 4, 6, 7, 8, 12, 13 in one pass so the handoff is internally consistent. Section 4.5 should also add the `world-definition-stonepass-invalid.example.json` to the examples table.

#### D-3 — `FULL_CURSOR.md §22` mini-table is stale — **FIXED**

**File:** `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md:8670-8684`

The table at the bottom of §22 ("Implementation progress (Phase 0)") ends at:

```
| W1-S15 Stonepass JSON | Next |
```

It does not mention W1-S16, and W1-S15 is marked `Next` instead of `Done`.

**Fix:** Add rows for W1-S15 (Done) and W1-S16 (Done). Note that the next step is W2-S1.

#### D-4 — `Future_Features/Quest_Generation.md` has a dead link — **FIXED**

**File:** `Future_Features/Quest_Generation.md:15`

```
- [PROJECT_CONTEXT_Playable_Worlds_Lab.md](../PROJECT_CONTEXT_Playable_Worlds_Lab.md) — Cursor/agent rules
```

No such file exists in the repo.

**Fix:** Replace with a link to `AGENT_SESSION_HANDOFF.md`, or remove the entry.

#### D-5 — `Future_Features/Quest_Generation.md` example JSON uses LEGACY v4.1 field names — **FIXED**

**File:** `Future_Features/Quest_Generation.md:572-579`

```json
"temporaryInstance": {
  "id": "instance_mosswood_trail",
  "title": "Mosswood Trail",
  "entranceConditionFlags": ["quest_mosswood_active"],   // ← legacy
  "completionCondition": "found_satchel",
  "exitConsequenceId": "consequence_mosswood_complete",  // ← legacy
  "cleanupBehavior": "seal"
}
```

Per `FULL_CURSOR §22`, these are renamed in v4.2 to `requiredEntryFlags` and `completionConsequenceId`. A future implementer following this example would author a contract-violating quest.

**Fix:** Update the example to v4.2 names and add `entranceText`, `rooms`, and `type` (currently missing required fields).

### 5.3 Other documentation gaps

#### D-6 — No `docs/` directory — **FIXED**

#### D-7 — No README in `packages/core`, `packages/ai`, or `packages/content` — **FIXED**

#### D-8 — `apps/web/README.md` is create-next-app boilerplate — **FIXED**

---

## 6. Testing Review

### 6.1 Strengths

- **167 tests passing** in 18 files (was 150 / 17 at initial review). Test files mirror source files 1:1 for schemas.
- Every schema has both positive (valid input parses) and negative (malformed input fails) coverage.
- `validateWorldDefinition.test.ts` covers **17 cases** including schemaVersion rejection, `parseAndValidateWorldDefinition` shape errors, starting-beat flag traps, circular flag fixpoint, and `isEnding` reachability behavior.
- `idFormat.test.ts` locks ID naming conventions.
- `stonepassWorld.test.ts` is a real content integration test — it loads the canonical JSON, runs full validation, and asserts on specific proof-chain elements (`landslide_triggered`, `dragon_awake`, `instance_hidden_cave`).
- `fakeProvider.test.ts` covers all three scenario modes (success, invalid, error) plus task-specific responses, and asserts against the real JSON example fixture.

### 6.2 Issues found

#### T-1 — No `tests/integration/` directory — **FIXED** (README placeholder; **no loader integration test yet** — lands in W2-S1)

#### T-2 — Validator test gaps — **MOSTLY FIXED**

Added: unsupported `schemaVersion`, `parseAndValidate` shape errors, starting beat blocked by flags, circular flag fixpoint, `isEnding` beats not flagged unreachable.

**Still open:** C-4 boundary (instance `requiredEntryFlags` never produced by linking consequence).

#### T-3 — No test for `createWorldSession` with invalid `startingBeatId` — **FIXED**

#### T-4 — No performance / large-world test for `validateWorldDefinition` (LOW, deferred)

The flag fixpoint is `O(beats × choices × iterations)`. For Stonepass (5 beats, 7 choices) this is microseconds. For a generated 50-beat / 100-flag world it could be tens of milliseconds. Worth establishing a baseline with a synthetic large-world fixture before Phase 5 ships generated content.

#### T-5 — No coverage tooling (LOW)

`vitest` supports `--coverage` via `@vitest/coverage-v8`. No coverage gate exists. Easy to add once the first runtime functions ship.

#### T-6 — No assertion that JSON examples in `packages/content/examples/` all parse (LOW)

There is no single test that says "every `*.example.json` in the examples folder parses against its declared schema." Individual schema tests load one or two examples, but a sweep would catch a future example added without a test.

---

## 7. Tooling and CI/CD Review

### 7.1 Strengths

- **CI workflow** at `.github/workflows/ci.yml` (typecheck, lint, test on push/PR).
- **Workspace lint:** root `eslint.config.mjs` + per-package `lint` scripts; web uses `eslint app` (not deprecated `next lint`).
- **`.editorconfig`** for editor consistency.
- npm workspaces is the right call for this stage (zero extra tooling, native to Node 20).
- `tsconfig.base.json` is strict: `strict: true`, `isolatedModules: true`, `moduleResolution: "bundler"`, ES2022.
- Vitest config is shared at the root and globs all package tests.
- Prettier config is present and `singleQuote: false` is consistent with all source files.
- `.gitignore` covers `.next/`, `dist/`, `*.tsbuildinfo`, `.env`, `.env*.local`, and `.vitest/`.

### 7.2 Issues found

#### E-1 — Lint scope is only `apps/web` (MEDIUM) — **FIXED**

**File:** `package.json:15`

```json
"lint": "npm run lint -w @playable-worlds/web"
```

The root script only lints the web app. `packages/core` (which contains every business-critical schema and the validator), `packages/ai` (which contains the FakeProvider), and `packages/content` have no ESLint configuration.

**Fix:** Add a minimal flat ESLint config at the root (or one per package) that enforces `@typescript-eslint/recommended` plus the project conventions (`import/order`, no unused imports, no any except in tests). Update the root script:

```json
"lint": "npm run lint --workspaces --if-present"
```

And add `"lint": "eslint src tests"` (or similar) to each non-web package.

#### E-2 — No CI/CD workflow (MEDIUM) — **FIXED** (workflow file added; verify badge on first push to `main`)

There is no `.github/workflows/` directory. All checks (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`) run locally only. If a future commit silently breaks one of them, nothing fails until the next manual run.

**Fix:** Add `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
```

#### E-3 — `apps/web` ESLint uses deprecated `next lint` (LOW) — **FIXED** (`eslint app`; `.next/` ignored)

Every lint run prints:

```
`next lint` is deprecated and will be removed in Next.js 16.
For new projects, use create-next-app to choose your preferred linter.
For existing projects, migrate to the ESLint CLI:
npx @next/codemod@canary next-lint-to-eslint-cli .
```

**Fix:** Run the codemod or manually migrate `apps/web/package.json`'s `lint` script to `eslint .` with the existing `apps/web/eslint.config.mjs`.

#### E-4 — `npm test` cwd-sensitivity for `examplesDir` (LOW)

**Files:** `packages/core/tests/unit/content/stonepassWorld.test.ts`, `packages/ai/tests/unit/providers/fakeProvider.test.ts`

Both files use `dirname(fileURLToPath(import.meta.url))` to compute paths to `packages/content/examples/`. This is correct, but relies on the test files staying at their current depth. A small `packages/content/src/paths.ts` exporting `examplesDir` and `worldsDir` constants would make refactors safer.

#### E-5 — `package.json` does not define a `build` script for `packages/core` (LOW)

The web app does not yet import the core packages, so this is not biting. When it does, Next.js will need `transpilePackages` (or each package will need its own `tsc` build step that emits `dist/`). Worth deciding the policy before W2-S6.

#### E-6 — No `husky` / `lint-staged` (LOW)

A pre-commit hook running `npm test` + `npm run typecheck` + `npm run lint` would catch breakage before it lands. Optional; CI is the more important gate.

#### E-7 — `vitest.config.ts` does not load `.env` files (LOW)

Once Phase 2 starts running tests that touch provider stubs, environment-controlled toggles will matter. Vitest 3 supports `env` and `loadEnv`; document a convention before W4 begins.

#### E-8 — No `.editorconfig` (LOW)

Project uses Prettier consistently, but `.editorconfig` is the one file most editors (including Cursor) honor automatically without configuration. A 10-line `.editorconfig` is cheap insurance.

---

## 8. Content Review (Stonepass)

### 8.1 Canonical world JSON

**File:** `packages/content/worlds/stonepass/stonepass-valley.world.json`

**Strengths:**

- All 5 ogre choices have distinct consequences with non-trivial summaries, visible changes, NPC updates, and goal management.
- The fight → landslide → cave → dragon proof chain is end-to-end reachable.
- Peaceful branches (trick, feed, talk, sneak) reach `beat_valley_square` via `ogre_peaceful_crossing`, which is set by exactly those four consequences and not by `consequence_fight_ogre` — meaning the fight branch correctly goes to the cave path, and peaceful branches go to the valley square path.
- The `talk` branch unlocks `goal_hear_elder_counsel` and the elder counsel beat, giving the talk path a distinct narrative payoff.
- The dragon-stirring beat is correctly marked `isEnding: true`.
- The hidden cave has a 3-room graph with `connectedRoomIds`, an encounter, and a puzzle — sufficient for Phase 3.

**Issues:**

#### CT-1 — Fight branch never reaches `beat_valley_square` or `beat_elder_counsel` (BY DESIGN) — **DOCUMENTED** (`stonepass-valley.notes.md`)

`consequence_fight_ogre` does not set `ogre_peaceful_crossing`. A fight-path player goes straight from the bridge to the cave to the dragon. The valley square and elder counsel are exclusively peaceful-path content. This is consistent with the design intent in `FULL_CURSOR` ("flagship landslide → cave → dragon path") but should be documented in a one-line comment at the top of the JSON, because the asymmetry will surprise future agents.

**Fix:** Add a leading `_designNotes` field at the JSON root, or document in a sibling `stonepass-valley.notes.md`:

```text
- Fight path: bridge → landslide → cave → dragon (ending)
- Peaceful paths (trick / feed / talk / sneak): bridge → valley square (→ elder counsel if talk)
- Cave instance unreachable on peaceful paths because landslide_triggered is never set
```

#### CT-2 — `consequence_survey_landslide` does not call `exposeLocations` (LOW, consistency) — **FIXED**

`consequence_fight_ogre` exposes the cave location; `consequence_survey_landslide` also reveals it narratively but does not set the location flag. Pick one consistent place to expose the location.

#### CT-3 — `npc_elder.knownFlags` includes `dragon_awake` but the elder is never reached after the dragon awakens (LOW)

The elder is only present on peaceful branches; the dragon-stirring ending replaces returning to the square. `dragon_awake` in `knownFlags` is forward-looking and harmless, but worth a comment that this is intentional for future runtime.

#### CT-4 — `cave_collapsed` is added but never read elsewhere (LOW, future-proofing)

`consequence_cave_complete.addFlags` includes `cave_collapsed`, but no other beat or consequence references it. Either remove it or reserve it for the showcase v2 design. Same for `landslide_surveyed`, `valley_rumors_heard`, `elder_quest_accepted`, `elder_quest_declined`, `valley_warned`. Not bugs — they will be useful in v2 — but they show up as "produced but never required" if a richer validator is added.

#### CT-5 — Stonepass world has no `generationSeed` (DESIGN CHOICE)

`WorldDefinitionSchema` includes an optional `generationSeed`. For a hand-authored world this is correctly omitted, but the convention should be documented: authored worlds omit it; generated worlds always include it.

### 8.2 Invalid fixture

**File:** `packages/content/examples/world-definition-stonepass-invalid.example.json`

**Strengths:** Passes Zod parse (so the validator gets a chance to run) and fails cross-file validation due to `consequence_missing` reference. Minimal and focused.

**Issues:** None. It does its job.

### 8.3 Other content files

- `world-definition-stonepass-minimal.example.json` is now a "composition demo." Its purpose should be clarified in a comment or sibling note so it is not confused with `worlds/stonepass/stonepass-valley.world.json`.
- Example JSON fixtures are pure JSON without comments. Consider creating `packages/content/examples/README.md` listing every example and what schema it validates against (replaces the table in `AGENT_SESSION_HANDOFF.md §4.5`).

---

## 9. Consolidated Issues and Weaknesses

Status as of **2026-05-28 remediation**. See §14 for file-level changelog.

### Resolved (Passes A–C)

| ID | Issue | Resolution |
| --- | --- | --- |
| D-1 … D-8 | Documentation drift and missing package/docs READMEs | README, handoff, FULL_CURSOR §22, Quest_Generation, `docs/`, package READMEs |
| C-1, C-2, C-3, C-6 | ID naming, parse/validate errors, schemaVersion gate, session beat check | `ids.ts`, `parseAndValidateWorldDefinition`, `SUPPORTED_SCHEMA_VERSIONS`, `createWorldSession(_, world?)` |
| C-5 | Dead-end flag-union approximation | JSDoc on `validateWorldDefinition` |
| C-8 | AIRequest context | TODO comment; full fix Phase 2 |
| E-1, E-2, E-3 | Lint + CI | Root `eslint.config.mjs`, workspace lint, `.github/workflows/ci.yml`, `eslint app` |
| T-1, T-2 (partial), T-3 | Integration dir + validator tests + session test | 17 validator tests; `idFormat.test.ts` |
| CT-1, CT-2 | Stonepass docs + location expose | `stonepass-valley.notes.md`; survey consequence |
| A-1, A-3, A-7 | AI stubs, web features dir, editorconfig | `.gitkeep` dirs; `.editorconfig` |

### Still open (not blockers for W2-S1)

| ID | Priority | Issue |
| --- | --- | --- |
| **W2-S1** | P0 (next step) | World JSON loader — `packages/core/src/world/` not created yet |
| **C-4** | P2 | Instance ↔ consequence flag handshake in validator |
| **C-7** | P2 | Coarse `WorldEventTypeSchema` vs debug events |
| **C-9, C-10** | P3 | Import layering smell; long unsorted `index.ts` exports |
| **E-4, E-5** | P2–P3 | `paths.ts` helper; `transpilePackages` / core build policy |
| **E-6, E-7, E-8** | P3 | husky, vitest `.env`, metrics badge |
| **T-4, T-5, T-6** | P2–P3 | Large-world perf test; coverage gate; example JSON sweep |
| **A-2, A-4, A-5, A-6, A-8** | P1–P3 | `loadWorld()` API, migrations, paths helper, world file version, dashboard |
| **T-2** (partial) | P2 | C-4 boundary test still missing |

---

## 10. Recommended Updates / Changes / Additions

This is the actionable roadmap of everything in §9, sequenced and grouped so the human operator can move through it in passes.

### Pass A — Documentation reconciliation — **COMPLETE (2026-05-28)**

Total time: ~1 hour. No code changes; purely doc edits.

1. **Update `README.md`**
   - Section "Project Status" (line ~62): change "W1-S1–S10 complete" → "Phase 0 complete (16/16)". Update the milestone sentence.
   - Section "Implementation Progress":
     - Update the table at line ~82 to mark W1-S11..W1-S16 as Done with one-line summaries.
     - Add a new row for the canonical Stonepass JSON.
     - Replace line ~118 "Next step: W1-S11 — Create WorldSession schema" → "Next step: W2-S1 — Build world JSON loader".
   - Section "Agent handoff (latest session)" line ~78: update "next step W1-S11" → "next step W2-S1".

2. **Update `AGENT_SESSION_HANDOFF.md`** (one full pass)
   - Header line 5: replace "Phase 0 W1-S14, and the next approved step" → "Phase 0 complete, and the next approved step (W2-S1)".
   - §4 heading: "(cumulative through W1-S14)" → "(cumulative through W1-S16)".
   - §4.5: add row for `world-definition-stonepass-invalid.example.json` and remove the "Not yet: canonical full Stonepass world ..." bullet (the world is now under `worlds/stonepass/`).
   - §4.7: update "142 tests passing (15 test files)" → "150 tests passing (17 test files)". Add lines for `packages/core/tests/unit/content/stonepassWorld.test.ts` and `packages/ai/tests/unit/providers/fakeProvider.test.ts`.
   - §6 repo layout: replace `ai/  # Stub — W1-S16 FakeProvider goes here` with a full breakdown of `packages/ai/src/{contracts,providers}/` and `packages/ai/tests/`. Add `packages/content/worlds/stonepass/` and `examples/world-definition-stonepass-invalid.example.json`.
   - §8: rewrite from W1-S15 to W2-S1 (next step is World JSON loader; allowed scope is `packages/core/world`, `packages/content/worlds/stonepass`, loader tests; reference material is the canonical JSON; integration test under `packages/core/tests/integration/`).
   - §12.3, §12.4: change "W1-S15 step card", "row W1-S15 (`Next`)" → "W2-S1 step card", "row W2-S1 (`Next`)".
   - §13: update the final line to "FakeProvider (W1-S16, **Done**) → World loader (W2-S1, **Next**)".

3. **Update `Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22` mini-table** (line ~8684)
   - Change `W1-S15 Stonepass JSON | Next` → `W1-S15 Stonepass JSON | Done — packages/content/worlds/stonepass/stonepass-valley.world.json`.
   - Add `W1-S16 AIProvider + FakeProvider | Done — packages/ai/src/{contracts,providers}/`.

4. **Update `Future_Features/Quest_Generation.md`**
   - Line 15: replace dead link `../PROJECT_CONTEXT_Playable_Worlds_Lab.md` with `../AGENT_SESSION_HANDOFF.md`.
   - Lines 572-579: rename `entranceConditionFlags` → `requiredEntryFlags`, `exitConsequenceId` → `completionConsequenceId`. Add the required v4.2 fields (`type`, `entranceText`, `rooms`) or mark the example as schematic with `// illustrative only, not valid TemporaryInstance shape`.
   - Line 654: this step references the W1-S5 and W1-S14 statuses; verify those statuses are still accurate (they are).

5. **Optional, recommended:** Add a "Last reconciled" date stamp at the top of `README.md` and `AGENT_SESSION_HANDOFF.md` so the next agent can spot drift quickly.

### Pass B — Code hygiene — **COMPLETE (2026-05-28)**

Total time: ~3–4 hours (actual).

1. **Add flag/ID naming constraints (C-1).** Single PR touching:
   - `packages/core/src/schemas/playerChoice.ts` — add regex to `FlagIdSchema`.
   - `packages/core/src/schemas/consequence.ts` — same for `GoalIdSchema`, `LocationIdSchema`, `NpcIdSchema`, `TemporaryInstanceIdSchema`.
   - `packages/core/src/schemas/debugEvent.ts`, `worldLedger.ts` — same for `DebugEventIdSchema`, `WorldEventIdSchema`.
   - `packages/core/src/schemas/worldSession.ts`, `worldDefinition.ts` — `WorldSessionIdSchema`, `WorldVersionIdSchema`, `WorldIdSchema`, `StoryBeatIdSchema`, `ChoiceIdSchema`.
   - Add a new schema test file `packages/core/tests/unit/schemas/idFormat.test.ts` asserting valid and invalid IDs.
   - Verify Stonepass world still parses.

2. **Fix `parseAndValidateWorldDefinition` error consistency (C-2).** Convert Zod errors into `WorldValidationResult` shape. Add a test for the "shape-invalid input" path.

3. **Add `schemaVersion` validator check (C-3).** Hard-error on unknown versions; export `SUPPORTED_SCHEMA_VERSIONS` set from `schemaVersion.ts` so future migration tooling has one place to update.

4. **Add world-aware overload to `createWorldSession` (C-6).** New signature: `createWorldSession(input, world?)`. If world is provided, assert `startingBeatId` exists. Update W2-S2 step card / handoff to mention the new overload.

5. **Expand lint coverage (E-1).** Add a minimal `eslint.config.js` to each non-web package and update the root script to `"lint": "npm run lint --workspaces --if-present"`. Confirm all packages pass.

6. **Add CI workflow (E-2).** Single `.github/workflows/ci.yml`. Confirm GitHub Actions runs `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` on every push and PR. Add a status badge to `README.md`.

7. **Migrate `apps/web` lint to ESLint CLI (E-3).** Replace `next lint` with `eslint . --max-warnings 0` so the deprecation warning stops showing every run.

### Pass C — Phase 1 prep scaffolding — **COMPLETE (2026-05-28)**

Loader implementation itself is **W2-S1**, not Pass C.

1. **Create `packages/core/tests/integration/` with a one-line README.** Establishes the home for W2-S7 and later integration tests.

2. **Create `packages/ai/src/gateway/.gitkeep` and `packages/ai/src/agents/.gitkeep`** to lock in the planned directory structure ahead of W4-S1.

3. **Create `apps/web/features/.gitkeep`** to anchor the planned UI layout.

4. **Create `docs/` with three short files:**
   - `docs/source-priority.md` (lift from `AGENT_SESSION_HANDOFF.md §1`)
   - `docs/content-safety-rules.md` (lift from `FULL_CURSOR §4`)
   - `docs/decision-log.md` (lift from `AGENT_SESSION_HANDOFF.md §9`)

5. **Add per-package READMEs** for `packages/core`, `packages/ai`, `packages/content`. ~30 lines each.

6. **Replace `apps/web/README.md`** with a project-specific note pointing back to the source of truth.

7. **Add `.editorconfig`** at the repo root.

### Pass D — Phase 2 prep (during W4-S1 or earlier)

1. **Introduce per-agent typed `AIRequest` contexts (C-8).** Add `DirectorAgentRequest`, `NPCAgentRequest`, `WorldArchitectAgent` request schemas.

2. **Add `OllamaProvider`** as an optional local provider; useful for offline contributors and CI-without-API-keys integration testing.

3. **Add Playwright** for E2E tests starting at W2-S6 (text play screen). Even a one-spec smoke test gates a class of regressions that unit tests cannot catch.

4. **Add `vitest --coverage`** with `@vitest/coverage-v8`. Set initial floor at 80% lines / 60% branches for `packages/core` only.

### Pass E — Long-running improvements (background)

1. **`packages/core/migrations/`** when `schemaVersion` first changes from `0.2.0`.
2. **A `validate-worlds` script** that walks `packages/content/worlds/**.world.json` and runs `parseAndValidateWorldDefinition` on each. Cheap to add now (one world) and pays off the first time a second world lands.
3. **Schema diff tooling** for forks/remixes (Phase 6).
4. **`WorldDefinition.version`** (string) so the world file carries its own immutable version separately from the session's `worldVersionId`.
5. **Performance regression test** for the validator on a synthetic 50-beat / 100-flag world.

---

## 11. Future Feature Suggestions

These are not yet on the step tracker, aligned with the project's long-term vision in `FULL_CURSOR §12` and `Future_Features/`.

### 11.1 `RunProfile` / archetype schema (Phase 1, alongside W2-S2)

`FULL_CURSOR §1` already describes a lightweight `RunProfile`:

```ts
type PlayerArchetype = "warrior" | "mage" | "rogue" | "diplomat";
type RunProfile = {
  archetype: PlayerArchetype;
  startingRoute?: "bridge" | "town" | "castle" | "forest";
  personalityTags?: string[];
};
```

Adding it as an optional `WorldSession` field in Phase 1 costs nothing at runtime (the engine ignores it) and lets Phase 2 Director use it for conditional flavor text without retrofitting the session schema.

### 11.2 `descriptionVariants` on `StoryBeat` (Phase 2/3)

From `Future_Features/Quest_Generation.md`:

```ts
descriptionVariants?: { id: string; text: string }[];
```

The Director picks one per session from the approved set. Same `consequenceIds`, different text. Cheap variation without changing game logic.

### 11.3 `WorldPassport` (post-Phase 6)

Lightweight cross-world player identity:

```ts
type WorldPassport = {
  id: string;
  visitedWorldIds: string[];
  completedGoals: string[];
  archetypeHistory: PlayerArchetype[];
  artifacts: Artifact[];
};
```

Worlds opt in via a passport-compatibility flag. Phase 6 unlocks this.

### 11.4 `WorldPortal` schema (post-Phase 6)

A consequence type that triggers entry into a different world:

```ts
type WorldPortal = {
  id: string;
  destinationWorldId: string;
  destinationBeatId?: string;
  requiredFlags?: string[];
};
```

Creates a network of worlds without changing core single-world logic.

### 11.5 NPC Dialogue Trees (Phase 3/4)

Currently NPC reactions are free-form AI text. A structured `DialogueTree` schema gives the NPC Reaction Agent a deterministic skeleton to operate within:

```ts
type DialogueTree = {
  npcId: string;
  rootNodeId: string;
  nodes: DialogueNode[];   // each with required/blocked flags + attitude gates
};
```

### 11.6 Event Timeline Viewer (Phase 3 Debug UI)

A simple HTML/CSS list panel showing `WorldEvent` entries sorted by `turnNumber`, colored by `type`, with metadata expanders. Extends the W3-S6 debug log into a real session replay tool.

### 11.7 World Snapshot Diff (Phase 6)

When a world is forked or remixed, render a structural diff (added beats, changed consequences, modified flags, NPC updates). Human-readable companion to the `world_versions` table.

### 11.8 Consequence Audit Report (Phase 6, alongside Creator Cockpit)

Static report on every consequence in a world: what it adds/removes, who it updates, which goals it touches, which instances it can open. Different from the runtime debug panel — this is a creator-time impact analysis.

### 11.9 Playwright E2E (Phase 1, alongside W2-S6)

Add `playwright.config.ts` and one spec when the first playable UI ships:

```text
1. Open browser → http://localhost:3000
2. Start Stonepass
3. Click "Fight the ogre"
4. Assert ledger shows landslide_triggered
5. Assert next beat is "After the Landslide"
```

### 11.10 Ollama Provider (Phase 2)

`OllamaProvider implements AIProvider` for local LLMs (no API key, free, offline). Lets contributors and CI exercise the real-AI code path without spending money or maintaining secrets. Should land alongside `OpenAIProvider` in Phase 2.

### 11.11 Beat Variant Pools tied to `RunProfile` archetypes

Combine 11.1 and 11.2: a beat's `descriptionVariants` can be tagged with archetype hints (`{ id: "rune_view", text: "...", archetypes: ["mage"] }`). The Director prefers variants matching the player's archetype but the game logic stays identical. This is the cleanest path to "replay variation" without forking the world graph.

### 11.12 Validator-as-CLI

Wrap `parseAndValidateWorldDefinition` in a Node CLI:

```bash
npx pw-validate packages/content/worlds/stonepass/stonepass-valley.world.json
```

Exits 0 on success, prints structured errors on failure. Lets CI fail fast on broken worlds and gives content authors a fast feedback loop.

---

## 12. Risk Assessment

### Risk 1 — Documentation drift — **MITIGATED (monitor)**

**Was:** README/handoff/FULL_CURSOR §22 stale after W1-S15/S16.

**Now:** Pass A complete; `Last reconciled: 2026-05-28` on README and handoff; `docs/` extracted.

**Residual risk:** Drift will recur if agents skip CSV + handoff updates after each step. Re-run Pass A checklist at the start of long sessions.

### Risk 2 — Stonepass scope creep during Phase 1 (MEDIUM probability, MEDIUM impact)

**Description:** As Phase 1 work starts, there will be temptation to add more content to `stonepass-valley.world.json` rather than prove the runtime with the existing one. This delays the runtime proof.

**Mitigation:** Mark `stonepass-valley.world.json` as **read-only during Phase 1** in W2-S1 and W2-S2 step cards. Add a tracker note: "any content changes go to a new file or a `stonepass-valley-showcase.world.json` after Phase 1 gates pass."

### Risk 3 — Flag naming inconsistency — **MITIGATED**

**Now:** `EntityIdSchema` / `NamedIdSchema` enforce `lowercase_snake_case` at parse time. Stonepass and examples still validate.

### Risk 4 — Next.js cannot transpile workspace packages (MEDIUM probability, LOW impact)

**Description:** When `apps/web` first imports `@playable-worlds/core` (W2-S6), the build may break because Next.js does not transpile workspace TypeScript by default.

**Mitigation:** Document the `next.config.ts` change before W2-S6 begins:

```ts
const nextConfig: NextConfig = {
  transpilePackages: ["@playable-worlds/core", "@playable-worlds/ai", "@playable-worlds/content"],
};
```

Or add per-package `build: tsc` scripts so `dist/` is shipped. Either is fine; pick one before the agent guesses.

### Risk 5 — No CI = silent regressions — **MITIGATED (verify on GitHub)**

**Now:** `.github/workflows/ci.yml` exists. Confirm first green run after push; README badge points to Actions.

### Risk 6 — Schema migration story — **PARTIALLY MITIGATED**

**Now:** `SUPPORTED_SCHEMA_VERSIONS` rejects unknown versions. Migration **code** still absent (correct deferral until `0.3.0`).

### Risk 7 — `AIRequest.context` drift (LOW probability, MEDIUM impact)

**Description:** Free-form `Record<string, unknown>` will produce one shape per agent. Hard to debug later.

**Mitigation:** Issue C-8 — type each agent's context schema in Phase 2.

### Risk 8 — `next lint` removal in Next 16 — **MITIGATED**

**Now:** Web package uses `eslint app`; `.next/` ignored in `eslint.config.mjs`.

---

## 13. Summary Scorecard

Ratings compare **initial review (morning)** → **after remediation (same day)**. Stars are honest for a pre-runtime repo — not inflated because Phase 0 is done.

| Category | Before | After | Notes |
| --- | --- | --- | --- |
| **Architecture** | ★★★★★ | ★★★★★ | Unchanged — best-in-class for this stage; boundaries and AI governance hold |
| **Code Quality** | ★★★★☆ | ★★★★☆ (+) | P1 gaps closed (IDs, errors, schemaVersion, session guard). C-4/C-7/C-9 remain — not ★★★★★ until runtime + ledger events land |
| **Documentation** | ★★★☆☆ | ★★★★★ | Drift fixed; `docs/` + package READMEs; reconciled stamps. CSV still needs per-step updates (process, not structure) |
| **Test Coverage** | ★★★★☆ | ★★★★☆ (+) | 167 tests (+17); stronger validator suite; **no loader integration test or E2E yet** — correctly not ★★★★★ |
| **Tooling** | ★★★☆☆ | ★★★★☆ | CI + workspace lint + editorconfig. Not ★★★★★: no coverage gate, husky, or confirmed green GitHub Actions run |
| **Content (Stonepass)** | ★★★★★ | ★★★★★ | Proof chain intact; design notes + location consistency fix |
| **Roadmap Clarity** | ★★★★★ | ★★★★★ | Unchanged — step cards and phase gates are a project strength |
| **Future-Proofing** | ★★★★☆ | ★★★★☆ (+) | Naming + `SUPPORTED_SCHEMA_VERSIONS` hook; migrations/`loadWorld()` still future |
| **Phase 0 Gate** | ★★★★★ | ★★★★★ | 16/16; Stonepass + FakeProvider green |

**Weighted overall (subjective):** **4.4 / 5** post-remediation (was ~3.9 / 5 on documentation and tooling drag).

### Overall health (updated)

**Ready for W2-S1.** Passes A, B, and C from this review are done. The repo is no longer carrying the documentation and hygiene debt that the morning review flagged.

**What would move the score toward 4.7+:** Implement W2-S1 loader + integration test; confirm CI green on GitHub; add example-JSON sweep (T-6); decide `transpilePackages` before W2-S6.

**What would be dishonest to claim:** “Phase 1 started” or “production-ready tooling” — there is still no playable runtime, no E2E, and no coverage floor.

---

## 14. Remediation Log (2026-05-28)

| Area | Files / artifacts |
| --- | --- |
| **IDs** | `packages/core/src/schemas/ids.ts`; applied across schemas; `idFormat.test.ts` |
| **Validator** | `SUPPORTED_SCHEMA_VERSIONS`; `parseAndValidateWorldDefinition` safeParse; JSDoc on fixpoint approximation |
| **Session** | `createWorldSession(input, world?)` + test |
| **Docs** | `README.md`, `AGENT_SESSION_HANDOFF.md`, FULL_CURSOR §22, `Quest_Generation.md`, `docs/*`, package READMEs |
| **Content** | `stonepass-valley.notes.md`; `exposeLocations` on survey consequence |
| **Tooling** | `eslint.config.mjs`, `.github/workflows/ci.yml`, `.editorconfig`, workspace `lint` scripts |
| **Scaffolding** | `tests/integration/README.md`, `ai/src/{gateway,agents}/`, `apps/web/features/`, `content/examples/README.md` |
| **AI** | TODO on `AIRequest.context` |

**Verification (local):** `npm test` → 167 passed; `npm run typecheck` → pass; `npm run lint` → pass (all workspaces).

**Not in this remediation:** W2-S1 `loadWorld` / `packages/core/src/world/` (intentionally next step).

---

*End of project review. `PROJECT_REVIEW_2026-05-28.md` — initial audit post W1-S16; updated same day after Passes A–C remediation.*
