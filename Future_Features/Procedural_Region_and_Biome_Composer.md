# Procedural Region & Biome Composer

> **Living document** for stitching multiple validated worlds/zones into a connected **region map** — e.g. lava → ocean → machine — where each zone is its own `WorldDefinition`-shaped unit and travel between zones is a first-class, validated transition.
>
> **Status:** Scheduled in step tracker — rows added 2026-05-29 as `Not started`: **W8-S13** (RegionMap schema + validator), **W8-S14** (cross-zone travel + region ledger), **W8-S16** (vertical Spire edges). Implement only when each step reaches `Next` with human approval.  
> **Last updated:** 2026-05-28  
> **Related:** [Stonepass_Spire_Aincrad_Castle.md](./Stonepass_Spire_Aincrad_Castle.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [2D_Map_and_Node_Graph_Play_View.md](./2D_Map_and_Node_Graph_Play_View.md), [Quest_Generation.md](./Quest_Generation.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- AI **never** writes cross-zone state directly; zone transitions resolve through validated `Consequence`/transition objects applied by the engine.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| RegionMap schema (zones + edges) | Brainstorm / proposed | Phase 5–6 (after single-world generation) | 2026-05-28 |
| Cross-zone travel + shared region ledger | Brainstorm / proposed | Phase 5–6 | 2026-05-28 |
| Multi-biome generation via libraries | Brainstorm / proposed | Phase 5–7 | 2026-05-28 |

---

## One-line summary

A `RegionMap` is a graph of **zones** (each a `WorldDefinition` or sub-world) connected by validated **edges** with entry conditions; a **region-level ledger** carries flags/standing across zones so traveling from the lava world to the ocean world remembers what you did — composed from theme libraries, validated end-to-end before play.

---

## Why this fits the project and plays to its strengths

- **Composition over new mechanics.** It reuses `WorldDefinition` + `validateWorldDefinition` as the unit and just adds a graph on top — minimal new primitives.
- **Showcases the theme libraries.** The lava/ocean/machine packs (Phase 5, W7-S11) become connected destinations rather than isolated demos.
- **Scales the replayability story.** Route through the region varies by player choice/standing — explainable variation at the macro scale.
- **Text-first, no 3D needed.** A region is a node graph; the [2D map view](./2D_Map_and_Node_Graph_Play_View.md) is an optional later render layer over the same data.
- **Quest-friendly.** Regional quests ([Quest_Generation.md](./Quest_Generation.md)) span zones naturally as edges + cross-zone flags.

---

## How this fits the existing architecture

| Existing piece | Role in this feature |
| --- | --- |
| `WorldDefinition` | A **zone**; unchanged contract, validated individually |
| `WorldSession` | Extended with `currentZoneId` + region ledger reference |
| `WorldLedger` | Per-zone ledger plus a new **region ledger** for cross-zone facts |
| `Consequence` | Can carry a `travelToZone` transition (validated edge only) |
| `TemporaryInstance` | Still used inside a zone; region is the layer above zones |
| `validateWorldDefinition` | Validates each zone; new `validateRegionMap` validates the graph |
| `WorldArchitectAgent` (Phase 5) | Generates zones + proposes region edges |
| `WorldBlueprint` (W8-S6) | Extended with region-scale knobs (number of zones, biome order) |
| Share/fork (Phase 6) | A region is shareable as a bundle of versioned zones |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Region model

```text
RegionMap
├── zones[]          each: { zoneId, worldDefinitionRef, biomeTag, entryBeatId }
├── edges[]          each: { fromZoneId, toZoneId, requiredFlags, requiredStanding, travelConsequenceId }
├── startZoneId
└── regionLedgerSeed (cross-zone flags/standing)

Travel:
  player reaches a "zone gate" beat in lava world
  → choice triggers consequence with travelToZone: ocean_world
  → engine validates edge entry conditions against region ledger
  → loads ocean_world zone, seeds its session, preserves region ledger
```

Each zone remains independently valid and playable; the region adds **connectivity + shared memory**.

---

## Region topologies (horizontal vs vertical)

The `RegionMap` graph is topology-agnostic — the same zones + edges + region-ledger machinery supports more than one shape. Two are designed:

| Topology | Shape | Edge semantics | Example |
| --- | --- | --- | --- |
| **Horizontal (default)** | Branching biome map; bidirectional travel; backtracking allowed | "travel to" gated by flags/standing | lava ⇄ ocean ⇄ machine region |
| **Vertical (tower)** | Linear, upward-only, clear-gated; no skipping ahead | "ascend" gated by `floor_N_cleared` | [Stonepass Spire](./Stonepass_Spire_Aincrad_Castle.md) — 100 floors |

### Vertical (tower) topology — the Stonepass Spire

A tower is a `RegionMap` constrained to a **linear, ascending, clear-gated** form:

```text
Zones:   floor_01, floor_02, ..., floor_100   (each a WorldDefinition zone)
Edges:   floor_N → floor_(N+1)                 ONLY (no skip, no down-edge in v1)
Gate:    edge requires the previous floor's clearedFlag (floor_N_cleared)
Travel:  the floor's "stairs" beat fires consequence_ascend_to_(N+1)
Derived: the entire edge list is DERIVED from the Spire Manifest — not hand-wired
```

Differences from the horizontal default:

- **Edges are generated, not authored.** A `SpireManifest` (see the Spire doc) declares 100 floor slots; the region's upward edges are derived as `floor_N → floor_N+1, requires floor_N_cleared`.
- **Unbuilt floors are legal.** A `stub` floor is a **soft frontier** (a sealed-floor placeholder beat), not a reachability error. `validateRegionMap` must treat the contiguous built/stub prefix as valid and stop the climb at the frontier.
- **Monotonic climb curve.** Difficulty/gear bands are non-decreasing up the tower; the validator can warn on band regressions.
- **No backtracking required in v1.** Down-edges (descending to a cleared floor) are optional and out of scope for the first Spire pass.

### `validateRegionMap` additions for vertical topology

```text
- edges form a single ascending chain floor_1 → ... → frontier (no gaps, no skips)
- every edge gate references the correct previous-floor clearedFlag
- a `built` floor never sits above a `locked` floor (a `stub` gap is allowed = frontier)
- bands are monotonic non-decreasing (warn otherwise)
- startZoneId == floor_(startFloor)
```

See [Stonepass_Spire_Aincrad_Castle.md](./Stonepass_Spire_Aincrad_Castle.md) for the `SpireManifest` schema, floor status lifecycle (`locked`/`stub`/`built`), and the floor anatomy that each zone follows. Illustrative draft JSON for a manifest + vertical region live in `packages/content/examples/_design_drafts/` (clearly marked non-production).

---

## Schema sketches (illustrative — not final)

```ts
// packages/core/src/schemas/regionMap.ts
export const RegionZoneSchema = z.object({
  zoneId: z.string().min(1),
  worldId: z.string().min(1),       // ref to a WorldDefinition (zone)
  worldVersionId: z.string().min(1),
  biomeTag: z.string().min(1),      // lava | ocean | machine | ...
  entryBeatId: z.string().min(1),
});

export const RegionEdgeSchema = z.object({
  fromZoneId: z.string().min(1),
  toZoneId: z.string().min(1),
  requiredFlags: z.array(z.string()).default([]),
  requiredStanding: z.record(z.string()).optional(),
  travelConsequenceId: z.string().optional(),
});

export const RegionMapSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  id: z.string().min(1),
  title: z.string().min(1),
  zones: z.array(RegionZoneSchema).min(1),
  edges: z.array(RegionEdgeSchema).default([]),
  startZoneId: z.string().min(1),
  regionLedgerSeed: WorldLedgerSchema.partial().optional(),
});
```

```ts
// validateRegionMap.ts — cross-graph checks
// - every edge from/to references an existing zoneId
// - startZoneId exists; all zones reachable (or intentionally optional)
// - each referenced world loads + passes validateWorldDefinition
// - no edge requires a flag/standing the region can never produce
```

---

## Runtime & engine integration

1. **Init region.** `initializeRegionSession` loads `startZoneId`, seeds region ledger, and starts that zone's `WorldSession`.
2. **Play a zone.** Normal Phase 1 loop runs inside the zone; zone consequences update the zone ledger; flagged "region" facts also write to the region ledger.
3. **Travel.** A `travelToZone` consequence checks the edge's entry conditions against the **region ledger**; on success the engine swaps zones, preserving region-level memory; logs `zone_transition`.
4. **Return / loop.** Bidirectional edges allow backtracking; region ledger makes the world remember prior zones.

---

## AI proposes / validators check / engine executes

| Step | Who | Constraint |
| --- | --- | --- |
| Propose zones + edges + biome order | WorldArchitect (region mode) | Validates against `RegionMapSchema` |
| Validate | `validateRegionMap` + per-zone `validateWorldDefinition` | Graph integrity + each zone valid |
| Execute travel | Engine | Checks edge conditions; swaps zone; preserves region ledger; logs DebugEvent |
| Flavor | DirectorAgent | Travel narration only; no cross-zone state writes |

---

## Security & safety

- Each zone is independently validated; a broken zone cannot enter a region.
- Region ledger is engine-owned; AI cannot write cross-zone flags directly.
- `safetyMode` must be consistent (or compatible) across zones in a region — validator enforces.
- Shared/forked regions bundle pinned zone versions for reproducibility.

---

## Phase map / dependency order

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | Phase 1 runtime (done) | Single-zone play |
| 2 | Phase 5 single-world generation (W7–W8) | Zones to connect |
| 3 | W7-S11 theme packs | Distinct biomes |
| 4 | Faction/standing (proposed) | Standing-gated edges |
| 5 | Phase 6 persistence/share | Save + share regions |
| 6 | [2D map view](./2D_Map_and_Node_Graph_Play_View.md) | Visual region navigation |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name | Goal |
| --- | --- | --- |
| RG-S1 | Create RegionMap + zone/edge schemas | Zod schema + examples |
| RG-S2 | Build validateRegionMap | Graph + per-zone validation |
| RG-S3 | Add region ledger + currentZoneId to session | Cross-zone memory |
| RG-S4 | Implement travelToZone consequence + engine swap | Validated transitions + DebugEvent |
| RG-S5 | Region blueprint knobs in WorldBlueprint | Biome count/order knobs |
| RG-S6 | Architect region composition mode | Generate connected zones |
| RG-S7 | Stonepass + one neighbor as 2-zone region | Dogfood region |

---

## Definition of done (v1)

- [ ] `RegionMap` validates; each referenced zone passes `validateWorldDefinition`
- [ ] Player can travel between ≥2 zones with entry conditions enforced
- [ ] Region ledger preserves cross-zone facts/standing
- [ ] At least a 3-biome generated region (lava/ocean/machine) composes and plays text-first
- [ ] Regions save/share with pinned zone versions
- [ ] `zone_transition` events appear in the debug trace

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Zone version drift breaks edges | Pin `worldVersionId` per zone in the region |
| Unreachable zones | `validateRegionMap` reachability check |
| Ledger merge conflicts (zone vs region) | Explicit "region-scoped" flag namespace |
| Generation scope explosion | MVP cap: 3–5 zones, linear+1 branch |

---

## Open questions

1. Is a zone a full `WorldDefinition` or a lighter `Zone` subset?
2. Region ledger: separate namespace or merged with zone ledger via prefixes?
3. Persistent zone state on return (does ocean remember you left?) in v1 or v2?
4. Do quests span zones in v1, or stay within a single zone first?

---

## References

- [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) — zones generated from theme libraries
- [2D_Map_and_Node_Graph_Play_View.md](./2D_Map_and_Node_Graph_Play_View.md) — visual region navigation layer
- [Quest_Generation.md](./Quest_Generation.md) — regional quests across edges
- `packages/core/src/schemas/worldDefinition.ts`, `worldSession.ts`, `validators/validateWorldDefinition.ts`
