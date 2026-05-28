# Player World Generation & Content Libraries

> **Living document** for the long-term product vision: players (and creators) generate themed worlds (lava world, machine planet, ocean world), set high-level beats/difficulty/gear bounds, and let the **AI Director** fill in validated detail — drawing from **reusable content libraries** of creatures, NPCs, encounters, and puzzles.
>
> **Status:** Approved product direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Quest_Generation.md](./Quest_Generation.md) (quest blueprints + regional quests), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- AI **never** directly mutates permanent world truth (`WorldLedger`, rewards outside bounds, unvalidated choices).
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| Player-themed world generation | Brainstorm / approved direction | Phase 5–7 (after Phase 0–4 gates) | 2026-05-28 |
| Content libraries (creatures, NPCs, encounters, puzzles) | Brainstorm / approved direction | Phase 5–7 (after Phase 3 instance runtime) | 2026-05-28 |
| Player world knobs (beats, difficulty, gear bounds) | Brainstorm / approved direction | Phase 5+ (extends WorldDNA + WorldBlueprint) | 2026-05-28 |

---

## One-line summary

Players pick a **theme and high-level knobs**; **WorldArchitect** assembles a validated `WorldDefinition` from **tagged library templates** and AI-authored glue; **AI Director** runs play-time flavor inside bounds; the **same deterministic engine** that runs Stonepass runs lava/ocean/machine worlds — secure, inspectable, shareable, and playtested before publish.

---

## Vision (what the player experiences)

```text
1. Player opens "Create World"
2. Chooses theme: lava world | machine planet | ocean world | custom prompt
3. Sets high-level knobs:
   - Beat outline (e.g. "crash landing → first settlement → boss gate")
   - Difficulty (easy / normal / hard)
   - Gear / reward profile (melee-heavy, tech gadgets, survival tools — bounded lists)
   - Session length, tone, safety mode (teen / adult)
4. WorldArchitect queries Content Libraries + AI Gateway
   → drafts WorldDNA, beats, choices, consequences, NPCs, instances
   → every piece validates (Zod + cross-file + health + playtester)
5. Player previews graph + health score → Approve or Regenerate
6. Play begins (text-first; 2D/3D later as output layer)
7. During play, AI Director:
   - selects variant text from approved pools
   - generates NPC reactions within tone/safety
   - suggests pacing/hints — visible in reasoning panel
   - NEVER writes ledger or exceeds reward/difficulty caps
8. World is saveable, shareable, forkable (Phase 6+) with version lineage
```

This is **not** infinite AI freestyle. It is **curated generation**: libraries + bounds + validation + engine truth.

---

## How this fits the existing architecture

| Existing piece | Role in this vision |
| --- | --- |
| `WorldDefinition` | Same top-level shape for Stonepass, lava world, ocean world |
| `WorldDNA` | Theme/tone/session/difficulty flavor at world level |
| `StoryBeat` + `PlayerChoice` + `Consequence` | Graph the Architect assembles |
| `WorldLedger` + `WorldSession` | Memory during play — engine-owned |
| `validateWorldDefinition` | Blocks broken generated worlds |
| `WorldArchitectAgent` (Phase 5, W7-*) | Prompt → world draft |
| `DirectorAgent` (Phase 2, W4-*) | Play-time suggestions + variant selection |
| `TemporaryInstance` + rooms (Phase 3, W5-*) | Encounter/puzzle spaces library entries plug into |
| `QuestBlueprint` ([Quest_Generation.md](./Quest_Generation.md)) | Per-quest reward/difficulty/criteria bounds |
| Share/fork/remix (Phase 6, W9–W10) | Portable worlds with lineage |
| AI Playtester (Phase 7, W11-*) | Blocks publish of broken generated worlds |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Four-layer model (foundation → flavor)

This extends the Quest_Generation three-layer model to **full worlds**:

```text
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 0 — Engine + validators (built now, Phase 0–1)            │
│  loadWorld → session → beat select → choice → consequence        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────v─────────────────────────────────┐
│  LAYER 1 — WorldBlueprint (player/creator knobs — NEW)           │
│  theme, beat outline, difficulty, gear/reward bounds, safety     │
│  Immutable bounds; AI cannot override                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │ constrains
┌───────────────────────────────v─────────────────────────────────┐
│  LAYER 2 — Content Libraries (NEW)                                 │
│  CreatureTemplate, NpcArchetype, EncounterTemplate,              │
│  PuzzleTemplate — validated, tagged, reusable                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │ WorldArchitect selects + adapts
┌───────────────────────────────v─────────────────────────────────┐
│  LAYER 3 — Generated WorldDefinition (Phase 5+)                  │
│  Beats, choices, consequences, NPCs, instances                   │
│  Must pass validateWorldDefinition before preview/save             │
└───────────────────────────────┬─────────────────────────────────┘
                                │ played
┌───────────────────────────────v─────────────────────────────────┐
│  LAYER 4 — Runtime flavor (Phase 2+ Director)                    │
│  Variant text, NPC lines, hints, pacing                          │
│  Must NOT mutate ledger or exceed Layer 1 bounds                 │
└─────────────────────────────────────────────────────────────────┘
```

**Quest generation** ([Quest_Generation.md](./Quest_Generation.md)) is a **module inside Layer 3**: a `QuestBlueprint` + `QuestDraft` merged into a `WorldDefinition`, using the same libraries for encounters/NPCs mid-quest.

---

## Layer 1 — WorldBlueprint (player high-level knobs)

**Who sets it:** Player at world creation, or creator in Cockpit (Phase 9+).  
**Who enforces it:** Validators at generation time + engine at apply time.

| Knob | Example values | Enforced how |
| --- | --- | --- |
| **Theme / prompt** | "lava world", "machine planet", "ocean world" | Maps to `WorldDNA.genre/tone` + library tag filters |
| **Beat outline** | 3–7 named beats ("crash", "first contact", "core breach") | Architect must emit beats matching outline IDs or slots |
| **Difficulty** | easy / normal / hard | Caps encounter severity, puzzle complexity, reward tier |
| **Gear / reward profile** | allowedGearIds[], rewardTierMax | Consequence engine clamps; see Quest reward bounds |
| **Session length** | 15 / 30 / 60 min target | Beat count + instance depth limits |
| **Safety mode** | teen / adult | All text + AI output filtered |
| **Archetype (optional)** | warrior / mage / rogue / diplomat | RunProfile flavor; conditional text (Replay layer 1) |

### Illustrative schema (not implemented)

```ts
type WorldBlueprint = {
  blueprintId: string;
  themePrompt: string; // "volcanic frontier with machine ruins"
  themeTags: string[]; // ["lava", "machine", "hostile_environment"]
  beatOutline: BeatOutlineSlot[]; // ordered high-level beats
  difficulty: "easy" | "normal" | "hard";
  rewardBounds: RewardBounds; // shared with QuestBlueprint
  gearProfile?: {
    allowedGearIds: string[];
    startingGearIds?: string[];
  };
  safetyMode: SafetyMode;
  sessionLengthMinutes: number;
  generationSeed?: string;
};

type BeatOutlineSlot = {
  slotId: string; // "beat_crash_landing"
  title: string;
  intent: string; // "Introduce hazard and first choice"
  isEnding?: boolean;
  allowedLibraryTags?: string[]; // encounters valid for this slot
};
```

**Immutable means:** Even if the model outputs a hard-mode boss on easy difficulty, validators reject or downgrade to blueprint caps.

---

## Layer 2 — Content Libraries (the new building block)

### Purpose

Instead of generating every creature, NPC, encounter, and puzzle from scratch per world, the system maintains **validated, tagged templates** the WorldArchitect and Director **query, adapt, and compose**.

Think: **monster manual + encounter deck + puzzle kit** — not random noise.

### Library entry types

| Template type | Contains | Used for |
| --- | --- | --- |
| **CreatureTemplate** | id, name, description variants, threat tier, theme tags, safety notes | Encounter flavor, instance enemies |
| **NpcArchetype** | Extends NPC shape: role, default attitude, toneRules, dialogue hooks | Populating world NPCs; Director reactions |
| **EncounterTemplate** | Room/interaction pattern: setup text, choice roles, consequence effect types | Instance rooms, beat midpoints |
| **PuzzleTemplate** | Completion condition pattern, hint tiers, failure consequence slot | Instance puzzles (Phase 3+) |
| **GearTemplate** (optional MVP+) | id, name, tier, tags | Reward bounds reference; flavor only until economy exists |

Each entry is **standalone valid JSON** with its own Zod schema. Entries do **not** go live in a world until referenced by a validated `WorldDefinition` or merged by Architect.

### Tagging model

Libraries are queryable by tags so "lava world" pulls coherent content:

```text
themeTags:     lava | ocean | machine | forest | urban
difficulty:    easy | normal | hard
contentKind:   creature | npc | encounter | puzzle | gear
safetyMode:    teen | adult
tone:          heroic | grim | cozy | mystery
```

**Query example (conceptual):**

```text
WorldBlueprint.themeTags = ["lava", "machine"]
difficulty = "normal"
→ EncounterTemplate query returns: "molten_guardian_sentry", "rust_swarm", ...
→ Architect adapts selected template into beat/instance with new IDs + consequence links
```

### Adaptation rules (Architect / Director)

When AI "gets creative," it may:

- Reskin description text to match theme (lava vs ocean)
- Pick among **allowed variants** for a template
- Wire template into a beat's `consequenceId` slots from blueprint
- Select Director variant from `allowedVariantIds` at play time

It may **not**:

- Change template threat tier above blueprint difficulty cap
- Add reward IDs outside `rewardBounds.allowedRewardIds`
- Insert unvalidated `PlayerChoice` into live session
- Skip validation because "the model said so"

### Package layout (proposed, when implemented)

```text
packages/content/
  libraries/
    creatures/
    npc-archetypes/
    encounters/
    puzzles/
    gear/
  library-index.json          # manifest + tags (or DB in Phase 6+)

packages/core/
  src/schemas/library/        # CreatureTemplateSchema, etc.
  src/validators/validateLibraryEntry.ts
  src/library/queryLibrary.ts # tag + difficulty filter
  src/library/adaptTemplate.ts  # theme reskin within bounds

packages/ai/agents/
  worldArchitectAgent.ts      # uses queryLibrary + compose draft
  libraryCuratorAgent.ts      # (optional) draft new templates for human approve
```

### Starter library content (dogfood order)

1. **Stonepass-native entries** — ogre as CreatureTemplate, elder as NpcArchetype, cave bats encounter, dragon chamber puzzle (extract from canonical JSON after Phase 3 instance runtime works)
2. **Theme packs (small)** — 5–10 entries each for `lava`, `ocean`, `machine` teen-safe
3. **Quest module entries** — Mosswood errand templates linked from [Quest_Generation.md](./Quest_Generation.md)

---

## Layer 3 — WorldArchitect composition flow

Extends existing Phase 5 steps (W7-S1–S6, W8-S1–S5):

```text
Input: WorldBlueprint + optional player prompt
  ↓
1. Generate / select WorldDNA from theme (W7-S2)
  ↓
2. Query Content Libraries by themeTags + difficulty
  ↓
3. For each BeatOutlineSlot:
     - pick EncounterTemplate / NpcArchetype / PuzzleTemplate
     - emit StoryBeat + PlayerChoices + Consequences (new IDs, linked refs)
  ↓
4. Merge QuestDraft modules if blueprint includes quests (Quest_Generation)
  ↓
5. validateWorldDefinition + health score + playtester
  ↓
6. Preview → human Approve → save world version (Phase 6 persistence)
```

**generationSeed** on `WorldDefinition` makes regeneration reproducible (same blueprint + seed → same draft for debugging).

---

## Layer 4 — AI Director at play time

See Phase 2 (W4-S4–S7). For generated worlds, Director additionally:

| Allowed | Not allowed |
| --- | --- |
| Pick variant text from `allowedVariantIds` | Change reward tables |
| NPC reaction lines (NPCReactionAgent) | Add new choices to live graph |
| Hints, recap, session wrap-up suggestion | Set flags on ledger directly |
| Suggest next beat **within validated graph** | Bypass safetyMode |

**Director reasoning panel** (W4-S7) is the primary UX for "watching AI decide" — shows action, targetId, reason, confidence, fallbackUsed, validationErrors.

---

## Security, safety, and shareability

| Concern | Approach |
| --- | --- |
| **Validation** | No world publishes without `validateWorldDefinition` + health threshold |
| **Safety** | teen/adult on blueprint; filter AI text; block terms list (README safety gates) |
| **Secrets** | No API keys in content; env vars only (W4-S3) |
| **Share** | Phase 6: share tokens, world_versions table (W9-S2–S6) — generated worlds are versioned like Stonepass |
| **Fork/remix** | W10-*: fork copies definition; remix may patch WorldDNA within validator |
| **Public UGC** | Explicitly gated — no marketplace/discovery until health + safety policy (README blocked scope) |
| **Anti-cheat on rewards** | Engine clamps to `rewardBounds`; DebugEvent logs clamp/reject |
| **Explainability** | Every variation traceable: blueprintId, libraryEntryId, variantId, seed, Director decision |

---

## Replay variation (how libraries increase fun)

Combines FULL_CURSOR §1 replay layers with libraries:

| Layer | Library role |
| --- | --- |
| Consequence branches (layer 3) | Authored in world graph — unchanged |
| Conditional text (layer 4) | Variant pools on templates + beats |
| NPC memory (layer 5) | NpcArchetype + consequence npcUpdates |
| Instance variants (layer 6) | EncounterTemplate / PuzzleTemplate swaps per theme |
| Director variation (layer 7) | Picks variants, reactions, hints per session state |
| Remix/fork (layer 8) | New blueprint + library query → new world version |
| Generated world (layer 9) | Full Architect pass from player knobs |

**Guardrail (unchanged):** Every variation explainable by profile, route, seed, flag, library entry, or validated AI suggestion — not random improvisation.

---

## Phase dependency map (when to build what)

**Do not skip gates.** Approximate order:

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | Phase 0 complete ✅ | Schemas, Stonepass JSON, validator, FakeProvider |
| 2 | Phase 1 in progress (W2-S6 next) | Browser play of authored Stonepass |
| 3 | Phase 1 complete (W3-*) | Full consequence engine, ledger/debug UI |
| 4 | Phase 2 (W4-*) | AI Gateway, Director, NPC reactions, reasoning panel |
| 5 | Phase 3 (W5-*) | Instance runtime — **encounters/puzzles become playable spaces** |
| 6 | Phase 6 prep (W9-*) | Persistence — libraries/worlds in DB |
| 7 | **NEW: Library schemas + query API** | Tagged templates, validateLibraryEntry |
| 8 | Phase 5 (W7–W8) WorldArchitect | Prompt/blueprint → world draft |
| 9 | **NEW: QuestBlueprint schema + generateQuest** | Regional quests inside worlds ([Quest_Generation.md](./Quest_Generation.md)) |
| 10 | **NEW: WorldBlueprint + player create UI** | Theme + knobs → Architect input |
| 11 | Phase 6 (W10) fork/remix | Share generated worlds |
| 12 | Phase 7 (W11) playtester | Auto-block broken generated content |
| 13 | Phase 9 Creator Cockpit | Preview, approve, regenerate, library editor |

**Libraries are most valuable after Phase 3** — encounters and puzzles are structured runtime objects, not just schema fields.

---

## Relationship to Quest_Generation.md

| Quest_Generation | This document |
| --- | --- |
| `QuestBlueprint` — bounds for **one quest** | `WorldBlueprint` — bounds for **entire world** |
| `QuestArchitectAgent` — draft quest graph | `WorldArchitectAgent` — draft full world |
| Quest uses encounters/NPCs from libraries | Same libraries; quest is a subgraph module |
| Reward clamping per quest | Reward clamping per world + per quest |
| Regional offer → mini-adventure | One beat chain inside generated world |

**Implementation order recommendation:**

1. Ship QuestBlueprint + `generateQuest()` **inside** a hand-authored world (Stonepass + one Mosswood slot) — smaller surface
2. Add Content Libraries with Stonepass extraction + one theme pack
3. Add WorldBlueprint + full player world generation once Architect + libraries + playtester exist

---

## Proposed step-tracker additions (approved in CSV 2026-05-28)

These step IDs are **in** [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](../Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) and summarized in FULL_CURSOR *Phase 5 extension*. **Do not implement until each row is human-approved as `Next`.**

### Phase 5 extension — Content Libraries (new week or W7-S7+)

| Step ID | Name | Goal |
| --- | --- | --- |
| W7-S7 | Create library entry schemas | CreatureTemplate, NpcArchetype, EncounterTemplate, PuzzleTemplate Zod schemas |
| W7-S8 | Create validateLibraryEntry | Per-entry validation + tag rules |
| W7-S9 | Create queryLibrary API | Filter by themeTags, difficulty, safetyMode |
| W7-S10 | Seed Stonepass library pack | Extract ogre, elder, cave encounter/puzzle from canonical world |
| W7-S11 | Seed theme packs (lava/ocean/machine) | Minimal teen-safe starter entries per theme |

### Phase 5 extension — WorldBlueprint (after W8 graph generator)

| Step ID | Name | Goal |
| --- | --- | --- |
| W8-S6 | Create WorldBlueprint schema | Player knobs: theme, beat outline, difficulty, reward/gear bounds |
| W8-S7 | Wire Architect to WorldBlueprint | Generation respects blueprint caps |
| W8-S8 | Wire Architect to queryLibrary | Draft world composes library templates |

### Phase 5 extension — Quest generation (from Quest_Generation.md)

| Step ID | Name | Goal |
| --- | --- | --- |
| W8-S9 | Create QuestBlueprint schema | Per-quest bounds (see Quest_Generation.md) |
| W8-S10 | Create validateQuestDraft | Graph rules for quest packages |
| W8-S11 | Build generateQuest API | QuestArchitectAgent orchestration |
| W8-S12 | Merge QuestDraft into WorldDefinition | Preview + validate merged world |

### Phase 5 UI — Player create flow

| Step ID | Name | Goal |
| --- | --- | --- |
| W7-S6+ | Extend world-create preview | Show blueprint knobs + library picks + health score |
| W12-S* | Creator Cockpit (existing phase) | Library editor, approve/regenerate, publish policy |

*Exact W12 step IDs exist in FULL_CURSOR for Creator Cockpit — link library editor there rather than duplicating.

---

## Definition of done (player world generation v1)

Treat **player world generation v1** as done when:

- [ ] Player can set theme + difficulty + 3–5 beat outline + gear/reward bounds via UI
- [ ] WorldArchitect produces a `WorldDefinition` using ≥1 library entry per theme pack
- [ ] Draft passes `validateWorldDefinition` + health score threshold
- [ ] Player can preview graph and play text-first start in browser
- [ ] AI Director adds variant/NPC flavor without ledger mutation; reasoning panel visible
- [ ] Playtester flags deliberately broken draft; auto-merge blocked by default
- [ ] World saves with version id; share link works (Phase 6)
- [ ] At least one quest module (Mosswood-style) generatable inside a generated world ([Quest_Generation.md](./Quest_Generation.md) v1)
- [ ] Documentation: this section status → **Implemented** with code links

---

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Library + Architect scope explosion | MVP = 3 theme packs × ~10 entries; one world blueprint shape |
| Generic "samey" generated worlds | Theme tags + variant pools + health "consequence quality" |
| AI invents invalid mechanics | Structured output + Zod + validateWorldDefinition |
| Libraries stale vs generated text | Curator agent drafts templates → human approve → library version bump |
| Difficulty meaningless without combat math | Use tier enums + flag consequences until full economy (README MVP rule) |
| Player expects instant AAA variety | Set expectation: text-first proof → showcase v2 → visual layers Phase 8+ |

---

## Open questions (resolve before implementing W7-S7+ / W8-S6+)

1. **Library storage:** JSON files in repo vs DB table (Phase 6+) vs hybrid?
2. **WorldBlueprint vs WorldDNA overlap:** Merge into extended WorldDNA or separate contract referenced by `WorldDefinition`?
3. **Player-triggered generation:** Creators-only until Phase 7 playtester gates pass?
4. **Gear without economy:** Flags/tiers only in MVP, or lightweight GearTemplate schema day one?
5. **Library versioning:** Separate `libraryVersion` from `schemaVersion`?
6. **Merge model for quests:** Append quest module vs overlay by `questId`? (see Quest_Generation open questions)

---

## References

- [Quest_Generation.md](./Quest_Generation.md) — quest blueprint, generateQuest, reward clamping
- [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](../Playable_Worlds_Lab_v4_1_FULL_CURSOR.md) — §1 Replay Variation, Phase 5–7 step cards
- [AGENT_SESSION_HANDOFF.md](../AGENT_SESSION_HANDOFF.md) — AI proposes / engine executes
- Phase 5 tracker rows: W7-S1–S11 (WorldArchitect, preview, **content libraries**), W8-S1–S12 (graph generator, **WorldBlueprint**, **quest generation**)
- Phase 3: W5-S3 encounter, W5-S4 puzzle (runtime targets for library entries)

---

## Adding to step tracker — instructions for maintainers

See [How to update FULL_CURSOR and the step tracker](#how-to-update-full_cursor-and-the-step-tracker) in project docs or the summary provided when this file was added (2026-05-28).
