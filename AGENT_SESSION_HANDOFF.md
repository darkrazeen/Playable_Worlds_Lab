# Playable Worlds Lab — Agent Session Handoff

**Handoff date:** 2026-05-29  
**Last reconciled:** 2026-05-29  
**Workspace:** `Playable_Worlds_Lab`  
**Purpose:** Onboard a Cursor/agent on the current repo state, contract rules, Phase 0 complete, Phase 1 complete, **Phase 2 W4-S1–S6 complete**, next step **W4-S7** — Show Director reasoning panel.

---

## 1. Read this first (agent rules)

1. **One step at a time** — Implement only the human-approved step from the tracker. Stop after completion report.
2. **Core mantra:** AI proposes → Validators check → The game engine executes.
3. **Do not jump phases** — No DirectorAgent wiring to `/play`, 2D/3D, multiplayer, or UGC until phase gates pass. **Note:** deterministic runtime in `@playable-worlds/core` (W2-S1–S7, W3-S1–S7) is complete; web `/play` is a thin layer — do not re-implement engine logic there. **AI calls:** use `AIGateway` only (W4-S1), not `AIProvider` directly. Prefer `createAIGatewayFromEnv()` so `OPENAI_ENABLED` in `.env.local` controls live vs fake provider.
4. **Schema-first** — Zod schemas + tests + examples before runtime depends on data.
5. **Do not invent object shapes** — Use contracts in FULL_CURSOR §9 + §22.
6. **Update the step tracker CSV** after every step — see FULL_CURSOR §17 and column list in §5 below.

### Source priority

| Priority | Source                                                                                                                                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §22 on conflicts, otherwise §9 and step cards                                                                                                                                   |
| 2        | Human-approved step prompt                                                                                                                                                                                                                                             |
| 3        | Repository code in `packages/core`                                                                                                                                                                                                                                     |
| 4        | [README.md](./README.md) (secondary)                                                                                                                                                                                                                                   |
| 5        | [Future_Features/](./Future_Features/README.md) — specs for scheduled `Not started` rows (W7-S7+ / W8-S6+ libraries & quest; **W4-S8–S10, W5-S8–S13, W7-S12–S13, W8-S13–S20, W9-S7–S9, W12-S8** Spire & gameplay systems). **Not current work** until a row is `Next`. |

---

## 2. What this project is

**Playable Worlds Lab** is a schema-first, text-first **AI-directed world engine** where player choices change remembered world state.

- **First proof content:** **Stonepass Spire — Floor 1** (ogre bridge → branches; Floors 2–3 carry landslide/cave/boss as systems land). Legacy file: `stonepass-valley.world.json`.
- **Not day one:** 3D metaverse, full economy, multiplayer, public UGC marketplace.
- **Long-term vision:** Rich Stonepass showcase (v2), AI Director variation, **player-themed worlds** (WorldBlueprint + content libraries — [Future_Features/Player_World_Generation_and_Content_Libraries.md](./Future_Features/Player_World_Generation_and_Content_Libraries.md)), **quest generation** ([Future_Features/Quest_Generation.md](./Future_Features/Quest_Generation.md), tracker W8-S9–S12), 2D/3D as output layers on same JSON.
- **Flagship product direction (scheduled 2026-05-29):** **Stonepass Spire** — retune Stonepass into an Aincrad-style **100-floor castle** (single-player). Floor = `WorldDefinition`; castle = vertical `RegionMap` gated by `floor_N_cleared`; boss raids = multi-phase instances; **Tier A** RuneScape-inspired combat/skills (bounded, usage-advanced). **23 tracker rows** interleaved into Weeks 4–12 (see §3 _Spire & gameplay systems_). Specs: [Future_Features/](./Future_Features/README.md). **Current approved step:** W4-S4 (DirectorAgent). Do not implement Spire rows until each reaches `Next` with human approval.

```text
WorldDefinition → StoryBeats → PlayerChoices → Consequences → WorldLedger
→ WorldSession (save-state) → runtime applies consequences → DebugEvent trace
→ AI Director suggests (AIResult wrapper) → engine executes
```

---

## 3. Phase progress (step tracker)

Tracked in [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv).

### Phase 0 — complete (16/16)

W1-S1 through W1-S16 — all **Complete**.

### Phase 1 — complete (W2-S1–S7, W3-S1–S7)

| Step  | Name                               | Status       |
| ----- | ---------------------------------- | ------------ |
| W2-S1 | World JSON loader                  | **Complete** |
| W2-S2 | Initialize WorldSession            | **Complete** |
| W2-S3 | Story beat selector                | **Complete** |
| W2-S4 | Choice resolver                    | **Complete** |
| W2-S5 | Apply consequence through runtime  | **Complete** |
| W2-S6 | Text play screen                   | **Complete** |
| W2-S7 | Manual ogre path tests             | **Complete** |
| W3-S1 | Consequence Engine core            | **Complete** |
| W3-S2 | Validate consequence preconditions | **Complete** |
| W3-S3 | Finalize flag lifecycle rules      | **Complete** |
| W3-S4 | World Ledger UI panel              | **Complete** |
| W3-S5 | Debug log model usage              | **Complete** |
| W3-S6 | Debug log UI panel                 | **Complete** |
| W3-S7 | Phase 1 acceptance hardening       | **Complete** |

### Phase 2 — in progress (AI Director v1)

| Step   | Name                          | Status              |
| ------ | ----------------------------- | ------------------- |
| W4-S1  | AI Gateway                    | **Complete**        |
| W4-S2  | Expand FakeProvider scenarios | **Complete**        |
| W4-S3  | OpenAI provider + env toggle  | **Complete**        |
| W4-S4  | Build DirectorAgent           | **Complete**        |
| W4-S5  | Build NPCReactionAgent        | **Complete**        |
| W4-S6  | Integrate fallback / failure  | **Complete**        |
| W4-S7  | Director reasoning panel      | **Next ← approved** |
| W4-S8+ | Further Phase 2 steps         | Not started         |

**Engine loop (working in tests and browser):** `loadWorld` → `initializeWorldSession` → `selectStoryBeat` → `resolvePlayerChoice` → `applyPlayerChoice` → ledger + debug trace update

**AI loop (W4-S1–S6, not wired to `/play` yet):** `createAIGatewayFromEnv()` → gateway → `DirectorAgent` / `NPCReactionAgent` → `recordAiGatewayOutcome` / debug events (`ai_suggestion`, `fallback_used`, `validation_failed`); play stays deterministic via `applyPlayerChoice`

**OpenAI toggle (local):** Keep `OPENAI_API_KEY` in gitignored `.env.local`; set `OPENAI_ENABLED=false` (off) or `true` (live). See `packages/ai/docs/ai-provider-toggle.md`.

**Gap to close:** W4-S7 reasoning UI on `/play`; beat progression beyond ogre bridge branches (content/engine, not Phase 2 gate)

### Current snapshot (2026-05-29)

| Area                                            | Status                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Phase 0 schemas + validator                     | **Complete** (W1-S1–S16)                                                           |
| Stonepass canonical JSON                        | **Complete** — passes `parseAndValidateWorldDefinition`                            |
| FakeProvider                                    | **Complete** (W1-S16 + W4-S2 seed catalog & Stonepass presets)                     |
| Runtime core (load → consequence)               | **Complete** (W2-S1–S7, W3-S1–S7)                                                  |
| Browser text play UI                            | **Complete** — `/play` with ledger + debug panels (W3-S4–S6)                       |
| Beat progression                                | **Partial** — ogre bridge advances (landslide / valley); full Floor 1 arc not done |
| AI Gateway                                      | **Complete (W4-S1)** — `packages/ai/src/gateway/`, `docs/ai-gateway.md`            |
| DirectorAgent / NPCReactionAgent                | **Complete (W4-S4–S5)** — gateway-only, no ledger mutation                         |
| AI fallback debug integration                   | **Complete (W4-S6)** — `recordAiGatewayOutcome`, `generateStructuredWithDebug`     |
| OpenAI provider + env toggle (`OPENAI_ENABLED`) | **Complete (W4-S3)** — `openaiProvider.ts`, `createAIGatewayFromEnv()`             |
| Director reasoning UI                           | **Not started** (W4-S7 next)                                                       |
| Temporary instance runtime                      | Phase 3 — not started                                                              |
| Spire & gameplay systems                        | **Scheduled** — tracker rows `Not started`; first Spire content step **W5-S13**    |
| Tests                                           | **315 passing** (52 files) — `npm run test:coverage` for report                    |
| CI                                              | typecheck, lint, **format:check**, test, **test:coverage**                         |
| Step tracker                                    | **122 rows** (99 original + 23 Spire/gameplay rows added 2026-05-29)               |

### Phase 5 extension — scheduled, not current work

Tracker rows added 2026-05-28 (all `Not started` until human approval):

- **W7-S7–S11** — Content Libraries (schemas, queryLibrary, Stonepass + theme packs)
- **W8-S6–S8** — WorldBlueprint + Architect wiring
- **W8-S9–S12** — Quest generation (QuestBlueprint → merge into WorldDefinition)

Chain: W7-S6 → W7-S7 … → W7-S11 → W8-S1 … → W8-S5 → W8-S6 … → W8-S12 → W8-S13 … → W9-S1. See FULL_CURSOR §13 and [Future_Features/](./Future_Features/README.md).

### Spire & gameplay systems — scheduled, not current work

Tracker rows added **2026-05-29** (all `Not started`; interleaved into existing weeks — **122 total tracker rows**). Full step cards: FULL*CURSOR §17; summary table: FULL_CURSOR §13 \_Spire & Gameplay Systems track*.

| Phase         | Steps          | What they add                                                                              |
| ------------- | -------------- | ------------------------------------------------------------------------------------------ |
| Phase 2 (W4)  | **W4-S8–S10**  | Seed plumbing · ledger difficulty signal · Director `adjust_difficulty`                    |
| Phase 3 (W5)  | **W5-S8–S13**  | ProgressionLedger · Tier A skills · gear gating · Level 0 combat · **Stonepass → Floor 1** |
| Phase 5 (W7)  | **W7-S12–S13** | Gear/Item library schema + seed                                                            |
| Phase 5 (W8)  | **W8-S13–S20** | RegionMap · SpireManifest · ascension · Floor 2 · EncounterResolver · DifficultyProfile    |
| Phase 6 (W9)  | **W9-S7–S9**   | Climb save/resume · persistent progression · seeded replay                                 |
| Phase 9 (W12) | **W12-S8**     | Variation Explorer UI                                                                      |

**Milestones (future):** single floor fun in text (**W5-S13**) → _Castle proven_ = 2 floors + ascension (**W8-S17**) → continue-your-climb persistence (**W9-S7**).

**None of these are startable now** — all gated behind Phase 2/3+ work until each row is `Next`.

Detailed per-step notes are in the CSV documentation columns — see §5.

---

## 4. Work completed (cumulative)

### 4.1 Phase 0 schemas (`packages/core/src/schemas/`)

| Schema                      | File                           | Notes                                                                 |
| --------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `SafetyMode`, `WorldDNA`    | `safetyMode.ts`, `worldDna.ts` | Teen/adult only                                                       |
| `PlayerChoice`              | `playerChoice.ts`              | `consequenceId`, flag gates                                           |
| `StoryBeat`                 | `storyBeat.ts`                 | Composes choices                                                      |
| `Consequence`               | `consequence.ts`               | v4.2: `npcUpdates[]`, `temporaryInstances`, locations                 |
| `WorldLedger`, `WorldEvent` | `worldLedger.ts`               | v4.2: `activeFlags`, `resolvedFlags`, `worldEvents`, `completedGoals` |
| `DirectorDecision`          | `directorDecision.ts`          | v4.1 action enum                                                      |
| `TemporaryInstance`         | `temporaryInstance.ts`         | Rooms, `connectedRoomIds`, `requiredEntryFlags`                       |
| `Npc`                       | `npc.ts`                       | Merged attitude enum                                                  |
| `WorldDefinition`           | `worldDefinition.ts`           | Top-level world object                                                |
| `schemaVersion`             | `schemaVersion.ts`             | `CURRENT_SCHEMA_VERSION = "0.2.0"`                                    |
| `DebugEvent`                | `debugEvent.ts`                | §9 enum; composed into WorldSession                                   |
| `WorldSession`              | `worldSession.ts`              | `createWorldSession()`, ledger + debug log                            |
| `AIResult<T>`               | `aiResult.ts`                  | `createAIResultSchema()` for typed values                             |

Exports: `packages/core/src/schemas/index.ts` and `packages/core/src/index.ts` → `@playable-worlds/core`.

### 4.2 Cross-file validator (`packages/core/src/validators/`)

| Module                | File                                | Notes                                               |
| --------------------- | ----------------------------------- | --------------------------------------------------- |
| World graph validator | `validateWorldDefinition.ts`        | Refs, duplicate IDs, flags, reachability, dead ends |
| Parse + validate      | `parseAndValidateWorldDefinition()` | Zod then cross-file checks                          |

Tests: `packages/core/tests/unit/validators/validateWorldDefinition.test.ts` (17 tests).

### 4.3 Debug helpers (`packages/core/src/debug/`)

| Module             | File                  | Notes                                                   |
| ------------------ | --------------------- | ------------------------------------------------------- |
| Append debug trace | `appendDebugEvent.ts` | Immutable session update after `DebugEventSchema` parse |

Tests: `packages/core/tests/unit/debug/appendDebugEvent.test.ts` (2 tests).

### 4.4 Contract v4.2 hybrid (Option C — human approved)

Documented in [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md#22-contract-v42-hybrid-addendum-implementation-tracking).

**Use `schemaVersion: "0.2.0"`** for all new `WorldDefinition` and `WorldSession` objects.

#### Key v4.2 field names (use these — not legacy names)

| Legacy (do not use)                | v4.2                                   |
| ---------------------------------- | -------------------------------------- |
| `events`                           | `worldEvents`                          |
| `completedFlags`                   | `resolvedFlags`                        |
| `activeGoals`                      | `unlockedGoals`                        |
| `startTemporaryInstanceIds`        | `temporaryInstances`                   |
| `entranceConditionFlags`           | `requiredEntryFlags`                   |
| `exitConsequenceId`                | `completionConsequenceId`              |
| Director `suggest_next_beat`, etc. | `select_next_beat`, `generate_*`, etc. |

### 4.5 Example JSON fixtures (`packages/content/examples/`)

| File                                                          | Validates                                              |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| `world-dna-teen.example.json`, `world-dna-adult.example.json` | WorldDNA                                               |
| `player-choice-valid.example.json`                            | PlayerChoice                                           |
| `story-beat-ogre-bridge.example.json`                         | StoryBeat (5 ogre choices)                             |
| `consequence-fight-ogre.example.json`                         | Consequence                                            |
| `world-ledger-post-ogre.example.json`                         | WorldLedger                                            |
| `director-decision-suggest-beat.example.json`                 | DirectorDecision                                       |
| `temporary-instance-hidden-cave.example.json`                 | TemporaryInstance                                      |
| `npc-ogre.example.json`, `npc-elder.example.json`             | NPC                                                    |
| `world-definition-stonepass-minimal.example.json`             | WorldDefinition + **passes** `validateWorldDefinition` |
| `world-session-stonepass-start.example.json`                  | WorldSession                                           |
| `debug-event-choice-selected.example.json`                    | DebugEvent                                             |
| `debug-event-consequence-applied.example.json`                | DebugEvent                                             |
| `debug-event-fallback-used.example.json`                      | DebugEvent                                             |
| `ai-result-success-director.example.json`                     | AIResult                                               |
| `ai-result-validation-failure.example.json`                   | AIResult                                               |
| `world-definition-stonepass-invalid.example.json`             | Cross-file validation failure (broken consequence ref) |

**Canonical world:** `packages/content/worlds/stonepass/stonepass-valley.world.json` (W1-S15). The minimal example is a **composition demo**, not the production world file.

### 4.6 Phase 1 runtime (`packages/core/src/` — W2-S1–S5)

| Module            | Path                                                                                                                                                                                                 | Notes                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| World loader      | `world/loadWorld.ts`                                                                                                                                                                                 | `loadWorldFromFile`, `loadWorld`, `isKnownWorldId`                                                                        |
| Session init      | `session/initializeWorldSession.ts`                                                                                                                                                                  | Play-ready session at `startingBeatId`                                                                                    |
| Beat selector     | `story/selectStoryBeat.ts`, `beatAccessibility.ts`                                                                                                                                                   | Flag-gated beat selection                                                                                                 |
| Choice resolver   | `runtime/resolvePlayerChoice.ts`                                                                                                                                                                     | `resolvePlayerChoice`, `listAvailableChoices`                                                                             |
| Consequence apply | `consequence/consequenceEngine.ts`, `consequence/applyConsequenceToLedger.ts`, `consequence/validateConsequencePreconditions.ts`; `ledger/flagLifecycle.ts`; `runtime/applyConsequence.ts` delegates | `applyConsequenceEngine`, `applyFlagChanges`, `validateConsequencePreconditions`, `applyConsequence`, `applyPlayerChoice` |
| Content paths     | `packages/content/src/paths.ts`                                                                                                                                                                      | `contentRoot`, Stonepass paths                                                                                            |

Integration tests use `contentRoot = join(__dirname, "../../../content")`.

**W2-S1–S5 acceptance (met):**

- Loader returns typed `WorldDefinition` or `{ ok: false, errors }` without throwing on invalid input.
- Fresh Stonepass session starts at `beat_ogre_bridge` with empty ledger and turn 0.
- All five ogre bridge choices resolve; invalid/fake choices return structured errors.
- `applyPlayerChoice("fight_ogre")` updates flags, goals, locations, ledger events, choice history, debug trace, and turn number.
- Session validates after each update via `WorldSessionSchema`.

### 4.7 Documentation and process updates

#### 2026-05-28

- [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §17 step tracker rules; **Phase 5 extension** (W7-S7–W8-S12); replay layer 10 (content libraries).
- [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — W1-S1–S16 and W2-S1–S5 **Complete**; W2-S6 **Next**; W7-S7–S11 and W8-S6–S12 added as `Not started`.
- [Future_Features/](./Future_Features/README.md) — brainstorm/spec docs; player world generation + quest specs linked to tracker rows (W7-S7+, W8-S6+; all `Not started`).
- [scripts/step-tracker-enrichment.json](./scripts/step-tracker-enrichment.json) — reference text for backfill.

#### Stonepass Spire design package (2026-05-28 — specs only at this point)

- [Future_Features/Stonepass_Spire_Aincrad_Castle.md](./Future_Features/Stonepass_Spire_Aincrad_Castle.md) — flagship: 100-floor castle, `SpireManifest` skeleton, floor anatomy, single-player boss raids, climb curve, phased rollout.
- [Future_Features/Combat_and_Encounter_Resolution.md](./Future_Features/Combat_and_Encounter_Resolution.md) — Tier A combat/skills (bounded, usage-advanced); Level 0 (no new code) → Level 1 `EncounterResolver`; Tier A→B migration path.
- [Future_Features/Procedural_Region_and_Biome_Composer.md](./Future_Features/Procedural_Region_and_Biome_Composer.md) — **vertical (tower) topology** section + `validateRegionMap` rules for the Spire.
- [Future_Features/README.md](./Future_Features/README.md) — "Flagship direction: Stonepass Spire" index + `FLAGSHIP` layer in the vision stack.
- `packages/content/examples/_design_drafts/` — **non-production** illustrative `*.draft.json` (Spire manifest + vertical region) + README. Uses `.draft.json` suffix; **never loaded by tests**, nothing imports it.

#### 2026-05-29 — Spire & gameplay systems scheduled in tracker

- [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — **23 new rows** (`Not started`): W4-S8–S10, W5-S8–S13, W7-S12–S13, W8-S13–S20, W9-S7–S9, W12-S8. **122 total rows.** Chain re-pointed at W4-S7, W5-S7, W7-S11, W8-S12, W9-S6, W12-S7.
- [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §13 _Spire & Gameplay Systems track_ summary table; §17 full step cards for all 23 new steps.
- [README.md](./README.md) — Implementation Progress table + Roadmap subsection for Spire track; Tier A combat boundary note.
- [Future_Features/](./Future_Features/README.md) — _Scheduled: Stonepass Spire & gameplay systems_ index; 7 feature doc statuses flipped to **Scheduled in step tracker**.
- Feature specs updated with assigned step IDs: Stonepass Spire, Combat, Progression, Items/Gear, Region Composer, Dynamic Difficulty, Story Seed/Variation Explorer.

### 4.8 Phase 1 completion (W3-S1–S7) — summary

| Area               | Key paths                                                                      |
| ------------------ | ------------------------------------------------------------------------------ |
| Consequence engine | `packages/core/src/consequence/consequenceEngine.ts`                           |
| Flag lifecycle     | `packages/core/src/ledger/flagLifecycle.ts`, `docs/flag-lifecycle.md`          |
| Debug trace        | `packages/core/src/debug/buildDebugEvents.ts`, `debugTrace.ts`                 |
| Beat progression   | `advanceSessionBeat.ts`, `beat_ogre_bridge` `blockedByFlags` in Stonepass JSON |
| Web UI             | `apps/web/features/world-debug/`, `WorldPlayScreen.tsx`                        |
| Acceptance         | `phase1Acceptance.test.ts`, `packages/core/docs/phase1-acceptance.md`          |

### 4.9 Phase 2 AI layer (W4-S1–S3) — summary

| Area               | Key paths                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| AI Gateway         | `packages/ai/src/gateway/aiGateway.ts`, `docs/ai-gateway.md`                                                |
| FakeProvider seeds | `fakeProvider.ts`, `fakeProviderScenarios.ts`, `docs/fake-provider.md`                                      |
| OpenAI provider    | `openaiProvider.ts`, `docs/openai-provider.md`                                                              |
| Provider toggle    | `config/envFlags.ts`, `config/resolveAIProvider.ts`, `docs/ai-provider-toggle.md`                           |
| Factory            | `createAIProviderFromEnv()`, `createAIGatewayFromEnv()`, `getAIProviderStatus()`                            |
| Tests              | `aiGateway.test.ts`, `fakeProviderScenarios.test.ts`, `openaiProvider.test.ts`, `resolveAIProvider.test.ts` |

**Rules:** Agents call `AIGateway` only — never `provider.generateStructured()` directly. Use `createAIGatewayFromEnv()` for env-driven fake vs OpenAI. **Default:** OpenAI off (`OPENAI_ENABLED` unset/false) even if `OPENAI_API_KEY` is in `.env.local`.

### 4.10 Verification state (2026-05-29)

```bash
npm test              # 295 tests passing (47 files)
npm run test:coverage # coverage report (CI gate)
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Key test areas: `packages/core/tests/integration/`, `apps/web/tests/`, `packages/ai/tests/unit/` (gateway, providers, config).

---

## 5. Step tracker CSV — columns agents must maintain

File: [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv)

After each step, update the row for that step (and set the next row to `Next` if approved):

| Column                         | Fill when                                                |
| ------------------------------ | -------------------------------------------------------- |
| `Status`                       | `Complete` / `Next` / `In progress` / `Not started`      |
| `Completion Evidence`          | Short 1–3 sentence summary                               |
| `Implementation Added Changed` | **Detailed** — files, exports, examples, contract deltas |
| `Project Relevance`            | Why this matters for Stonepass / engine / phase gate     |
| `Future Features Impact`       | Downstream steps, phases, showcase v2, Future_Features   |
| `Tests And Verification`       | Test files, counts, `npm test` result, date              |
| `Last Updated`                 | `YYYY-MM-DD` or `(planned)` for `Next`                   |

Full rules: FULL_CURSOR §17. Do not fill `Commit Hash` unless the human provides one.

---

## 6. Repository layout (relevant paths)

```text
playable-worlds-lab/
  apps/web/                              # Next.js — home + /play (W2-S6, W3-S4–S6 panels)
    app/play/
    features/world-play/                 # WorldPlayScreen, worldPlayRuntime
    features/world-debug/                # WorldLedgerPanel, DebugTracePanel
    tests/                               # web smoke + phase1 acceptance
  packages/
    core/
      src/schemas/                       # All Zod contracts
      src/world/                         # loadWorld (W2-S1) ✓
      src/session/                       # initializeWorldSession (W2-S2) ✓
      src/story/                         # selectStoryBeat, advanceSessionBeat
      src/consequence/                   # consequenceEngine (W3-S1)
      src/ledger/                          # flagLifecycle (W3-S3)
      src/runtime/                       # resolvePlayerChoice, applyPlayerChoice
      src/validators/
      src/debug/
      docs/                              # flag-lifecycle, phase1-acceptance, beat-progression
      tests/unit/ + tests/integration/
    ai/
      src/config/                        # envFlags, resolveAIProvider (OPENAI_ENABLED toggle)
      src/contracts/
      src/providers/                     # FakeProvider, OpenAIProvider (W4-S2, W4-S3)
      src/gateway/                       # AIGateway (W4-S1) ✓
      src/agents/                        # DirectorAgent stub (W4-S4+)
      docs/                              # ai-gateway, fake-provider, openai-provider, ai-provider-toggle
      tests/unit/config/ + gateway/ + providers/
    content/
      examples/                          # JSON fixtures + invalid validator demo
      worlds/stonepass/                  # stonepass-valley.world.json (canonical)
      src/paths.ts                       # contentRoot, Stonepass paths
  docs/                                  # source-priority, content-safety, decision-log
  scripts/
    step-tracker-enrichment.json
    merge-step-tracker-columns.mjs
  .github/workflows/ci.yml
  tests/smoke.test.ts
  Playable_Worlds_Lab_v4_1_FULL_CURSOR.md
  Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv
  AGENT_SESSION_HANDOFF.md               # This file
  Future_Features/                       # 22 brainstorm/spec docs (8 scheduled in tracker)
```

---

## 7. What is NOT built yet

| Item                                                                                                     | Step                                                                                                |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Full Stonepass JSON at `packages/content/worlds/stonepass/`                                              | **Done (W1-S15)**                                                                                   |
| `AIProvider` + `FakeProvider`                                                                            | **Done (W1-S16)**                                                                                   |
| World loader                                                                                             | **Done (W2-S1)**                                                                                    |
| Session init at runtime                                                                                  | **Done (W2-S2)**                                                                                    |
| Beat selector, choice resolver, first consequence apply                                                  | **Done (W2-S3–S5)**                                                                                 |
| Browser text play UI                                                                                     | **Done (W2-S6)** — `/play`                                                                          |
| Consequence precondition validation                                                                      | **Done (W3-S2)**                                                                                    |
| Flag lifecycle rules                                                                                     | **Done (W3-S3)** — `packages/core/src/ledger/`, `docs/flag-lifecycle.md`                            |
| World Ledger UI panel                                                                                    | **Done (W3-S4)** — `/play` sidebar `WorldLedgerPanel`                                               |
| Debug log model usage                                                                                    | **Done (W3-S5)** — typed builders + validation_failed on failures                                   |
| Debug log UI panel                                                                                       | **Done (W3-S6)** — `/play` sidebar `DebugTracePanel`                                                |
| Phase 1 acceptance hardening                                                                             | **Done (W3-S7)**                                                                                    |
| AI Gateway                                                                                               | **Done (W4-S1)** — `AIGateway`; see `packages/ai/docs/ai-gateway.md`                                |
| FakeProvider scenarios (seed catalog)                                                                    | **Done (W4-S2)** — see `packages/ai/docs/fake-provider.md`                                          |
| OpenAI provider + `OPENAI_ENABLED` toggle                                                                | **Done (W4-S3)** — see `packages/ai/docs/openai-provider.md`, `ai-provider-toggle.md`               |
| DirectorAgent                                                                                            | W4-S4+                                                                                              |
| Temporary instance runtime                                                                               | Phase 3 (W5-\*)                                                                                     |
| Content libraries, WorldBlueprint, quest generation                                                      | Phase 5 extension (W7-S7+, W8-S6+) — scheduled only                                                 |
| Spire & gameplay systems (combat Tier A, progression, gear, RegionMap, SpireManifest, climb persistence) | W4-S8–S10, W5-S8–S13, W7-S12–S13, W8-S13–S20, W9-S7–S9, W12-S8 — scheduled only until row is `Next` |

**Validation layers today:**

1. **Zod** — per-object shape (`WorldDefinitionSchema`, etc.).
2. **Cross-file** — `validateWorldDefinition()` (refs, duplicates, flags, reachability). Use before loading any world in runtime or accepting generated content.

---

## 8. Phase gates

### Phase 1 — complete (W3-S7)

**Checklist:** [packages/core/docs/phase1-acceptance.md](./packages/core/docs/phase1-acceptance.md)

**Automated proof:** `phase1Acceptance.test.ts`, ogre-path tests, web smoke tests — **295 tests** green (includes Phase 2 AI tests).

### Phase 2 — in progress

**Done:** W4-S1 AI Gateway, W4-S2 FakeProvider expansion, W4-S3 OpenAI provider + env toggle (`OPENAI_ENABLED`, `createAIGatewayFromEnv`).

**Next approved:** W4-S4 DirectorAgent.

## 9. Next step: W4-S4 — Build DirectorAgent

**Goal:** Use AI Gateway to suggest next beat, recap, or session wrap-up via `DirectorDecision` — **no permanent state mutation**.

**Allowed scope:** `packages/ai/agents/directorAgent`, tests.

**Wire provider via:** `createAIGatewayFromEnv()` (respects `.env.local` toggle). **FakeProvider (W4-S2):** `packages/ai/docs/fake-provider.md`. **OpenAI (W4-S3):** `packages/ai/docs/ai-provider-toggle.md`.

---

## 10. Human decisions (cumulative)

**Canonical log:** [docs/decision-log.md](./docs/decision-log.md) — do not duplicate the full table here.

| Decision                         | Detail                                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Step tracker**                 | [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) is the only source of step status                        |
| **Phase 1 hygiene (2026-05-29)** | Review fixes: web lint scope, CI format/coverage, unique world-event IDs, beat progression — see [PROJECT_REVIEW_2026-05-29.md](./PROJECT_REVIEW_2026-05-29.md) |

---

## 11. Agent completion report template

After each step, report:

1. Task completed (step ID)
2. Files changed and why
3. Tests run and exact result
4. Acceptance criteria evidence
5. Validation/fallback added (if any)
6. Human action required (if any)
7. Blocked items intentionally not touched
8. Next safe step only
9. **Update step tracker CSV** — all documentation columns (§5, FULL_CURSOR §17)

---

## 12. Key commands

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
npm run dev    # http://localhost:3000 — home; /play for Stonepass (W2-S6)
```

---

## 13. Reference files (read order for new agent)

1. This file — `AGENT_SESSION_HANDOFF.md`
2. [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md#22-contract-v42-hybrid-addendum-implementation-tracking)
3. [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — **status source of truth**; row W4-S4 (`Next`); **122 rows total**
4. `packages/ai/docs/ai-gateway.md`, `fake-provider.md`, `openai-provider.md`, `ai-provider-toggle.md`
5. `packages/core/src/runtime/` and `packages/core/src/world/` for conventions
6. `stonepass-valley.world.json` as reference content
7. [Future_Features/](./Future_Features/README.md) — long-term vision including Spire track (**not current implementation**)
8. FULL*CURSOR §13 \_Spire & Gameplay Systems track* — when planning Phase 2+ work

---

## 14. Schema dependency graph (current)

```text
SafetyMode ──┐
WorldDNA ────┼──► WorldDefinition (W1-S10) ──► validateWorldDefinition (W1-S14)
PlayerChoice ┼──► StoryBeat (W1-S4) ──┐
             │                         ├──► WorldDefinition
Consequence (W1-S5) ───────────────────┤
Npc (W1-S9) ───────────────────────────┤
TemporaryInstance (W1-S8) ─────────────┘

WorldLedger (W1-S6) ──► WorldSession (W1-S11)
DebugEvent (W1-S12) ──┘

DirectorDecision (W1-S7) ──► AIResult<T> (W1-S13)
  ──► AIGateway (W4-S1) ──► createAIGatewayFromEnv()
        ├── FakeProvider (default; W1-S16, W4-S2)
        └── OpenAIProvider (W4-S3; OPENAI_ENABLED=true + key)
      — agents must not skip gateway
WorldDefinition ──► loadWorld (W2-S1) ──► initializeWorldSession (W2-S2)
  ──► selectStoryBeat / advanceSessionBeat (W2-S3, W3-S7)
  ──► resolvePlayerChoice (W2-S4) ──► applyConsequenceEngine (W3-S1)
  ──► text play + ledger/debug UI (W2-S6, W3-S4–S6, Complete)
```

---

_End of agent session handoff. Next approved implement: **W4-S4 Build DirectorAgent**._
