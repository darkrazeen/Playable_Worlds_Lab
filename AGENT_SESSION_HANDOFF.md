# Playable Worlds Lab — Agent Session Handoff

**Handoff date:** 2026-05-28  
**Last reconciled:** 2026-05-28  
**Workspace:** `Playable_Worlds_Lab`  
**Purpose:** Onboard a Cursor/agent on the current repo state, contract rules, Phase 0 complete, Phase 1 W2-S1–S5 complete, and the next approved step (**W2-S6**).

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
| 5 | [Future_Features/](./Future_Features/README.md) — specs for W7-S7+ / W8-S6+ (scheduled `Not started`; not current work) |

---

## 2. What this project is

**Playable Worlds Lab** is a schema-first, text-first **AI-directed world engine** where player choices change remembered world state.

- **First proof world:** Stonepass Valley (ogre bridge → choice branches → landslide → cave → dragon).
- **Not day one:** 3D metaverse, full economy, multiplayer, public UGC marketplace.
- **Long-term vision:** Rich Stonepass showcase (v2), AI Director variation, **player-themed worlds** (WorldBlueprint + content libraries — [Future_Features/Player_World_Generation_and_Content_Libraries.md](./Future_Features/Player_World_Generation_and_Content_Libraries.md)), **quest generation** ([Future_Features/Quest_Generation.md](./Future_Features/Quest_Generation.md), tracker W8-S9–S12), 2D/3D as output layers on same JSON.

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

### Phase 1 — in progress (5/7+ through W2-S7)

| Step | Name | Status |
| --- | --- | --- |
| W2-S1 | World JSON loader | **Complete** |
| W2-S2 | Initialize WorldSession | **Complete** |
| W2-S3 | Story beat selector | **Complete** |
| W2-S4 | Choice resolver | **Complete** |
| W2-S5 | Apply consequence through runtime | **Complete** |
| W2-S6 | Text play screen | **Next ← approved** |
| W2-S7+ | Path tests, W3 consequence engine | Not started |

**Engine loop (working in tests, not yet in browser):** `loadWorld` → `initializeWorldSession` → `selectStoryBeat` → `resolvePlayerChoice` → `applyPlayerChoice`

**Gap to close:** W2-S6 wires this loop into `apps/web`. The home page at `http://localhost:3000` is still a placeholder.

### Current snapshot (2026-05-28)

| Area | Status |
| --- | --- |
| Phase 0 schemas + validator | **Complete** (W1-S1–S16) |
| Stonepass canonical JSON | **Complete** — passes `parseAndValidateWorldDefinition` |
| FakeProvider | **Complete** — no real AI calls |
| Runtime core (load → consequence) | **Complete** (W2-S1–S5) |
| Browser text play UI | **Not started** — W2-S6 next |
| AI Gateway / Director | Phase 2 — not started |
| Temporary instance runtime | Phase 3 — not started |
| Tests | **200 passing** (28 files) |
| CI | `.github/workflows/ci.yml` — typecheck, lint, test |

### Phase 5 extension — scheduled, not current work

Tracker rows added 2026-05-28 (all `Not started` until human approval):

- **W7-S7–S11** — Content Libraries (schemas, queryLibrary, Stonepass + theme packs)
- **W8-S6–S8** — WorldBlueprint + Architect wiring
- **W8-S9–S12** — Quest generation (QuestBlueprint → merge into WorldDefinition)

Chain: W7-S6 → W7-S7 … → W7-S11 → W8-S1 … → W8-S5 → W8-S6 … → W8-S12 → W9-S1. See FULL_CURSOR *Phase 5 extension* and [Future_Features/](./Future_Features/README.md).

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
| Consequence apply | `runtime/applyConsequence.ts`, `applyConsequenceToLedger.ts` | `applyConsequence`, `applyPlayerChoice` |
| Content paths | `packages/content/src/paths.ts` | `contentRoot`, Stonepass paths |

Integration tests use `contentRoot = join(__dirname, "../../../content")`.

**W2-S1–S5 acceptance (met):**

- Loader returns typed `WorldDefinition` or `{ ok: false, errors }` without throwing on invalid input.
- Fresh Stonepass session starts at `beat_ogre_bridge` with empty ledger and turn 0.
- All five ogre bridge choices resolve; invalid/fake choices return structured errors.
- `applyPlayerChoice("fight_ogre")` updates flags, goals, locations, ledger events, choice history, debug trace, and turn number.
- Session validates after each update via `WorldSessionSchema`.

### 4.7 Documentation and process updates (2026-05-28)

- [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §17 step tracker rules; **Phase 5 extension** (W7-S7–W8-S12); replay layer 10 (content libraries).
- [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — W1-S1–S16 and W2-S1–S5 **Complete**; W2-S6 **Next**; W7-S7–S11 and W8-S6–S12 added as `Not started`.
- [Future_Features/](./Future_Features/README.md) — **19** brainstorm/spec docs; player world generation + quest specs linked to tracker rows (W7-S7+, W8-S6+; all `Not started`).
- [scripts/step-tracker-enrichment.json](./scripts/step-tracker-enrichment.json) — reference text for backfill.

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
  apps/web/                              # Next.js shell — placeholder home; W2-S6 world-play UI next
    app/
    features/                            # W2-S6 target: world-play
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
  Future_Features/                       # 19 brainstorm/spec docs
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
| Browser text play UI | **W2-S6 ← NEXT** |
| Consequence Engine core, ledger/debug UI | W3-* |
| AI Gateway, DirectorAgent | Phase 2 (W4-*) |
| Temporary instance runtime | Phase 3 (W5-*) |
| Content libraries, WorldBlueprint, quest generation | Phase 5 extension (W7-S7+, W8-S6+) — scheduled only |

**Validation layers today:**

1. **Zod** — per-object shape (`WorldDefinitionSchema`, etc.).
2. **Cross-file** — `validateWorldDefinition()` (refs, duplicates, flags, reachability). Use before loading any world in runtime or accepting generated content.

---

## 8. Next step: W2-S6 — Text play screen

**Goal:** Minimal browser text play screen for Stonepass choices wired to `@playable-worlds/core` runtime.

**Allowed scope:** `apps/web/features/world-play`, minimal components, smoke tests.

**Blocked:** Consequence Engine refactor (W3-S1), ledger/debug panels, AI Gateway, cross-phase work.

### Deliverables

1. **Play page** — load Stonepass, init session, show beat text + valid choice buttons.
2. **Wire runtime** — use `loadWorld`, `initializeWorldSession`, `selectStoryBeat`, `listAvailableChoices`, `applyPlayerChoice` (no direct ledger mutation in UI).
3. **Smoke test** — page renders and offers valid choices.
4. **Update step tracker CSV** — all documentation columns per §17.

**W2-S6 implementation notes:**

- Add `transpilePackages: ["@playable-worlds/core", "@playable-worlds/content"]` to `apps/web/next.config.ts` before importing workspace packages (see `apps/web/README.md`).
- Keep session state in React; call core runtime functions — never mutate ledger directly in UI.
- Server-side world load may need a thin API route or pre-bundled Stonepass JSON depending on Next.js server/client boundaries.

**Done when:** User can start Stonepass in browser and choose a valid action; smoke test passes.

**After W2-S6:** W2-S7 manual Stonepass path tests.

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
npm run dev    # http://localhost:3000 — placeholder home page until W2-S6
```

---

## 12. Reference files (read order for new agent)

1. This file — `AGENT_SESSION_HANDOFF.md`
2. [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md#22-contract-v42-hybrid-addendum-implementation-tracking)
3. W2-S6 step card in FULL_CURSOR
4. [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — row W2-S6 (`Next`)
5. `packages/core/src/runtime/` and `packages/core/src/world/` for conventions
6. `stonepass-valley.world.json` as reference content
7. [Future_Features/](./Future_Features/README.md) — long-term vision (not current implementation)

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
  ──► text play UI (W2-S6, Next)
```

---

*End of agent session handoff. Next approved implement: **W2-S6 text play screen** in `apps/web/features/world-play`.*
