# 2D Map & Node-Graph Play View

> **Living document** for a **2D visual navigation layer**: render a world's story-beat graph (and region map) as an interactive node-graph / map the player can read and navigate — a read-and-navigate projection of the same `WorldDefinition`, no game-logic rendering, a stepping stone before any real 3D.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Related:** [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md), [Illustrated_Text_and_Scene_Art_Layer.md](./Illustrated_Text_and_Scene_Art_Layer.md), [Authoring_Studio_and_Visual_Beat_Editor.md](./Authoring_Studio_and_Visual_Beat_Editor.md), [README.md](./README.md)  
> **Last updated:** 2026-05-28

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- The map is a **view + navigation** projection: it reads `WorldDefinition`/session and triggers the **same** runtime functions; it never bypasses validators or mutates state directly.
- **Out of scope (per README):** real-time 3D, physics, avatar movement. This is a 2D graph/map.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature                              | Status                | Target phase (approx.)                 | Last updated |
| ------------------------------------ | --------------------- | -------------------------------------- | ------------ |
| Beat-graph visualization (read-only) | Brainstorm / proposed | Phase 5–8 (extends W8-S4 graph render) | 2026-05-28   |
| Navigable map play view              | Brainstorm / proposed | Phase 8+ (output layer)                | 2026-05-28   |
| Region map navigation                | Brainstorm / proposed | Phase 8+ (with region composer)        | 2026-05-28   |

---

## One-line summary

The same beats/choices/instances that drive text play render as a **2D node graph or map**; visited/available/locked nodes reflect ledger state; clicking an available node/choice calls the existing runtime (`listAvailableChoices` → `applyPlayerChoice`) — a richer way to see and traverse a world without changing how it works.

---

## Why this fits the project and plays to its strengths

- **The data is already a graph.** `WorldDefinition` is beats + edges (flag-gated); rendering it visually is a direct projection, not new modeling.
- **W8-S4 already plans a read-only graph render.** This extends that from a debug view to an interactive play view.
- **Navigation reuses the runtime API.** The UI calls the exact functions text play uses — no parallel logic, no bypass.
- **Bridges to region + 3D.** Region maps ([region composer](./Procedural_Region_and_Biome_Composer.md)) render as zone graphs; later 3D is "the next renderer over the same data."
- **Strong creator/debug value** even before player-facing polish.

---

## How this fits the existing architecture

| Existing piece                              | Role in this feature                              |
| ------------------------------------------- | ------------------------------------------------- |
| `WorldDefinition` (beats, choices, gates)   | Graph nodes + edges                               |
| `WorldLedger` / session                     | Node state: visited / available / locked / ending |
| `listAvailableChoices`, `applyPlayerChoice` | Navigation actions (unchanged)                    |
| `selectStoryBeat` / accessibility           | Determines reachable nodes                        |
| `TemporaryInstance` rooms                   | Sub-graphs (cave room map)                        |
| RegionMap (proposed)                        | Zone-level graph                                  |
| W8-S4 story graph render                    | Read-only precursor this builds on                |
| Art layer (optional)                        | Node thumbnails per beat/location                 |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## View model

```text
Node = StoryBeat (or instance room, or region zone)
  state: visited | current | available | locked | ending | hidden
Edge = choice/transition with gate info (requiredFlags/standing/items)

Interaction:
  click an AVAILABLE node/choice
    → UI calls listAvailableChoices(session) to confirm legality
    → applyPlayerChoice(...) (same path as text)
    → re-render node states from new ledger

Layouts:
  - force-directed / layered DAG for beat graphs
  - map-style for region zones (biome tiles + edges)
```

The map shows **only** what the rules allow; it cannot reveal hidden/locked content beyond authoring rules.

---

## Schema sketches (illustrative — view-side, not engine)

```ts
// Derived view model (computed from WorldDefinition + session; not stored)
export interface BeatNodeView {
  beatId: string;
  title: string;
  state: "visited" | "current" | "available" | "locked" | "ending" | "hidden";
  artRef?: string; // optional, from art layer
}

export interface GraphEdgeView {
  fromBeatId: string;
  toBeatId: string;
  choiceId?: string;
  gated: boolean; // requiredFlags/standing/items unmet
  gateSummary?: string;
}
```

No new engine schema is required — this is a **projection** computed by the web app from existing core APIs.

---

## Runtime & integration

1. **Project.** Web layer builds `BeatNodeView[]` + `GraphEdgeView[]` from the loaded `WorldDefinition` + current session.
2. **Render.** Draw nodes/edges; color by state; show gate summaries on locked edges.
3. **Navigate.** Clicking an available node/choice invokes the **same** runtime functions text play uses; re-derive the view after apply.
4. **Region mode.** For a `RegionMap`, render zones as a higher-level map; entering a zone drops into its beat graph.

---

## AI proposes / validators check / engine executes

| Step                     | Who           | Constraint                                |
| ------------------------ | ------------- | ----------------------------------------- |
| Compute view             | Web layer     | Read-only projection of core state        |
| Navigate                 | Player via UI | Calls runtime APIs; validators still gate |
| Layout assist (optional) | AI            | Cosmetic layout only; never changes graph |
| Execute                  | Engine        | Same `applyPlayerChoice` path             |

---

## Security & safety

- The map never bypasses gates — it calls the validated runtime; locked edges stay locked.
- Hidden beats respect `isHidden` rules; the map can't leak unreachable content.
- No new state store; the ledger remains the single truth.
- `safetyMode` unaffected (presentation of existing content).

---

## Phase map / dependency order

| Order | Prerequisite                    | Enables                   |
| ----- | ------------------------------- | ------------------------- |
| 1     | Phase 1 runtime + W2-S6 play UI | Navigation actions        |
| 2     | W8-S4 graph render              | Read-only graph precursor |
| 3     | Phase 3 instances               | Room sub-graphs           |
| 4     | Region composer (proposed)      | Zone-level maps           |
| 5     | Art layer (optional)            | Node thumbnails           |
| 6     | Phase 8+ visual roadmap         | Path toward 3D            |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name                             | Goal                             |
| ------------------- | -------------------------------- | -------------------------------- |
| MV-S1               | Beat-graph view model derivation | Project core state → nodes/edges |
| MV-S2               | Read-only beat-graph render      | Visualize with state colors      |
| MV-S3               | Navigable nodes via runtime APIs | Click → applyPlayerChoice        |
| MV-S4               | Instance room sub-graph view     | Cave room map                    |
| MV-S5               | Region map view                  | Zone-level navigation            |
| MV-S6               | Stonepass map play showcase      | Dogfood navigable map            |

---

## Definition of done (v1)

- [ ] A world renders as a node graph with correct node states from the ledger
- [ ] Locked edges show gate reasons and cannot be traversed
- [ ] Clicking available nodes/choices drives play via the existing runtime
- [ ] Instance rooms render as sub-graphs
- [ ] (Stretch) Region maps render zones and support travel
- [ ] No engine/validator bypass; ledger remains single source of truth

---

## Risks & mitigations

| Risk                                 | Mitigation                                       |
| ------------------------------------ | ------------------------------------------------ |
| UI re-implements rules (bypass risk) | Force all navigation through core runtime APIs   |
| Graph clutter for large worlds       | Layered layout, zoom, collapse, focus-on-current |
| Leaking hidden content               | Respect `isHidden`/reachability; view filters    |
| Scope creep to 3D                    | Hard rule: 2D graph/map only in this feature     |

---

## Open questions

1. Library for rendering (e.g. SVG/canvas/force-graph) — performance vs control?
2. Player-facing map vs creator-facing graph — one component or two modes?
3. Show full graph or fog-of-war (only discovered nodes)?
4. How much layout can AI assist without implying it changes structure?

---

## References

- [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md) — region/zone maps
- [Authoring_Studio_and_Visual_Beat_Editor.md](./Authoring_Studio_and_Visual_Beat_Editor.md) — editable graph (write-mode sibling)
- W8-S4 (story graph render) in the step tracker — read-only precursor
- `packages/core/src/runtime/`, `story/`
