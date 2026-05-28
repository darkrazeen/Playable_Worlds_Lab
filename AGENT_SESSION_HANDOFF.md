# Playable Worlds Lab — Agent Session Handoff

**Handoff date:** 2026-05-28  
**Workspace:** `Playable_Worlds_Lab`  
**Purpose:** Onboard a Cursor/agent on the current repo state, contract rules, work completed through Phase 0 W1-S14, and the next approved step.

---

## 1. Read this first (agent rules)

1. **One step at a time** — Implement only the human-approved step from the tracker. Stop after completion report.
2. **Core mantra:** AI proposes → Validators check → The game engine executes.
3. **Do not jump phases** — No runtime, UI game logic, AI Gateway, 2D/3D, multiplayer, or UGC until phase gates pass.
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
| 5 | [Future_Features/](./Future_Features/README.md) (not step-tracker work) |

---

## 2. What this project is

**Playable Worlds Lab** is a schema-first, text-first **AI-directed world engine** where player choices change remembered world state.

- **First proof world:** Stonepass Valley (ogre bridge → choice branches → landslide → cave → dragon).
- **Not day one:** 3D metaverse, full economy, multiplayer, public UGC marketplace.
- **Long-term vision:** Rich Stonepass showcase (v2), then AI Director variation, quest generation, 2D/3D as output layers on same JSON.

```text
WorldDefinition → StoryBeats → PlayerChoices → Consequences → WorldLedger
→ WorldSession (save-state) → runtime applies consequences → DebugEvent trace
→ AI Director suggests (AIResult wrapper) → engine executes
```

---

## 3. Phase 0 progress (step tracker)

Tracked in [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv).

| Step | Name | Status |
| --- | --- | --- |
| W1-S1 | Repo and app skeleton | **Done** |
| W1-S2 | WorldDNA schema | **Done** |
| W1-S3 | PlayerChoice schema | **Done** |
| W1-S4 | StoryBeat schema | **Done** |
| W1-S5 | Consequence schema | **Done** |
| W1-S6 | WorldLedger + WorldEvent | **Done** |
| W1-S7 | DirectorDecision schema | **Done** |
| W1-S8 | TemporaryInstance schema | **Done** |
| W1-S9 | NPC schema | **Done** |
| W1-S10 | WorldDefinition schema | **Done** |
| W1-S11 | WorldSession schema | **Done** |
| W1-S12 | DebugEvent schema | **Done** |
| W1-S13 | AIResult contract | **Done** |
| W1-S14 | validateWorldDefinition | **Done** |
| W1-S15 | Stonepass Valley world JSON | **Next ← approved** |
| W1-S16 | FakeProvider + AIProvider | Not started |
| W2-S1+ | Phase 1 text runtime | Not started |

**Phase 0 completion:** 14 / 16 steps (87.5%).

Detailed per-step notes (implementation, relevance, future impact, tests) are in the CSV documentation columns — see §5.

---

## 4. Work completed (cumulative through W1-S14)

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

Tests: `packages/core/tests/unit/validators/validateWorldDefinition.test.ts` (11 tests).

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

**Not yet:** canonical full Stonepass world at `packages/content/worlds/stonepass/` (W1-S15). The minimal world example is a **composition demo**, not the production world file.

### 4.6 Documentation and process updates (2026-05-28)

- [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §17 *Step tracker CSV* expanded with five documentation columns; all step cards include CSV update bullet.
- [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — W1-S1–S14 backfilled; W1-S15 marked `Next`.
- [scripts/step-tracker-enrichment.json](./scripts/step-tracker-enrichment.json) — source text for backfill (reference only).
- [scripts/merge-step-tracker-columns.mjs](./scripts/merge-step-tracker-columns.mjs) — optional merge helper if columns are re-added.

### 4.7 Verification state (2026-05-28)

```bash
npm test         # 142 tests passing (15 test files)
npm run typecheck
npm run lint
npm run build
```

Test layout:

- `tests/smoke.test.ts` (1)
- `packages/core/tests/unit/schemas/*.test.ts` (12 files)
- `packages/core/tests/unit/validators/validateWorldDefinition.test.ts` (1)
- `packages/core/tests/unit/debug/appendDebugEvent.test.ts` (1)

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
  apps/web/                              # Next.js shell (no game logic)
  packages/
    core/
      src/schemas/                       # All Zod contracts
      src/validators/                    # validateWorldDefinition (W1-S14)
      src/debug/                         # appendDebugEvent (W1-S12)
      src/index.ts                       # Re-exports schemas + validators + debug
      tests/unit/schemas/
      tests/unit/validators/
      tests/unit/debug/
    ai/                                    # Stub — W1-S16 FakeProvider goes here
    content/examples/                    # JSON fixtures (not canonical Stonepass world)
  scripts/
    step-tracker-enrichment.json         # Tracker backfill reference
    merge-step-tracker-columns.mjs
  tests/smoke.test.ts
  Playable_Worlds_Lab_v4_1_FULL_CURSOR.md
  Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv
  AGENT_SESSION_HANDOFF.md               # This file
  Future_Features/
```

---

## 7. What is NOT built yet

| Item | Step |
| --- | --- |
| Full Stonepass JSON at `packages/content/worlds/stonepass/` | **W1-S15 ← NEXT** |
| `AIProvider` + `FakeProvider` | W1-S16 |
| World loader | W2-S1 |
| Session init at runtime | W2-S2 |
| Choice resolver, consequence engine, text play UI | W2-S4–S6, W3-* |
| AI Gateway, DirectorAgent | Phase 2 (W4-*) |
| Temporary instance runtime | Phase 3 (W5-*) |

**Validation layers today:**

1. **Zod** — per-object shape (`WorldDefinitionSchema`, etc.).
2. **Cross-file** — `validateWorldDefinition()` (refs, duplicates, flags, reachability). Use before loading any world in runtime or accepting generated content.

---

## 8. Next step: W1-S15 — Stonepass Valley world JSON

**Goal:** Author the canonical Stonepass v1 proof world as validated `WorldDefinition` JSON.

**Allowed scope:** `packages/content/worlds/stonepass/`, examples, validation tests.

**Blocked:** Runtime, UI, AI providers, cross-phase work.

### Deliverables

1. **`packages/content/worlds/stonepass/stonepass-valley.world.json`** (or agreed filename)
   - `schemaVersion: "0.2.0"`
   - Ogre bridge with **fight / trick / feed / talk / sneak**
   - Fully authored consequences (not one-line stubs)
   - Proof chain: flagship **landslide → hidden cave instance → dragon_awake** via post-ogre beats and flags
   - NPCs: ogre, elder (align with existing examples where possible)

2. **Integration test** — load JSON → `parseWorldDefinition` → `validateWorldDefinition` → `ok: true`

3. **Invalid fixture** (inline or `examples/`) — broken world fails validator

4. **Update step tracker CSV** — all documentation columns per §17

### Reference material

- Start from [world-definition-stonepass-minimal.example.json](./packages/content/examples/world-definition-stonepass-minimal.example.json) (already passes validator; expand graph for v1 chain)
- README [Stonepass minimal proof chain](./README.md#minimal-proof-chain-stonepass-v1--gate)

**Done when:** Stonepass is fully represented in JSON under `worlds/stonepass/` and passes schema + cross-file validation.

**After W1-S15:** W1-S16 FakeProvider → Phase 1 W2-S1 world loader.

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
npm run dev    # http://localhost:3000 — web shell only
```

---

## 12. Reference files (read order for new agent)

1. This file — `AGENT_SESSION_HANDOFF.md`
2. [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md#22-contract-v42-hybrid-addendum-implementation-tracking)
3. W1-S15 step card in FULL_CURSOR (§17)
4. [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — row W1-S15 (`Next`)
5. `packages/core/src/schemas/` and `packages/core/src/validators/` for conventions
6. `world-definition-stonepass-minimal.example.json` as starting content

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

DirectorDecision (W1-S7) ──► AIResult<T> (W1-S13) ──► FakeProvider (W1-S16, next after Stonepass JSON)
```

---

*End of agent session handoff. Next approved implement: **W1-S15 Stonepass Valley world JSON** at `packages/content/worlds/stonepass/`.*
