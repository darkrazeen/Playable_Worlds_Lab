# Playable Worlds Lab — Agent Session Handoff

**Handoff date:** 2026-05-29  
**Last reconciled:** 2026-05-29  
**Workspace:** `Playable_Worlds_Lab`  
**Purpose:** Onboard a Cursor/agent on the current repo state, contract rules, Phase 0 complete, Phase 1 W2 complete + W3-S1–S3 complete, and the next approved step (**W3-S4**).

---

## 1. Read this first (agent rules)

1. **One step at a time** — Implement only the human-approved step from the tracker. Stop after completion report.
2. **Core mantra:** AI proposes → Validators check → The game engine executes.
3. **Do not jump phases** — No browser play UI beyond W2-S6 scope, AI Gateway, 2D/3D, multiplayer, or UGC until phase gates pass. **Note:** deterministic runtime in `@playable-worlds/core` (W2-S1–S5) is complete; do not re-implement it in the web layer.
4. **Schema-first** — Zod schemas + tests + examples before runtime depends on data.
5. **Do not invent object shapes** — Use contracts in FULL_CURSOR §9 + §22.
6. **Update the step tracker CSV** after every step — see FULL_CURSOR §17 and column list in §5 below.

### Source priority

| Priority | Source |
| --- | --- |
| 1 | [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §22 on conflicts, otherwise §9 and step cards |
| 2 | Human-approved step prompt |
| 3 | Repository code in `packages/core` |
| 4 | [README.md](./README.md) (secondary) |
| 5 | [Future_Features/](./Future_Features/README.md) — specs for scheduled `Not started` rows (W7-S7+ / W8-S6+ libraries & quest; **W4-S8–S10, W5-S8–S13, W7-S12–S13, W8-S13–S20, W9-S7–S9, W12-S8** Spire & gameplay systems). **Not current work** until a row is `Next`. |

---

## 2. What this project is

**Playable Worlds Lab** is a schema-first, text-first **AI-directed world engine** where player choices change remembered world state.

- **First proof content:** **Stonepass Spire — Floor 1** (ogre bridge → branches; Floors 2–3 carry landslide/cave/boss as systems land). Legacy file: `stonepass-valley.world.json`.
- **Not day one:** 3D metaverse, full economy, multiplayer, public UGC marketplace.
- **Long-term vision:** Rich Stonepass showcase (v2), AI Director variation, **player-themed worlds** (WorldBlueprint + content libraries — [Future_Features/Player_World_Generation_and_Content_Libraries.md](./Future_Features/Player_World_Generation_and_Content_Libraries.md)), **quest generation** ([Future_Features/Quest_Generation.md](./Future_Features/Quest_Generation.md), tracker W8-S9–S12), 2D/3D as output layers on same JSON.
- **Flagship product direction (scheduled 2026-05-29):** **Stonepass Spire** — retune Stonepass into an Aincrad-style **100-floor castle** (single-player). Floor = `WorldDefinition`; castle = vertical `RegionMap` gated by `floor_N_cleared`; boss raids = multi-phase instances; **Tier A** RuneScape-inspired combat/skills (bounded, usage-advanced). **23 tracker rows** interleaved into Weeks 4–12 (see §3 *Spire & gameplay systems*). Specs: [Stonepass_Spire_Aincrad_Castle.md](./Future_Features/Stonepass_Spire_Aincrad_Castle.md), [Combat_and_Encounter_Resolution.md](./Future_Features/Combat_and_Encounter_Resolution.md), and linked docs in [Future_Features/README.md](./Future_Features/README.md). **Phase gates unchanged — next step is W2-S7.** Do not implement Spire rows until each reaches `Next` with human approval. Out of scope: guilds, multiplayer, AI-authored NPCs, Tier B continuous XP (README boundary amendment required).

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

### Phase 1 — in progress (7/7+ through W3)

| Step | Name | Status |
| --- | --- | --- |
| W2-S1 | World JSON loader | **Complete** |
| W2-S2 | Initialize WorldSession | **Complete** |
| W2-S3 | Story beat selector | **Complete** |
| W2-S4 | Choice resolver | **Complete** |
| W2-S5 | Apply consequence through runtime | **Complete** |
| W2-S6 | Text play screen | **Complete** |
| W2-S7 | Manual ogre path tests | **Complete** |
| W3-S1 | Consequence Engine core | **Complete** |
| W3-S2 | Validate consequence preconditions | **Complete** |
| W3-S3 | Finalize flag lifecycle rules | **Complete** |
| W3-S4+ | Ledger UI, debug UI | **Next ← approved** |

**Engine loop (working in tests and browser):** `loadWorld` → `initializeWorldSession` → `selectStoryBeat` → `resolvePlayerChoice` → `applyPlayerChoice`

**Gap to close:** W3-S4 World Ledger UI panel; beat progression in UI still deferred.

### Current snapshot (2026-05-29)

| Area | Status |
| --- | --- |
| Phase 0 schemas + validator | **Complete** (W1-S1–S16) |
| Stonepass canonical JSON | **Complete** — passes `parseAndValidateWorldDefinition` |
| FakeProvider | **Complete** — no real AI calls |
| Runtime core (load → consequence) | **Complete** (W2-S1–S5) |
| Browser text play UI | **Complete** — W2-S6 at `/play` |
| AI Gateway / Director | Phase 2 — not started |
| Temporary instance runtime | Phase 3 — not started |
| Spire & gameplay systems (combat Tier A, progression, gear, region, manifest) | **Scheduled** — tracker rows `Not started`; first Spire content step **W5-S13** (after Phase 3 instances) |
| Tests | **235 passing** (33 files) |
| CI | `.github/workflows/ci.yml` — typecheck, lint, test |
| Step tracker | **122 rows** (99 original + 23 Spire/gameplay rows added 2026-05-29) |

### Phase 5 extension — scheduled, not current work

Tracker rows added 2026-05-28 (all `Not started` until human approval):

- **W7-S7–S11** — Content Libraries (schemas, queryLibrary, Stonepass + theme packs)
- **W8-S6–S8** — WorldBlueprint + Architect wiring
- **W8-S9–S12** — Quest generation (QuestBlueprint → merge into WorldDefinition)

Chain: W7-S6 → W7-S7 … → W7-S11 → W8-S1 … → W8-S5 → W8-S6 … → W8-S12 → W8-S13 … → W9-S1. See FULL_CURSOR §13 and [Future_Features/](./Future_Features/README.md).

### Spire & gameplay systems — scheduled, not current work

Tracker rows added **2026-05-29** (all `Not started`; interleaved into existing weeks — **122 total tracker rows**). Full step cards: FULL_CURSOR §17; summary table: FULL_CURSOR §13 *Spire & Gameplay Systems track*.

| Phase | Steps | What they add |
| --- | --- | --- |
| Phase 2 (W4) | **W4-S8–S10** | Seed plumbing · ledger difficulty signal · Director `adjust_difficulty` |
| Phase 3 (W5) | **W5-S8–S13** | ProgressionLedger · Tier A skills · gear gating · Level 0 combat · **Stonepass → Floor 1** |
| Phase 5 (W7) | **W7-S12–S13** | Gear/Item library schema + seed |
| Phase 5 (W8) | **W8-S13–S20** | RegionMap · SpireManifest · ascension · Floor 2 · EncounterResolver · DifficultyProfile |
| Phase 6 (W9) | **W9-S7–S9** | Climb save/resume · persistent progression · seeded replay |
| Phase 9 (W12) | **W12-S8** | Variation Explorer UI |

**Milestones (future):** single floor fun in text (**W5-S13**) → *Castle proven* = 2 floors + ascension (**W8-S17**) → continue-your-climb persistence (**W9-S7**).

**None of these are startable now** — all gated behind Phase 2/3+ work. After W2-S7: W3-* → …

Detailed per-step notes are in the CSV documentation columns — see §5.

---

## 4. Work completed (cumulative through W2-S5)

### 4.1 Phase 0 schemas (`packages/core/src/schemas/`)

| Schema | File | Notes |
| --- | --- | --- |
| `SafetyMode`, `WorldDNA` | `safetyMode.ts`, `worldDna.ts` | Teen/adult only |
| `PlayerChoice` | `playerChoice.ts` | `consequenceId`, flag gates |
| `StoryBeat` | `storyBeat.ts` | Composes choices |
| `Consequence` | `consequence.ts` | v4.2: `npcUpdates[]`, `temporaryInstances`, locations |
| `WorldLedger`, `WorldEvent` | `worldLedger.ts` | v4.2: `activeFlags`, `resolvedFlags`, `worldEvents`, `completedGoals` |
| `DirectorDecision` | `directorDecision.ts` | v4.1 action enum |
| `TemporaryInstance` | `temporaryInstance.ts` | Rooms, `connectedRoomIds`, `requiredEntryFlags` |
| `Npc` | `npc.ts` | Merged attitude enum |
| `WorldDefinition` | `worldDefinition.ts` | Top-level world object |
| `schemaVersion` | `schemaVersion.ts` | `CURRENT_SCHEMA_VERSION = "0.2.0"` |
| `DebugEvent` | `debugEvent.ts` | §9 enum; composed into WorldSession |
| `WorldSession` | `worldSession.ts` | `createWorldSession()`, ledger + debug log |
| `AIResult<T>` | `aiResult.ts` | `createAIResultSchema()` for typed values |

Exports: `packages/core/src/schemas/index.ts` and `packages/core/src/index.ts` → `@playable-worlds/core`.

### 4.2 Cross-file validator (`packages/core/src/validators/`)

| Module | File | Notes |
| --- | --- | --- |
| World graph validator | `validateWorldDefinition.ts` | Refs, duplicate IDs, flags, reachability, dead ends |
| Parse + validate | `parseAndValidateWorldDefinition()` | Zod then cross-file checks |

Tests: `packages/core/tests/unit/validators/validateWorldDefinition.test.ts` (17 tests).

### 4.3 Debug helpers (`packages/core/src/debug/`)

| Module | File | Notes |
| --- | --- | --- |
| Append debug trace | `appendDebugEvent.ts` | Immutable session update after `DebugEventSchema` parse |

Tests: `packages/core/tests/unit/debug/appendDebugEvent.test.ts` (2 tests).

### 4.4 Contract v4.2 hybrid (Option C — human approved)

Documented in [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md#22-contract-v42-hybrid-addendum-implementation-tracking).

**Use `schemaVersion: "0.2.0"`** for all new `WorldDefinition` and `WorldSession` objects.

#### Key v4.2 field names (use these — not legacy names)

| Legacy (do not use) | v4.2 |
| --- | --- |
| `events` | `worldEvents` |
| `completedFlags` | `resolvedFlags` |
| `activeGoals` | `unlockedGoals` |
| `startTemporaryInstanceIds` | `temporaryInstances` |
| `entranceConditionFlags` | `requiredEntryFlags` |
| `exitConsequenceId` | `completionConsequenceId` |
| Director `suggest_next_beat`, etc. | `select_next_beat`, `generate_*`, etc. |

### 4.5 Example JSON fixtures (`packages/content/examples/`)

| File | Validates |
| --- | --- |
| `world-dna-teen.example.json`, `world-dna-adult.example.json` | WorldDNA |
| `player-choice-valid.example.json` | PlayerChoice |
| `story-beat-ogre-bridge.example.json` | StoryBeat (5 ogre choices) |
| `consequence-fight-ogre.example.json` | Consequence |
| `world-ledger-post-ogre.example.json` | WorldLedger |
| `director-decision-suggest-beat.example.json` | DirectorDecision |
| `temporary-instance-hidden-cave.example.json` | TemporaryInstance |
| `npc-ogre.example.json`, `npc-elder.example.json` | NPC |
| `world-definition-stonepass-minimal.example.json` | WorldDefinition + **passes** `validateWorldDefinition` |
| `world-session-stonepass-start.example.json` | WorldSession |
| `debug-event-choice-selected.example.json` | DebugEvent |
| `debug-event-consequence-applied.example.json` | DebugEvent |
| `debug-event-fallback-used.example.json` | DebugEvent |
| `ai-result-success-director.example.json` | AIResult |
| `ai-result-validation-failure.example.json` | AIResult |
| `world-definition-stonepass-invalid.example.json` | Cross-file validation failure (broken consequence ref) |

**Canonical world:** `packages/content/worlds/stonepass/stonepass-valley.world.json` (W1-S15). The minimal example is a **composition demo**, not the production world file.

### 4.6 Phase 1 runtime (`packages/core/src/` — W2-S1–S5)

| Module | Path | Notes |
| --- | --- | --- |
| World loader | `world/loadWorld.ts` | `loadWorldFromFile`, `loadWorld`, `isKnownWorldId` |
| Session init | `session/initializeWorldSession.ts` | Play-ready session at `startingBeatId` |
| Beat selector | `story/selectStoryBeat.ts`, `beatAccessibility.ts` | Flag-gated beat selection |
| Choice resolver | `runtime/resolvePlayerChoice.ts` | `resolvePlayerChoice`, `listAvailableChoices` |
| Consequence apply | `consequence/consequenceEngine.ts`, `consequence/applyConsequenceToLedger.ts`, `consequence/validateConsequencePreconditions.ts`; `ledger/flagLifecycle.ts`; `runtime/applyConsequence.ts` delegates | `applyConsequenceEngine`, `applyFlagChanges`, `validateConsequencePreconditions`, `applyConsequence`, `applyPlayerChoice` |
| Content paths | `packages/content/src/paths.ts` | `contentRoot`, Stonepass paths |

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
- [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §13 *Spire & Gameplay Systems track* summary table; §17 full step cards for all 23 new steps.
- [README.md](./README.md) — Implementation Progress table + Roadmap subsection for Spire track; Tier A combat boundary note.
- [Future_Features/](./Future_Features/README.md) — *Scheduled: Stonepass Spire & gameplay systems* index; 7 feature doc statuses flipped to **Scheduled in step tracker**.
- Feature specs updated with assigned step IDs: Stonepass Spire, Combat, Progression, Items/Gear, Region Composer, Dynamic Difficulty, Story Seed/Variation Explorer.

### 4.8 Verification state (2026-05-28)

```bash
npm test         # 200 tests passing (28 test files)
npm run typecheck
npm run lint
npm run build
```

Test layout (additions since Phase 0):

- `packages/core/tests/unit/world/loadWorld.test.ts`
- `packages/core/tests/integration/loadStonepassWorld.test.ts`
- `packages/core/tests/unit/session/initializeWorldSession.test.ts`
- `packages/core/tests/integration/initStonepassSession.test.ts`
- `packages/core/tests/unit/story/selectStoryBeat.test.ts`
- `packages/core/tests/integration/selectStonepassBeat.test.ts`
- `packages/core/tests/unit/runtime/resolvePlayerChoice.test.ts`
- `packages/core/tests/integration/resolveStonepassChoice.test.ts`
- `packages/core/tests/unit/runtime/applyConsequence.test.ts`
- `packages/core/tests/integration/applyStonepassConsequence.test.ts`

---

## 5. Step tracker CSV — columns agents must maintain

File: [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv)

After each step, update the row for that step (and set the next row to `Next` if approved):

| Column | Fill when |
| --- | --- |
| `Status` | `Complete` / `Next` / `In progress` / `Not started` |
| `Completion Evidence` | Short 1–3 sentence summary |
| `Implementation Added Changed` | **Detailed** — files, exports, examples, contract deltas |
| `Project Relevance` | Why this matters for Stonepass / engine / phase gate |
| `Future Features Impact` | Downstream steps, phases, showcase v2, Future_Features |
| `Tests And Verification` | Test files, counts, `npm test` result, date |
| `Last Updated` | `YYYY-MM-DD` or `(planned)` for `Next` |

Full rules: FULL_CURSOR §17. Do not fill `Commit Hash` unless the human provides one.

---

## 6. Repository layout (relevant paths)

```text
playable-worlds-lab/
  apps/web/                              # Next.js — home + /play text UI (W2-S6)
    app/play/                            # Stonepass play page
    features/world-play/                 # W2-S6 world-play feature
  packages/
    core/
      src/schemas/                       # All Zod contracts
      src/world/                         # loadWorld (W2-S1) ✓
      src/session/                       # initializeWorldSession (W2-S2) ✓
      src/story/                         # selectStoryBeat (W2-S3) ✓
      src/runtime/                       # resolvePlayerChoice, applyConsequence (W2-S4–S5) ✓
      src/validators/                    # validateWorldDefinition (W1-S14)
      src/debug/                         # appendDebugEvent (W1-S12)
      src/index.ts                       # Re-exports schemas + validators + runtime
      tests/unit/
      tests/integration/                 # Stonepass load, session, beat, choice, consequence
    ai/
      src/contracts/                     # aiRequest, aiProvider
      src/providers/                     # fakeProvider
      src/gateway/                       # Phase 2 stub
      src/agents/                        # Phase 2 stub
      tests/unit/providers/
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

| Item | Step |
| --- | --- |
| Full Stonepass JSON at `packages/content/worlds/stonepass/` | **Done (W1-S15)** |
| `AIProvider` + `FakeProvider` | **Done (W1-S16)** |
| World loader | **Done (W2-S1)** |
| Session init at runtime | **Done (W2-S2)** |
| Beat selector, choice resolver, first consequence apply | **Done (W2-S3–S5)** |
| Browser text play UI | **Done (W2-S6)** — `/play` |
| Consequence precondition validation | **Done (W3-S2)** |
| Flag lifecycle rules | **Done (W3-S3)** — `packages/core/src/ledger/`, `docs/flag-lifecycle.md` |
| Ledger/debug UI | W3-S4+ |
| AI Gateway, DirectorAgent | Phase 2 (W4-*) |
| Temporary instance runtime | Phase 3 (W5-*) |
| Content libraries, WorldBlueprint, quest generation | Phase 5 extension (W7-S7+, W8-S6+) — scheduled only |
| Spire & gameplay systems (combat Tier A, progression, gear, RegionMap, SpireManifest, climb persistence) | W4-S8–S10, W5-S8–S13, W7-S12–S13, W8-S13–S20, W9-S7–S9, W12-S8 — scheduled only; **not startable at W2-S6** |

**Validation layers today:**

1. **Zod** — per-object shape (`WorldDefinitionSchema`, etc.).
2. **Cross-file** — `validateWorldDefinition()` (refs, duplicates, flags, reachability). Use before loading any world in runtime or accepting generated content.

---

## 8. Next step: W3-S4 — Build World Ledger UI panel

**Goal:** Show `activeFlags`, `resolvedFlags`, events, discovered locations, and unlocked goals in browser/debug UI (read-only).

**Allowed scope:** `apps/web/features/world-debug`, components, smoke tests.

**Blocked:** AI Gateway, cross-phase work beyond Phase 1 text runtime.

**Done when:** Panel renders ledger entries after a choice.

**After W3-S4:** W3-S5 Debug trace UI panel (unless human reorders).

---

## 9. Human decisions (cumulative)

| Decision | Detail |
| --- | --- |
| **Contract Option C** | v4.1 naming spine + v4.2 extensions; FULL_CURSOR §22 |
| **No separate contract file** | v4.2 lives in §22 only |
| **Stonepass ambition** | Rich showcase (v2) later; finish Phase 0 + v1 proof path first |
| **AI Director leeway** | AI proposes; engine owns ledger truth |
| **Package manager** | npm workspaces |
| **Git** | Agent should not commit unless asked |
| **Step tracker detail** | Five documentation columns required post-step (2026-05-28) |
| **Phase 5 extension tracker** | W7-S7–S11 libraries + W8-S6–S12 WorldBlueprint/quest rows in CSV (2026-05-28); implement when `Next` |
| **Spire product naming** | "Stonepass Valley" deprecated as product name; play **Stonepass Spire — Floor 1** at `/play`; Floors 1–3 map legacy Valley arc; ids/paths rename at W5-S13 (2026-05-29) |
| **Spire & gameplay systems tracker** | 23 rows interleaved W4–W12 (2026-05-29); Tier A combat only; Tier B needs README amendment; implement when `Next` |

---

## 10. Agent completion report template

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

## 11. Key commands

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
npm run dev    # http://localhost:3000 — home; /play for Stonepass (W2-S6)
```

---

## 12. Reference files (read order for new agent)

1. This file — `AGENT_SESSION_HANDOFF.md`
2. [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md#22-contract-v42-hybrid-addendum-implementation-tracking)
3. W2-S7 step card in FULL_CURSOR §17
4. [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — row W2-S7 (`Next`); **122 rows total**
5. `packages/core/src/runtime/` and `packages/core/src/world/` for conventions
6. `stonepass-valley.world.json` as reference content
7. [Future_Features/](./Future_Features/README.md) — long-term vision including Spire track (**not current implementation**)
8. FULL_CURSOR §13 *Spire & Gameplay Systems track* — when planning Phase 2+ work

---

## 13. Schema dependency graph (current)

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

DirectorDecision (W1-S7) ──► AIResult<T> (W1-S13) ──► FakeProvider (W1-S16, Done)
WorldDefinition ──► loadWorld (W2-S1) ──► initializeWorldSession (W2-S2)
  ──► selectStoryBeat (W2-S3) ──► resolvePlayerChoice (W2-S4) ──► applyPlayerChoice (W2-S5)
  ──► text play UI (W2-S6, Complete)
```

---

*End of agent session handoff. Next approved implement: **W3-S4 World Ledger UI panel**.*
