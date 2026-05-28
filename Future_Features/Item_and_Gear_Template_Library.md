# Item & Gear Template Library

> **Living document** for a tier-based item/gear system expressed as **flags + bounded tiers** (not a full economy): reusable `GearTemplate` / `ItemTemplate` entries that quests and worlds can reward, that gate beats/choices, and that the Architect composes per theme — staying inside the README "no full economy" MVP rule.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [Quest_Generation.md](./Quest_Generation.md), [Faction_and_Reputation_System.md](./Faction_and_Reputation_System.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- AI **never** grants items directly; items are granted only via validated, **clamped** `Consequence` objects.
- Stays within README MVP: **no full economy, no marketplace, no monetization.** Flags + tiers only in v1.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| GearTemplate / ItemTemplate schema | Brainstorm / proposed | Phase 5 (with content libraries) | 2026-05-28 |
| Inventory as ledger flags/tiers | Brainstorm / proposed | Phase 3–5 | 2026-05-28 |
| Item-gated beats/choices + clamped rewards | Brainstorm / proposed | Phase 5 (with quest generation) | 2026-05-28 |

---

## One-line summary

Items/gear are **typed templates with tiers**, "owned" via ledger flags (`has_item_lantern`, `gear_tier_2_armor`); `Consequence` objects grant/consume them within **bounded allowed-reward lists**; beats and choices gate on possession or tier — giving meaningful loot and progression without inventory UIs, prices, or stats math.

---

## Why this fits the project and plays to its strengths

- **Respects the MVP boundary.** README explicitly defers full economy; this models loot as flags/tiers, exactly the documented stopgap (see Quest_Generation reward-clamping note).
- **Reuses the library + clamp pattern.** Items become a fifth library type next to creatures/NPCs/encounters/puzzles (W7-S7), and grants reuse the QuestBlueprint reward-bound clamping.
- **Makes quests and difficulty tangible.** "Find the deep-sea lantern to enter the trench" is a clean item-gated objective — supports difficulty + region features.
- **Deterministic + inspectable.** Ownership is ledger truth; no hidden RNG inventory.
- **Generation-ready.** Theme packs ship theme-appropriate gear (lava: heat suit; ocean: rebreather; machine: EMP tool).

---

## How this fits the existing architecture

| Existing piece | Role in this feature |
| --- | --- |
| `WorldLedger` | Item possession + gear tier stored as flags (engine-owned) |
| `Consequence` | `grantItems[]` / `consumeItems[]`, **clamped** to allowed reward IDs/tiers |
| `StoryBeat` / `PlayerChoice` | `requiredItems` / `requiredGearTier` gates beside flag gates |
| `WorldDefinition` | New `itemTemplates[]` (or library-referenced) |
| `QuestBlueprint` (W8-S9) | `allowedRewardIds[]` + `rewardTier` cap already planned — items plug in |
| `validateWorldDefinition` | Item ref integrity; gates reference known items/tiers |
| `WorldArchitectAgent` (Phase 5) | Proposes item rewards from allowed lists only |
| Content libraries (W7-S7) | `ItemTemplate` / `GearTemplate` as new library entry types |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Item & tier model

```text
Two representations, both ledger-backed:

  Discrete items:  has_item_<id>   flag (lantern, rope, dragon_key)
  Graded gear:     gear_tier_<slot> = 0..N  (armor tier 2, tool tier 1)

Grants are clamped:
  QuestBlueprint.allowedRewardIds = [lantern, rope]
  AI proposes "grant excalibur" → not in allowed list → rejected/clamped, logged

Gates:
  beat_enter_trench   requiredItems: [rebreather]
  choice_force_door   requiredGearTier: { tool: ">= 2" }
```

No prices, no currency, no stat sheets in v1 — possession and tier only.

---

## Schema sketches (illustrative — not final)

```ts
// packages/core/src/schemas/itemTemplate.ts
export const ItemRaritySchema = z.enum(["common", "uncommon", "rare", "legendary"]);

export const ItemTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(["key", "tool", "consumable", "gear", "quest"]),
  slot: z.string().optional(),          // for gear: armor | tool | ...
  tier: z.number().int().min(0).optional(),
  rarity: ItemRaritySchema.default("common"),
  themeTags: z.array(z.string()).default([]),
  safetyMode: z.enum(["teen", "adult"]).default("teen"),
});

// Consequence additions (clamped by engine)
grantItems?: z.array(z.string());     // item IDs, must be in allowed list
consumeItems?: z.array(z.string());
setGearTier?: z.record(z.number().int()); // { tool: 2 } clamped to cap
```

---

## Runtime & engine integration

1. **Grant.** Consequence Engine validates each granted item against the active `QuestBlueprint`/world allowed list, writes `has_item_*` flags or bumps gear tier (clamped to cap), logs `item_granted` / `gear_tier_changed`.
2. **Consume.** Removes possession flags (e.g. use the key on the door); logs `item_consumed`.
3. **Gate.** Beat/choice accessibility checks `requiredItems` / `requiredGearTier` with existing flag logic.
4. **Display.** A simple "satchel" panel reads possession flags — pure projection, no separate inventory store.

---

## AI proposes / validators check / engine executes

| Step | Who | Constraint |
| --- | --- | --- |
| Propose item rewards | WorldArchitect / quest gen | Only from `allowedRewardIds`; validated `ItemTemplate` |
| Validate | `validateWorldDefinition` + Consequence preconditions | Item refs exist; tiers within cap |
| Execute grant/consume | Consequence Engine | Clamps; writes flags/tiers; logs DebugEvent |
| Flavor | DirectorAgent | Describe the loot; cannot grant it |

---

## Security & safety

- Grants are **clamped** to allowed reward lists — the model cannot fabricate overpowered loot (same mechanism as quest XP clamping).
- Gear tiers capped per world/quest.
- `safetyMode` filters item names/descriptions.
- Save/fork snapshots include possession flags + gear tiers.

---

## Phase map / dependency order

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | W1-S5 Consequence, W1-S6 ledger (done) | Possession-as-flags |
| 2 | W3-S1 Consequence Engine | Clamped grant/consume |
| 3 | W7-S7 library entry schemas | ItemTemplate as library type |
| 4 | W8-S9 QuestBlueprint | Allowed reward lists |
| 5 | Phase 9 Creator Cockpit | Item editor + satchel panel |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name | Goal |
| --- | --- | --- |
| IG-S1 | Create ItemTemplate/GearTemplate schemas | Zod + examples + tier rules |
| IG-S2 | Add grant/consume/setGearTier to Consequence + clamp | Engine apply + DebugEvent |
| IG-S3 | Add requiredItems/requiredGearTier gates | Beat/choice accessibility |
| IG-S4 | Item validation in validateWorldDefinition | Ref integrity + caps |
| IG-S5 | Stonepass item pack (lantern, dragon key) | Dogfood gating |
| IG-S6 | Theme gear packs (lava/ocean/machine) | Library theme entries |
| IG-S7 | Satchel + item creator panel | Read-only projection + editor |

---

## Definition of done (v1)

- [ ] `ItemTemplate`/`GearTemplate` validate and reference cleanly in worlds
- [ ] Consequences grant/consume items and bump gear tiers, clamped to allowed lists
- [ ] Beats/choices gate on possession and gear tier
- [ ] Stonepass uses an item gate (e.g. key for the cave/dragon)
- [ ] Theme packs ship at least one gear item each
- [ ] Satchel panel reflects possession from ledger flags

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Scope creep toward full economy | Hard rule: flags + tiers only in v1; revisit only after MVP |
| AI grants overpowered loot | Allowed-reward clamping + validator |
| Soft-locks from missing key items | Playtester/health "required item never granted" check |
| Flag namespace pollution | Reserved `has_item_` / `gear_tier_` prefixes |

---

## Open questions

1. Single satchel namespace or per-slot gear vs misc items in v1?
2. Stackable/quantity items, or strictly binary possession until v2?
3. Do items carry across zones in a region automatically?
4. Should gear tier influence difficulty scaling (link to Dynamic Difficulty Director)?

---

## References

- [Quest_Generation.md](./Quest_Generation.md) — reward clamping + allowed reward IDs (shared mechanism)
- [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) — items as a library type
- [Dynamic_Difficulty_Director.md](./Dynamic_Difficulty_Director.md) — gear tier as a difficulty signal
- `packages/core/src/schemas/consequence.ts`, `worldLedger.ts`
