# Authoring Studio & Visual Beat Editor

> **Living document** for a **write-mode** creator tool: drag-and-edit story beats, choices, consequences, NPCs, and instances on a graph canvas with **live `validateWorldDefinition` feedback**, AI-assisted drafting, and approve/version controls — the natural successor to the Phase 9 Creator Cockpit.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [2D_Map_and_Node_Graph_Play_View.md](./2D_Map_and_Node_Graph_Play_View.md), [World_Health_Score_v2_and_AI_Critic_Loop.md](./World_Health_Score_v2_and_AI_Critic_Loop.md), [Curator_and_Community_Library_Contributions.md](./Curator_and_Community_Library_Contributions.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- The editor edits **data** (a `WorldDefinition` draft); nothing publishes without passing validation + human approval. AI drafts are proposals only.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| Visual beat/graph editor (write) | Brainstorm / proposed | Phase 9+ (extends Creator Cockpit W12) | 2026-05-28 |
| Live validation + health feedback | Brainstorm / proposed | Phase 9+ | 2026-05-28 |
| AI-assisted drafting + approve/version | Brainstorm / proposed | Phase 9+ | 2026-05-28 |

---

## One-line summary

A creator visually edits a world's beat graph, choices, and consequences with **inline schema + cross-file + health validation** as they type/drag; an AI assistant can draft nodes/branches; every change is validated and only publishes through approve → new version — turning JSON authoring into a guided, safe studio.

---

## Why this fits the project and plays to its strengths

- **Validation-first authoring is a differentiator.** The whole engine is built around `validateWorldDefinition`; surfacing it live as the author works is a uniquely strong fit.
- **Creator Cockpit (W12) is the foundation.** W12 already specs DNA viewer/editor, ledger viewer, graph viewer, approve/rollback — this unifies them into an editing surface.
- **Read-view sibling exists.** The [2D map/graph view](./2D_Map_and_Node_Graph_Play_View.md) is the read-mode projection; this adds write-mode on the same canvas.
- **AI assist reuses the agent pattern.** The assistant *drafts*; validators + the author gate — same mantra, no auto-publish.
- **Feeds contributions + health loop.** Authored entries flow into [community contributions](./Curator_and_Community_Library_Contributions.md) and the [health v2 loop](./World_Health_Score_v2_and_AI_Critic_Loop.md).

---

## How this fits the existing architecture

| Existing piece | Role in this feature |
| --- | --- |
| `WorldDefinition` + all sub-schemas | The document being edited (draft) |
| `validateWorldDefinition` | Live, inline validation as the author edits |
| Health score (W6 / [v2](./World_Health_Score_v2_and_AI_Critic_Loop.md)) | Live quality feedback panel |
| Creator Cockpit (W12-S1–S7) | Host surface: DNA/ledger/graph viewers, approve/rollback |
| `WorldArchitectAgent` / critic | AI drafting + fix suggestions (proposals) |
| World versioning (W9-S3) | Each publish = new validated version |
| Content libraries | Drag-in templates (creatures/NPCs/encounters/puzzles/items) |
| [2D graph view](./2D_Map_and_Node_Graph_Play_View.md) | Shared canvas (read-mode counterpart) |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Editor model

```text
Canvas:
  nodes = beats / instance rooms; edges = choices/transitions
  side panels = WorldDNA, selected node detail, library palette, validation, health

Editing actions (all produce a draft WorldDefinition):
  add/move/connect beats, edit choice + consequence, drag library template in,
  set flags/standing/item gates

Live feedback (on every change, debounced):
  Zod errors (per field)         → inline markers
  validateWorldDefinition errors → graph badges (broken refs, unreachable, dead ends)
  health score + findings        → quality panel

Publish:
  draft must pass validation → author Approves → new world version (lineage)
```

The editor can always **save a draft**, but can only **publish** a valid world.

---

## Schema / API sketches (illustrative — editor-side)

```ts
// The editor operates on a draft (a WorldDefinition that may be temporarily invalid)
export interface WorldDraftState {
  draft: unknown;                 // partial/in-progress WorldDefinition
  zodIssues: ZodIssueView[];      // per-field
  graphIssues: GraphIssueView[];  // from validateWorldDefinition
  health?: HealthReportV2;        // from health v2
  dirty: boolean;
}

// AI draft request (proposal only)
export interface AuthoringAssistRequest {
  intent: "draft_branch" | "fill_consequence" | "suggest_npc" | "fix_finding";
  context: unknown;               // selected node(s), finding code, etc.
}
// → returns a draft delta wrapped in AIResult; author must accept + it must validate
```

No new engine schema — the editor manipulates existing `WorldDefinition` data and calls existing validators.

---

## Runtime & integration

1. **Edit.** Author manipulates the graph/panels; each change updates the draft state.
2. **Validate live.** Debounced Zod + `validateWorldDefinition` + health run on the draft; issues render inline + as graph badges.
3. **Assist (optional).** Author requests an AI draft (branch, consequence, NPC, or finding fix); result is a proposed delta (AIResult) the author accepts/rejects; accepted deltas re-validate.
4. **Publish.** Only a fully valid draft can be approved → new version with lineage; original preserved.

---

## AI proposes / validators check / engine executes

| Step | Who | Constraint |
| --- | --- | --- |
| Draft node/branch/fix | Authoring assistant | `AIResult` delta; author must accept; must validate |
| Validate live | Zod + `validateWorldDefinition` + health | Authoritative; blocks publish |
| Approve + version | Human author | Mandatory; only valid drafts |
| Execute | Engine | Stores new version; original intact |

---

## Security & safety

- Nothing publishes without passing validation **and** explicit author approval.
- AI suggestions are deltas the author accepts; never auto-applied/published.
- Versioning + lineage; rollback always available.
- `safetyMode` + content filters apply to authored and AI-drafted text.

---

## Phase map / dependency order

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | W1-S14 validateWorldDefinition (done) | Live validation |
| 2 | W6 / health v2 | Live quality feedback |
| 3 | W12 Creator Cockpit | Host surface |
| 4 | [2D graph view](./2D_Map_and_Node_Graph_Play_View.md) | Shared canvas |
| 5 | W7 libraries | Drag-in templates |
| 6 | W9-S3 versioning | Approve → version |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name | Goal |
| --- | --- | --- |
| AS-S1 | WorldDraft state + live Zod validation | Per-field inline issues |
| AS-S2 | Live validateWorldDefinition on draft | Graph badges (refs/reachability/dead ends) |
| AS-S3 | Editable graph canvas (add/move/connect) | Visual beat/choice editing |
| AS-S4 | Library palette drag-in | Insert validated templates |
| AS-S5 | Live health panel | Quality feedback while editing |
| AS-S6 | AI authoring assist (proposals) | Draft branch/consequence/fix |
| AS-S7 | Approve → versioned publish | Safe publish with lineage |

---

## Definition of done (v1)

- [ ] Author edits a world on a graph canvas with editable nodes/edges/panels
- [ ] Zod + cross-file + health issues render live and inline
- [ ] Library templates can be dragged in and validate
- [ ] AI assist proposes deltas the author accepts; accepted deltas re-validate
- [ ] Only valid drafts publish; publish creates a new version with lineage
- [ ] Stonepass can be edited + republished through the studio

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Complex UI scope | Build on W12 cockpit + read-mode graph; ship incrementally |
| Invalid worlds published | Hard gate: publish requires passing validation |
| AI changes structure unexpectedly | Deltas are proposals; author accepts; re-validate |
| Large-world performance | Debounced validation; incremental checks; virtualized canvas |

---

## Open questions

1. Edit raw `WorldDefinition` JSON vs structured forms vs both?
2. Incremental validation (changed subgraph) vs full re-validate for performance?
3. Collaborative editing (ties to async co-op infra) in scope later?
4. How much of the editor is shared code with the read-mode graph view?

---

## References

- [2D_Map_and_Node_Graph_Play_View.md](./2D_Map_and_Node_Graph_Play_View.md) — read-mode canvas sibling
- [World_Health_Score_v2_and_AI_Critic_Loop.md](./World_Health_Score_v2_and_AI_Critic_Loop.md) — live quality + fix suggestions
- [Curator_and_Community_Library_Contributions.md](./Curator_and_Community_Library_Contributions.md) — authoring library entries
- Creator Cockpit W12-S1–S7 in the step tracker
