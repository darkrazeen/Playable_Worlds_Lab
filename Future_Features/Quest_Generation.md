# Future Features & Brainstorm Log

> **Living document** for quest generation architecture and phase gates. **Tracker rows W8-S9–S12** were added 2026-05-28 — implement only when each step is human-approved as `Next`.

**Rules for this file:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates in `README.md`.
- Every feature must respect: **AI proposes → validators check → deterministic engine executes.**
- When a feature ships, move its status to **Implemented** and link to code paths / steps; trim obsolete speculation.
- Add new features as new `##` sections (newest brainstorm at bottom, or use dated subsections).

**Related docs:**

- [README.md](../README.md) — product spec, roadmap, Stonepass, regional quest reference scenario
- [AGENT_SESSION_HANDOFF.md](../AGENT_SESSION_HANDOFF.md) — Cursor/agent onboarding and rules
- [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](../Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv) — execution steps
- [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) — full-world generation, content libraries, WorldBlueprint (parent vision)

---

## Feature index

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| [Quest generator](#quest-generator) | Brainstorm / approved direction | Phase 5–7 (after Phase 0–4 gates) | 2026-05-26 |
| [Quest foundation vs AI flavor](#quest-foundation-vs-ai-flavor-creator-contract) | Approved design direction | Phase 0–2+ (schema/runtime), generator Phase 5+ | 2026-05-26 |
| [Player world generation](../Player_World_Generation_and_Content_Libraries.md) | See linked doc | Phase 5–7 | 2026-05-28 |

---

## Quest foundation vs AI flavor (creator contract)

### Status

**Approved product direction** — the creator (you) lays the **quest foundation**; AI adds **flavor and scenario variation** only inside immutable bounds. Aligns with project rule: **AI proposes → validators check → engine executes.**

### Summary

| Layer | Who owns it | Can change at runtime? |
| --- | --- | --- |
| **Quest blueprint** (foundation) | Human author / designer | No — hardcoded parameters |
| **Quest content graph** (beats, choices, consequence *slots*) | Human + optional generator *within* blueprint | Only via validated publish/merge |
| **Scenario flavor** (text, NPC tone, set dressing, pacing) | AI Director (+ optional draft agent) | Yes — per run, within bounds |
| **Rewards & progression truth** | Engine applies **clamped** consequences from blueprint | AI cannot exceed bounds |

**Your example (XP / rewards):** Quest may always grant experience or loot, but only **within min/max and allowed reward IDs** you define. AI may create **different scenarios in between** (dialogue, encounters, hints, branch emphasis)—not different payout tables.

---

### Two-layer model

```text
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 — QuestBlueprint (immutable foundation)             │
│  You define: type, direction, rules, criteria, reward bounds   │
└──────────────────────────────┬──────────────────────────────┘
                               │ constrains
                               v
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2 — Playable graph (validated structure)              │
│  StoryBeats, PlayerChoices, Consequences (slots + effects)    │
│  Authored by hand OR generated draft → validate → approve    │
└──────────────────────────────┬──────────────────────────────┘
                               │ played
                               v
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3 — Runtime flavor (AI Director, per session)         │
│  NPC lines, recaps, hints, scenario emphasis, variant text   │
│  Must NOT: mutate ledger, exceed rewards, add unvalidated     │
│            choices that change payout or completion rules     │
└─────────────────────────────────────────────────────────────┘
```

---

### Layer 1 — What you hardcode (AI cannot override)

These fields live in a **`QuestBlueprint`** (or `QuestTemplate`) object—authored by you, validated once, referenced by quest ID. AI agents receive them as **read-only context** in prompts and runtime.

| Category | Examples (illustrative) | Enforced by |
| --- | --- | --- |
| **Quest type** | `fetch`, `rescue`, `explore`, `escort`, `regional_offer` | Enum in schema; validator rejects unknown type |
| **Direction** | Premise, tone, region, target NPC/faction, success definition | Blueprint text + `WorldDNA` alignment |
| **Rules** | Max steps, time/turn limits, fail conditions, re-offer policy, PvP/combat allowed | Blueprint rules object; playtester checks |
| **Criteria** | Required flags to start; completion flag/goal; optional optional objectives | `successCriteria` / `failCriteria` in blueprint |
| **Reward bounds** | `xpMin`/`xpMax`, `goldMin`/`goldMax`, `allowedRewardIds[]`, `rewardTier` cap | Consequence Engine **clamps**; validator rejects out-of-range consequence definitions |
| **Safety** | `safetyMode: teen \| adult` | Zod + content filters on AI *and* authored text |
| **Choice slots** | Which choice *roles* exist (`accept`, `decline`, `resolve_puzzle`, …) and which consequence *kinds* each may trigger | Blueprint maps slot → allowed effect types |

**Immutable means:** Even if the model outputs “grant 5000 XP,” the runtime ignores or clamps to `xpMax` and logs `ai.rejected` / `consequence.clamped` on `DebugEvent`.

**MVP note:** Full RPG stats/economy are out of MVP scope in README. Early implementation can use **flags + tier enums** (e.g. `reward_tier_2`) and numeric bounds on consequences until a full inventory/XP system exists.

---

### Layer 2 — Structure AI may help fill (still validated)

Between foundation and flavor, the **graph** must exist as data:

- Offer beat + accept/decline (or type-specific slots from blueprint)
- Mid-quest beats or temporary instance rooms
- Each `PlayerChoice` → `consequenceId` with effects drawn from **allowed effect types** in blueprint

**Quest generator** (future) fills Layer 2 **only inside Layer 1 bounds**:

- Proposes beat IDs, choice labels, consequence summaries
- Must pass Zod + `validateQuestDraft` + reward bound checks
- Human or Creator Cockpit **approves** before merge into `WorldDefinition`

AI does **not** get to publish Layer 2 without validation.

---

### Layer 3 — What AI Director may do at play time (flavor)

Allowed (fits README **AI may do**):

- NPC reaction lines for the current beat
- Short recaps and hints
- Emphasize one **validated** branch’s atmosphere (not create new payout branches)
- Suggest pacing (“consider searching the trail”) without unlocking unvalidated choices
- Pick among **pre-approved text variants** for a beat (see variant pools below)
- Critique branch quality in creator tools (not for players)

Not allowed (fits README **AI may not do**):

- Change XP/gold/reward IDs outside blueprint bounds
- Add new `PlayerChoice` entries to the live session that weren’t in the published definition
- Complete the quest without engine firing the completion `consequenceId`
- Set flags or goals directly on the ledger
- Bypass `safetyMode`

**“Things in between shift”** = Layer 3: different dialogue, encounter *description*, order of optional validated beats, Director-selected variant from pools—not different win conditions or reward tables.

---

### Variant pools (recommended pattern)

To let scenarios feel fresh without breaking rules:

1. You author **2–N validated text variants** per beat (`descriptionVariantIds` or separate micro-beats with same consequence slots).
2. Blueprint lists `allowedVariantIds` per beat.
3. Director (or runtime with seed) selects `variantId` for this session—logged on ledger/debug.
4. Consequence IDs stay the same; only presentation changes.

```text
beat_trail_obstacle
  variants: [ "mud_slide", "wolf_tracks", "broken_cart" ]
  same choices: investigate | bypass
  same consequenceIds: consequence_investigate_trail, consequence_bypass_trail
```

---

### Reward clamping (engine responsibility)

When a quest completes (or a milestone consequence fires):

```text
1. Consequence references reward effect from blueprint slot (e.g. completion_reward)
2. Engine reads QuestBlueprint.rewardBounds
3. Engine applies clamped values to session/ledger (or applies tier flag only in MVP)
4. DebugEvent records actual applied values vs requested
```

AI never calls this path directly—it only triggers **player choices** that lead to engine-applied consequences.

---

### Example: experience in a bounded quest

**You hardcode (blueprint):**

```json
{
  "questId": "quest_mosswood_errand",
  "questType": "fetch",
  "direction": "Recover courier satchel; tone heroic; region mosswood",
  "rewardBounds": { "xpMin": 50, "xpMax": 80, "allowedRewardIds": ["item_satchel", "rep_mosswood_small"] },
  "successCriteria": { "requiredFlags": ["found_satchel"], "completeGoalId": "goal_mosswood_errand" },
  "rules": { "maxTurnsInQuest": 40, "allowReofferAfterDecline": true }
}
```

**AI / generator may vary:** trail obstacle description, NPC worry level, hint wording, which variant of room 2 encounter—**not** `xpMax: 200` or a new win condition “ignore satchel.”

**Engine on complete:** applies `xp: clamp(rolledOrAuthored, 50, 80)` and sets `mosswood_errand_done`.

---

### How this maps to agents

| Agent | Layer | Role |
| --- | --- | --- |
| **You (author)** | 1 | Write `QuestBlueprint` + approve graphs |
| **QuestArchitectAgent** (future) | 2 | Draft graph inside blueprint; no publish without approval |
| **AI Director** | 3 | Per-run flavor inside published graph + variant pools |
| **NPC Reaction Agent** | 3 | Lines bounded by tone/safety/beat |
| **Consequence Engine** | — | Sole applier of rewards/flags/goals |
| **Playtester / Health** | — | Verify blueprint criteria achievable; rewards within bounds |

---

### Schema direction (future — not implemented)

Planned contracts (names illustrative):

```ts
type QuestBlueprint = {
  questId: string;
  questType: "fetch" | "rescue" | "explore" | "escort" | "regional_offer" | string;
  direction: string; // premise + creative brief for AI
  rules: QuestRules;
  successCriteria: QuestCriteria;
  failCriteria?: QuestCriteria;
  rewardBounds: RewardBounds;
  safetyMode: SafetyMode;
  choiceSlots: QuestChoiceSlot[]; // role + allowed consequence effect types
  allowedVariantIds?: Record<string, string[]>; // beatId -> variant ids
};

type RewardBounds = {
  xpMin?: number;
  xpMax?: number;
  goldMin?: number;
  goldMax?: number;
  allowedRewardIds?: string[];
  maxRewardTier?: "none" | "minor" | "major";
};
```

`WorldDefinition` references `questBlueprints: QuestBlueprint[]` and quest graphs reference `questId`. Validators ensure every completion consequence respects `rewardBounds`.

---

### Definition of done (this contract)

- [ ] `QuestBlueprint` schema exists and validates independently of AI output.
- [ ] Consequences that apply rewards are rejected or clamped at validate-time and apply-time if outside bounds.
- [ ] Director can select only from `allowedVariantIds` (or falls back to default beat text).
- [ ] Playtester confirms success/fail criteria reachable within `rules`.
- [ ] Debug UI shows blueprint ID, applied rewards, clamp events, and Director variant chosen.

---

## Quest generator

### Status

| Field | Value |
| --- | --- |
| **Name** | Quest generator (`generateQuest` / `QuestArchitectAgent`) |
| **Status** | Future — brainstorm captured, **not implemented** |
| **Confidence** | High alignment with platform; medium–high feasibility after foundation |
| **Blocked until** | Phase 0 schemas complete, text runtime (Phase 1), AI Gateway + Director (Phase 2), instances (Phase 3), `validateWorldDefinition`, World Health / Playtester |
| **Primary dependencies** | `PlayerChoice`, `StoryBeat`, `Consequence`, `WorldDefinition`, `WorldDNA`, `TemporaryInstance`, AI Gateway, cross-file validator, optional Creator Cockpit |

### One-line summary

A **validated compiler** that turns a prompt + region/world context into a **playable quest package** (offer beat, choices, consequences, optional mini-adventure instance or beat subgraph), heavily structured around **`PlayerChoice`**, with **AI proposing drafts** and **validators + engine** deciding what becomes real—optionally enriched at **play time** by the **AI Director**.

---

### Vision (what the player experiences)

```text
Player enters an area / region
  -> quest offer appears (authored OR generated-from-template OR fully generated)
  -> player accepts or declines (PlayerChoice)
  -> if accept: mini-adventure runs (beats and/or temporary instance)
  -> consequences update flags, goals, ledger
  -> run feels different per play (Director: NPC tone, hints, pacing) within same graph
  -> optional: player shares snapshot or fork with others (Phase 6)
```

This extends the **[regional quest reference scenario](../README.md#reference-scenario-regional-quest-offer)** in README (e.g. Mosswood Errand): the quest generator **automates authoring** of that pattern, not a different game mode.

---

### Product goals

1. **Rapid content** — creators (or internal tools) get a valid quest subgraph from a short prompt without hand-writing every beat ID and consequence link.
2. **Framework-native** — output is normal `WorldDefinition` data (beats, choices, consequences), playable by the same text runtime and later 2D layer.
3. **Inspectable** — creator sees graph, health score, playtest report before publish.
4. **Replayable** — branches and flags drive difference; Director adds flavor, not random permanent truth.
5. **Shareable arcs** — generated quests remain compatible with save/share/fork once Phase 6 exists.

### Non-goals (explicit)

- AI **directly mutating** `WorldLedger` or `WorldSession` during generation or play.
- Unvalidated prose quests with no `consequenceId` links.
- Public UGC publishing without safety + health gates.
- Replacing hand-crafted **Stonepass Minimum (v1)** before the manual chain passes.
- Full open-world procedural quest spam without quality controls.
- A separate “chat RPG” mode disconnected from schemas.

---

### Relation to overall project

| Project pillar | How quest generator uses it |
| --- | --- |
| Schema-first | Output must pass Zod + graph validators |
| Text-first | Quest playable as text before any 2D/3D |
| Stonepass | v1 manual proof; v2 showcase can include hand-authored regional quests; generator is **additive** |
| AI Director | Runtime flavor on generated quests; optional critic during generation |
| Consequence Engine | All state change still via validated consequences at play time |
| World Health / Playtester | Reject or flag weak generated quests |
| 2D / 3D later | Same quest data; visual layer subscribes to flags/beats |

**Stonepass showcase alignment:** A strong demo can mix **authored** flagship chains (ogre → cave → dragon) with **one generated regional quest** to prove the generator—only after validators and runtime are stable.

---

### Core design principle

```text
Quest generator = AI-authored DRAFT of structured game logic
                 -> validation pipeline
                 -> human or policy APPROVAL
                 -> merged into WorldDefinition
                 -> runtime + Director at PLAY time
```

**PlayerChoice** is the **spine** of interactivity: every player-visible branch is a choice with a `consequenceId`. The generator must emit real choices, not narrative-only “fake” options.

**AI Director** at **play time** suggests reactions, hints, optional beat emphasis; it does **not** add new permanent choices that were not validated when the quest was published (unless Creator Cockpit explicitly approves a patch).

---

### Reference pattern: regional quest (authoring target)

The generator should be able to produce packages matching this template (see README for full narrative).

| Step | Structure |
| --- | --- |
| Enter region | Location + trigger flag → select offer beat |
| Offer beat | `StoryBeat` + accept/decline `PlayerChoice`s |
| Accept | `Consequence` → `goal_*`, `quest_*_active` flags |
| Decline | `Consequence` → `quest_*_declined`, optional re-offer rules |
| Mini-adventure | **Option A:** `TemporaryInstance` with rooms/encounters **or** **Option B:** flag-gated beat subgraph |
| Complete | `Consequence` → complete goal, cleanup flags, ledger events |
| Share (later) | Snapshot / fork with version lineage (Phase 6) |

**Illustrative IDs (Mosswood-style):**

- Beats: `beat_mosswood_quest_offer`, `beat_mosswood_01` … `beat_mosswood_finale`
- Choices: `choice_accept_errand`, `choice_decline_errand`
- Consequences: `consequence_accept_mosswood_errand`, `consequence_decline_mosswood_errand`, `consequence_mosswood_complete`
- Instance (optional): `instance_mosswood_trail`
- Flags: `entered_mosswood`, `quest_mosswood_active`, `mosswood_errand_done`

---

### Architecture (proposed)

```text
                    ┌─────────────────────────────┐
                    │  generateQuest() API         │
                    │  or QuestArchitectAgent      │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────v──────────────┐
                    │  AI Gateway                  │
                    │  structured output contract  │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              v                    v                    v
     ┌────────────────┐   ┌────────────────┐   ┌───────────────┐
     │ QuestDraft      │   │ Zod schemas     │   │ FakeProvider   │
     │ (beats, choices,│   │ per sub-object  │   │ (tests)        │
     │  consequences,  │   └────────┬────────┘   └───────────────┘
     │  instance?)     │            │
     └────────┬────────┘            v
              │            ┌────────────────────────┐
              │            │ validateQuestDraft()    │
              │            │ + validateWorldDefinition│
              │            │   (partial world merge)  │
              │            └────────┬───────────────┘
              │                     v
              │            ┌────────────────────────┐
              │            │ World Health +          │
              │            │ PlaytesterAgent (opt.)  │
              │            └────────┬───────────────┘
              v                     v
     ┌────────────────────────────────────────────┐
     │  Preview in Creator Cockpit (Phase 9)       │
     │  Approve | Reject | Regenerate              │
     └────────────────────┬───────────────────────┘
                          v
     ┌────────────────────────────────────────────┐
     │  Merge into WorldDefinition (version bump)  │
     └────────────────────┬───────────────────────┘
                          v
     ┌────────────────────────────────────────────┐
     │  Text runtime (Phase 1+) — same as manual   │
     │  Director at play (Phase 2+)                │
     └────────────────────────────────────────────┘
```

**Suggested package locations (when implemented):**

```text
packages/ai/agents/questArchitectAgent.ts   # or extend worldArchitectAgent
packages/core/validators/validateQuestDraft.ts
packages/core/schemas/questDraft.ts         # optional wrapper schema for generator output
packages/core/quest/generateQuest.ts        # orchestration API
apps/web/features/world-create/             # preview UI (Phase 5+)
```

---

### API sketch (TypeScript — illustrative)

Not implemented. Names and shapes may change when `Consequence` and `WorldDefinition` land.

```ts
type GenerateQuestInput = {
  /** Parent world this quest belongs to */
  worldId: string;
  worldDNA: WorldDNA;
  /** Region / location anchor for offer beat */
  regionId: string;
  locationId?: string;
  /** Creator or player prompt */
  prompt: string;
  /** teen | adult — enforced on output */
  safetyMode: SafetyMode;
  /** Template hint: regional_offer | fetch | explore | rescue | etc. */
  questTemplate?: string;
  /** Use subgraph only, instance only, or auto */
  adventureShape?: "subgraph" | "instance" | "auto";
  /** Seed for reproducible FakeProvider / tests */
  seed?: string;
};

type QuestDraft = {
  schemaVersion: string;
  questId: string;
  title: string;
  summary: string;
  offerBeat: StoryBeat;
  beats?: StoryBeat[];
  consequences: Consequence[];
  temporaryInstance?: TemporaryInstance;
  /** Beats/flags that must exist before offer */
  entranceFlags?: string[];
  /** Goals unlocked/completed by consequences */
  goalIds?: string[];
};

type GenerateQuestResult =
  | { ok: true; draft: QuestDraft; healthReport: HealthReport; debug?: unknown }
  | { ok: false; errors: string[]; fallback?: QuestDraft; validationErrors?: unknown };
```

**`generateQuest(input)`** responsibilities:

1. Build prompt contract for `QuestArchitectAgent` (include `WorldDNA`, region, template, safety rules).
2. Call AI Gateway → parse structured JSON → validate each object with existing Zod schemas.
3. Run `validateQuestDraft` (local graph rules: IDs unique, all `consequenceId`s exist, offer beat has ≥2 choices, complete path exists, instance exit consequence present).
4. Optionally run deterministic path runner + `PlaytesterAgent` summary.
5. Return preview result; **do not** auto-merge into production world without explicit approve flag.

---

### AI roles: QuestArchitect vs Director

| Agent / function | When | May do | May not do |
| --- | --- | --- | --- |
| **QuestArchitectAgent** (generation) | Create / regenerate draft | Propose beats, `PlayerChoice`s, consequences, instance rooms, titles, copy | Write to live `WorldSession`; bypass schemas; publish without validation |
| **AI Director** (play) | During active quest | NPC reactions, hints, recap, suggest next beat **within validated graph** | Mutate ledger; invent new choices not in published definition |
| **PlaytesterAgent** (quality) | Post-generation | Report broken paths, weak choices, missing goals | Auto-approve quest |
| **CriticAgent** (optional) | Post-generation | Natural-language quality summary | Override deterministic failures |

**“Heavily rely on PlayerChoice”** means: generation prompts and `QuestDraft` schema require a **minimum choice count** per beat and explicit `consequenceId` for every choice; validators fail drafts that are narrative-only.

**“Heavily rely on AI Director”** means: at play time, Director uses quest state + ledger to adapt **feel**; generation may use Director-like **critique** but not as the sole quality gate.

---

### Validation pipeline (required before merge)

| Stage | Checks |
| --- | --- |
| 1. Per-object Zod | Each `StoryBeat`, `PlayerChoice`, `Consequence`, `TemporaryInstance` parses |
| 2. Quest draft graph | All `consequenceId` references resolve; `possibleConsequences` align; duplicate IDs rejected |
| 3. World merge | Draft merged into copy of `WorldDefinition` → `validateWorldDefinition` on full world |
| 4. Reachability | Offer beat reachable from `startingBeatId` or region entry flags; ending or return-to-main path exists |
| 5. Health score | Threshold for auto-reject vs “needs review” (tune later) |
| 6. Playtester | Simulate paths; flag no-op choices, missing goals, dead ends |
| 7. Safety | `safetyMode` content rules (teen/adult) on generated text fields |

**Fallback behavior:**

- If generation fails → return typed errors; optional **template quest** fallback (pre-authored minimal regional quest per genre).
- If validation fails → no merge; show `validationErrors` in Creator UI.
- If playtest fails → warn but allow human override with explicit “publish anyway” (discouraged default).

---

### Implementation phases (dependency order)

Do **not** skip gates. Approximate mapping to README roadmap / step tracker:

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | W1-S4–S10+ schemas (`Consequence`, `WorldDefinition`, ledger, session) | Valid quest data shape |
| 2 | W1-S14 `validateWorldDefinition` | Graph integrity |
| 3 | W1-S15 Stonepass JSON (manual) | Reference templates for prompts |
| 4 | Phase 1 text runtime | Play generated quest after merge |
| 5 | Phase 2 AI Gateway + Director + NPC | Play-time flavor + generation agent infra |
| 6 | Phase 3 temporary instances | Instance-shaped mini-adventures |
| 7 | Phase 5 prompt-to-world / WorldArchitect | Shared generation pipeline patterns |
| 8 | Phase 7 playtester + health | Automated quality gate |
| 9 | Phase 6 share/fork | Share generated quest runs |
| 10 | Phase 9 Creator Cockpit | Preview, approve, regenerate, rollback |
| 11 | Phase 8+ 2D | Visual quest markers / region enter (same triggers) |

**Step-tracker items (CSV rows W8-S9–S12, added 2026-05-28):**

- W8-S9 — `QuestBlueprint` schema
- W8-S10 — `validateQuestDraft.ts`
- W8-S11 — `generateQuest()` orchestration + QuestArchitectAgent + tests
- W8-S12 — Merge QuestDraft into WorldDefinition + creator preview
- Creator UI (W12-S*): quest preview panel + approve merge
- One Stonepass showcase quest slot filled via generator (dogfood)

---

### Example generated package (outline JSON)

Illustrative only—IDs and consequence bodies must match real `Consequence` schema when implemented.

```json
{
  "schemaVersion": "1.0",
  "questId": "quest_mosswood_errand_generated",
  "title": "The Mosswood Errand",
  "summary": "A courier asks you to recover a satchel from the trail.",
  "entranceFlags": ["entered_mosswood"],
  "goalIds": ["goal_mosswood_errand"],
  "offerBeat": {
    "id": "beat_mosswood_quest_offer",
    "title": "A courier's errand",
    "description": "...",
    "trigger": "entered_mosswood",
    "availableChoices": [
      {
        "id": "choice_accept_errand",
        "label": "Accept the errand",
        "consequenceId": "consequence_accept_mosswood_errand"
      },
      {
        "id": "choice_decline_errand",
        "label": "Not now",
        "consequenceId": "consequence_decline_mosswood_errand"
      }
    ],
    "possibleConsequences": [
      "consequence_accept_mosswood_errand",
      "consequence_decline_mosswood_errand"
    ]
  },
  "consequences": [
    {
      "id": "consequence_accept_mosswood_errand",
      "summary": "Accept the Mosswood errand",
      "addFlags": ["quest_mosswood_active"],
      "unlockGoals": ["goal_mosswood_errand"]
    }
  ],
  "temporaryInstances": [{
    "id": "instance_mosswood_trail",
    "type": "dungeon",
    "title": "Mosswood Trail",
    "entranceText": "The mosswood path opens before you.",
    "requiredEntryFlags": ["quest_mosswood_active"],
    "completionCondition": "found_satchel",
    "completionConsequenceId": "consequence_mosswood_complete",
    "cleanupBehavior": "seal",
    "rooms": [{ "id": "room_trail_start", "title": "Trail Head", "description": "A narrow path.", "connectedRoomIds": [] }]
  }]
}
```

---

### Integration with share / fork (Phase 6)

- **Share snapshot:** Session at quest completion includes ledger events from accept → complete; world version ID pins definition (including generated quest if merged).
- **Fork:** Forked world copies `WorldDefinition` version; generated quest lineage stored in `parentWorldId` / `parentVersionId` metadata.
- **Remix:** Remix prompt may tune `WorldDNA.consequenceIntensity` or tone but must re-validate full world.
- **Public discovery:** Generated quests should not appear in public lists until health + safety approval policy exists (see README safety gates).

---

### Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Broken graphs (orphan `consequenceId`) | `validateQuestDraft` + `validateWorldDefinition` + path runner |
| Generic / boring quests | Templates per genre; health “consequence quality”; human preview |
| AI hallucinates invalid fields | Strict structured output; Zod; retry; template fallback |
| Director contradicts published graph | Runtime only offers validated choices; Director text-only for reactions |
| Scope creep (full campaign generator) | MVP = **single regional mini-arc** per `generateQuest` call |
| Teen safety violations | `safetyMode` in prompt + post-filter + blocked terms list (see README) |
| Performance / cost | Cache drafts; FakeProvider in CI; rate limits in Gateway |

---

### Open questions (resolve before implementation)

1. **Merge model:** Append quest to world JSON vs overlay “quest module” referenced by `questId`?
2. **Re-offer rules:** Standard consequence for decline vs cooldown flag?
3. **Human-in-the-loop default:** Is approve required for all generated quests in Stonepass showcase, or only public/share?
4. **Instance vs subgraph default:** `adventureShape: auto` heuristic—when to pick which?
5. **Director during generation:** Separate critic pass or single QuestArchitect call?
6. **Player-triggered generation:** Can players invoke `generateQuest` in-world, or creators-only until safety story is clear?
7. **Versioning:** `questDraft.schemaVersion` independent of `WorldDefinition.schemaVersion`?

---

### Definition of done (quest generator v1)

Treat quest generator v1 as done when:

- [ ] `generateQuest()` returns a `QuestDraft` that passes Zod + `validateQuestDraft` for at least 3 template types (e.g. regional_offer, fetch, explore).
- [ ] FakeProvider tests cover valid draft, invalid draft, and provider failure fallback.
- [ ] Merged draft into a test `WorldDefinition` passes `validateWorldDefinition`.
- [ ] Player can **play** a generated quest in text runtime from offer → accept → complete (instance or subgraph).
- [ ] World Ledger records accept, at least one mid-quest choice, and completion with debug events.
- [ ] AI Director enhances at least one beat (NPC reaction or hint) without mutating ledger directly.
- [ ] Playtester or health score flags a deliberately broken draft and blocks auto-merge by default.
- [ ] Creator preview UI shows validation errors and graph summary (minimal Phase 5/9 UI acceptable).
- [ ] Documentation updated: this section status → **Implemented** with links to code.

---

### Testing strategy (when built)

| Layer | Tests |
| --- | --- |
| Unit | `validateQuestDraft`, schema edge cases, ID uniqueness |
| Fixture | Golden valid/invalid quest JSON files in `packages/content/examples/` or `tests/fixtures/quests/` |
| Integration | Merge into world → run path runner → complete quest |
| AI | FakeProvider valid/invalid structured output; no live API required in CI |
| E2E (later) | Playwright: preview quest in browser, approve, play one path |

---

### References

- README: [Regional quest reference scenario](../README.md#reference-scenario-regional-quest-offer)
- README: [Stonepass Minimum vs Showcase](../README.md#stonepass-minimum-vs-showcase)
- README: [AI Direction Model](../README.md#ai-direction-model)
- README: Phase 5 Prompt-to-world, Phase 7 Playtester, Phase 9 Creator Cockpit
- Implemented schemas (Phase 0): `WorldDNA`, `PlayerChoice`, `StoryBeat` in `packages/core/src/schemas/`
- Pending: `Consequence` (W1-S5), `WorldDefinition`, `validateWorldDefinition`

---

## Adding the next feature

When brainstorming a new feature, copy this template:

```markdown
## <Feature name>

### Status
### One-line summary
### Vision
### Product goals / Non-goals
### Relation to overall project
### Architecture (proposed)
### API / data contract sketch
### Validation & safety
### Implementation phases
### Risks & open questions
### Definition of done
### References
```

Keep entries **dense and actionable** so a future implementer (human or agent) can pick up work without re-reading full chat history.
