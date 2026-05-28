# Playable Worlds Lab — Agent Session Handoff

**Handoff date:** 2026-05-26  
**Workspace:** `Playable_Worlds_Lab`  
**Purpose:** Onboard a Cursor/agent on the current repo state, contract rules, work completed this session, and the next approved step.

---

## 1. Read this first (agent rules)

1. **One step at a time** — Implement only the human-approved step from the tracker. Stop after completion report.
2. **Core mantra:** AI proposes → Validators check → The game engine executes.
3. **Do not jump phases** — No runtime, UI game logic, AI Gateway, 2D/3D, multiplayer, or UGC until phase gates pass.
4. **Schema-first** — Zod schemas + tests + examples before runtime depends on data.
5. **Do not invent object shapes** — Use contracts in FULL_CURSOR §9 + §22.

### Source priority

| Priority | Source |
| --- | --- |
| 1 | [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §22 on conflicts, otherwise §9 and step cards |
| 2 | Human-approved step prompt |
| 3 | Repository code in `packages/core` |
| 4 | [README.md](./README.md), [PROJECT_CONTEXT_Playable_Worlds_Lab.md](./PROJECT_CONTEXT_Playable_Worlds_Lab.md) (secondary) |
| 5 | [Future_Features/](./Future_Features/README.md) (not step-tracker work) |

---

## 2. What this project is

**Playable Worlds Lab** is a schema-first, text-first **AI-directed world engine** where player choices change remembered world state.

- **First proof world:** Stonepass Valley (ogre bridge → choice branches → landslide → cave → dragon).
- **Not day one:** 3D metaverse, full economy, multiplayer, public UGC marketplace.
- **Long-term vision:** Rich Stonepass showcase (v2), then AI Director variation, quest generation, 2D/3D as output layers on same JSON.

```text
WorldDefinition → StoryBeats → PlayerChoices → Consequences → WorldLedger
→ (later) WorldSession runtime → AI Director suggests → engine executes
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
| W1-S13 | AIResult contract | **Not started ← NEXT** |
| W1-S14 | validateWorldDefinition | Not started |
| W1-S15 | Stonepass Valley world JSON | Not started |
| W1-S16 | FakeProvider + AIProvider | Not started |
| W2-S1+ | Phase 1 text runtime | Not started |

**Phase 0 completion:** 12 / 16 steps (75%).

---

## 4. Work completed this session

### 4.1 Schemas implemented (W1-S5 → W1-S10)

All live in `packages/core/src/schemas/` with unit tests in `packages/core/tests/unit/schemas/`.

| Schema | File | Notes |
| --- | --- | --- |
| `ConsequenceSchema` | `consequence.ts` | Flags, goals, locations, structured `npcUpdates`, `temporaryInstances` |
| `WorldLedgerSchema` | `worldLedger.ts` | v4.2 ledger fields + `WorldEventSchema` |
| `DirectorDecisionSchema` | `directorDecision.ts` | v4.1 action enum |
| `TemporaryInstanceSchema` | `temporaryInstance.ts` | + `TemporaryInstanceRoomSchema` |
| `NpcSchema` | `npc.ts` | Ogre/elder profiles |
| `WorldDefinitionSchema` | `worldDefinition.ts` | Composes all above |
| `CURRENT_SCHEMA_VERSION` | `schemaVersion.ts` | `"0.2.0"` |

Pre-existing (before this session): `worldDna.ts`, `safetyMode.ts`, `playerChoice.ts`, `storyBeat.ts`.

Exports: `packages/core/src/schemas/index.ts` → `@playable-worlds/core`.

### 4.2 Contract v4.2 hybrid (Option C — human approved)

Mid-session, schemas were **realigned** from an earlier README-driven shape to match v4.1 FULL_CURSOR §9 **plus v4.2 extensions**.

**Documented in:** [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md#22-contract-v42-hybrid-addendum-implementation-tracking) (Decision Log entry dated 2026-05-26).

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

#### v4.2 extensions kept (beyond v4.1 §9)

- **WorldLedger:** `activeFlags`, `completedGoals`
- **Consequence:** `completeGoals`, `exposeLocations`, `closeLocations`, structured `npcUpdates`
- **TemporaryInstance:** optional `description`, `remain_inactive` cleanup, room `connectedRoomIds`
- **NPC:** extended attitude enum (`trusting`, `fearful`, etc.)

### 4.3 Example JSON fixtures

All in `packages/content/examples/`:

| File | Validates |
| --- | --- |
| `world-dna-teen.example.json` | WorldDNA |
| `player-choice-valid.example.json` | PlayerChoice |
| `story-beat-ogre-bridge.example.json` | StoryBeat (5 ogre choices) |
| `consequence-fight-ogre.example.json` | Consequence |
| `world-ledger-post-ogre.example.json` | WorldLedger |
| `director-decision-suggest-beat.example.json` | DirectorDecision |
| `temporary-instance-hidden-cave.example.json` | TemporaryInstance |
| `npc-ogre.example.json`, `npc-elder.example.json` | NPC |
| `world-definition-stonepass-minimal.example.json` | WorldDefinition (schema demo) |

**Note:** `world-definition-stonepass-minimal.example.json` is a **schema composition demo**, not the full W1-S15 Stonepass world file.

### 4.4 Documentation updates

- [README.md](./README.md) — Implementation progress through W1-S10, v4.2 contract note
- [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §22 addendum + Decision Log; Cursor reading instructions point to §22

### 4.5 Verification state (end of session)

```bash
npm test         # 97 tests passing
npm run typecheck
npm run lint
npm run build
```

---

## 5. Repository layout (relevant paths)

```text
playable-worlds-lab/
  apps/web/                          # Next.js placeholder (no game logic)
  packages/
    core/
      src/schemas/                   # All Zod schemas (Phase 0)
      src/schemas/schemaVersion.ts   # CURRENT_SCHEMA_VERSION = "0.2.0"
      tests/unit/schemas/            # 97 tests total incl. smoke
    ai/                              # Stub (Phase 2+)
    content/examples/                # JSON fixtures
  tests/smoke.test.ts
  Playable_Worlds_Lab_v4_1_FULL_CURSOR.md   # Source of truth
  Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv
  README.md
  AGENT_SESSION_HANDOFF.md             # This file
  Future_Features/                   # Quest generator etc. — not current steps
```

---

## 6. What is NOT built yet

| Item | Step |
| --- | --- |
| `WorldSession` schema | W1-S11 |
| `DebugEvent` schema | W1-S12 |
| `AIResult` wrapper | W1-S13 |
| `validateWorldDefinition.ts` (graph/reference checks) | W1-S14 |
| Full Stonepass JSON at `packages/content/worlds/stonepass/` | W1-S15 |
| FakeProvider / AIProvider | W1-S16 |
| World loader, consequence engine, text play UI | Phase 1 (W2-*) |
| AI Gateway, DirectorAgent | Phase 2 |
| Temporary instance runtime | Phase 3 |

**Important:** W1-S10 `WorldDefinitionSchema` validates **object shape only**. It does **not** check that `startingBeatId` exists, `consequenceId`s resolve, or graphs are reachable — that is **W1-S14**.

---

## 7. Human decisions from this session

| Decision | Detail |
| --- | --- |
| **Contract Option C** | v4.1 naming spine + v4.2 extensions; documented in FULL_CURSOR §22 |
| **No separate contract file** | v4.2 lives in FULL_CURSOR §22 only (not a standalone addendum file) |
| **Stonepass ambition** | User wants rich showcase content eventually (v2); still finish Phase 0 gate + v1 proof path first |
| **AI Director leeway** | Runtime flavor + author-time generation with validate/approve; engine owns ledger truth |
| **Package manager** | npm workspaces |
| **Git** | User may use GitHub Desktop; agent should not commit unless asked |

---

## 8. Next step: W1-S11 — WorldSession schema

**Goal:** Create current play-state contract for beat, ledger, active instance, turn number, choice history, debug events.

**Allowed scope:** `packages/core/schemas`, `packages/core/session` (if needed), tests, examples.

**Blocked:** Runtime, UI, AI providers, cross-phase work.

### Expected shape (from FULL_CURSOR §9 + §22)

Use v4.2 field names. Reference §9 `WorldSession` and align ledger to `WorldLedgerSchema`:

```ts
// Illustrative — implement via Zod in repo
type WorldSession = {
  id: string;
  schemaVersion: string;        // "0.2.0"
  worldId: string;
  worldVersionId: string;
  currentBeatId: string;
  ledger: WorldLedger;
  activeTemporaryInstanceId?: string;
  currentTemporaryRoomId?: string;
  turnNumber: number;
  choiceHistory: string[];
  debugEvents: DebugEvent[];      // W1-S12 may define DebugEvent — check step order
};
```

**Note:** Step card W1-S11 lists `debugEvents` as required. W1-S12 creates `DebugEvent` schema. Options for agent:
- Implement minimal `DebugEventSchema` stub in W1-S11 if W1-S12 is next immediately, **or**
- Follow step card strictly and implement W1-S11 only — read W1-S11 step card in FULL_CURSOR for exact validator requirements.

**Done when:** New session parses; malformed ledger / `currentBeatId` / turn number fail.

**After W1-S11:** W1-S12 DebugEvent → W1-S13 AIResult → W1-S14 validator → W1-S15 Stonepass JSON → W1-S16 FakeProvider.

---

## 9. Agent completion report template

After each step, report:

1. Task completed (step ID)
2. Files changed and why
3. Tests run and exact result
4. Acceptance criteria evidence
5. Validation/fallback added (if any)
6. Human action required (if any)
7. Blocked items intentionally not touched
8. Next safe step only
9. **Update step tracker CSV** — Required by [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §17](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md#17-step-cards-and-cursor-prompts) (*Step tracker CSV*). Update [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv): set `Status` to `Complete`, fill `Completion Evidence`, and update contract columns if scope shifted.

---

## 10. Key commands

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
npm run dev    # http://localhost:3000 — web shell only
```

---

## 11. Reference files (read order for new agent)

1. This file — `AGENT_SESSION_HANDOFF.md`
2. [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md §22](./Playable_Worlds_Lab_v4_1_FULL_CURSOR.md#22-contract-v42-hybrid-addendum-implementation-tracking) — contract v4.2
3. W1-S11 step card in FULL_CURSOR (§17 step cards)
4. [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv)
5. Existing schemas in `packages/core/src/schemas/` for conventions
6. [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](./Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — update after each step (Status, Completion Evidence, contract deltas)

---

## 12. Schema dependency graph (current)

```text
SafetyMode ──┐
WorldDNA ────┼──► WorldDefinition (W1-S10)
PlayerChoice ┼──► StoryBeat (W1-S4) ──┐
             │                         ├──► WorldDefinition
Consequence (W1-S5) ───────────────────┤
Npc (W1-S9) ───────────────────────────┤
TemporaryInstance (W1-S8) ─────────────┘

WorldLedger (W1-S6) ──► WorldSession (W1-S11, next)
DirectorDecision (W1-S7) ──► Phase 2 AI (not yet)
```

---

*End of agent session handoff. Next approved implement: **W1-S13 AIResult contract**.*
