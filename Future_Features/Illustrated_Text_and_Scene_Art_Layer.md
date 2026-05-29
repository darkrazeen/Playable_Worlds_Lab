# Illustrated Text & Scene Art Layer

> **Living document** for an **optional presentation layer** that attaches generated or curated imagery to beats, locations, NPCs, and items — keyed to the existing `WorldDefinition` data, cached and validated, with text always remaining the source of truth and a no-image fallback.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Voice_Narration_and_TTS_Layer.md](./Voice_Narration_and_TTS_Layer.md), [2D_Map_and_Node_Graph_Play_View.md](./2D_Map_and_Node_Graph_Play_View.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- Imagery is **presentation only**: it never affects gameplay, ledger, or validation. Text-first always works without it.
- **Out of scope (per README):** real 2D/3D rendering as gameplay, avatar systems. This is static/illustrative art over text.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature                                   | Status                | Target phase (approx.)  | Last updated |
| ----------------------------------------- | --------------------- | ----------------------- | ------------ |
| Art binding to beats/locations/NPCs/items | Brainstorm / proposed | Phase 8+ (output layer) | 2026-05-28   |
| Generated scene art via AI Gateway        | Brainstorm / proposed | Phase 8+                | 2026-05-28   |
| Art cache + provenance + fallback         | Brainstorm / proposed | Phase 8+                | 2026-05-28   |

---

## One-line summary

Each renderable element (beat, location, NPC, item) gains an **optional `artRef`**; an image-generation agent or curator fills a cached, validated art catalog keyed by element + style; the play UI shows the image when present and degrades gracefully to pure text — same JSON, richer skin.

---

## Why this fits the project and plays to its strengths

- **"Same JSON, many output layers" is a core thesis.** This is the first visual output layer, and it changes _nothing_ about the engine — pure projection.
- **Text-first integrity preserved.** Art is additive; the game is fully playable without it, so it can never block or break play.
- **Library-aligned.** Creature/NPC/encounter templates already carry descriptions + theme tags — ideal prompts/keys for consistent art.
- **Cache + provenance reuse existing patterns.** Generated assets validate and cache like any AI output (AIResult), keeping cost/latency controlled.
- **Showcase upgrade.** An illustrated Stonepass is a compelling demo without committing to a real-time renderer.

---

## How this fits the existing architecture

| Existing piece                                          | Role in this feature                                         |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `StoryBeat`, `Npc`, `TemporaryInstance`, item templates | Gain optional `artRef` / `artPrompt`                         |
| `WorldDNA`                                              | Theme/tone drives a consistent **art style profile**         |
| AI Gateway (Phase 2)                                    | Hosts an image-generation agent behind the provider contract |
| `AIResult`                                              | Wraps generation result + provenance + seed                  |
| Content libraries                                       | Art keyed to template IDs for reuse across worlds            |
| Play UI (apps/web)                                      | Renders art when present; text fallback always               |
| Caching/persistence (Phase 6)                           | Stores generated assets keyed by element + style             |

**Core mantra unchanged:** AI proposes → validators check → engine executes — here "executes" = render, never mutate state.

---

## Art binding model

```text
Art catalog (cached, validated):
  key:        { elementType, elementId, styleProfileId }
  asset:      uri/path + alt text + provenance + safety status
  fallback:   none → UI shows text only

Style profile (per world, from WorldDNA):
  palette, rendering style (ink, painterly, pixel), tone

Generation flow:
  element + style profile → prompt → image agent → AIResult
  → safety check + cache → catalog entry
  Missing/failed → graceful text-only fallback
```

Gameplay never reads the art catalog; only the **view layer** does.

---

## Schema sketches (illustrative — not final)

```ts
// Optional bindings (added to renderable elements)
artRef?: z.string();          // points to a catalog key/asset
artPrompt?: z.string();       // optional authored prompt hint

// Art style profile (derived from WorldDNA or authored)
export const ArtStyleProfileSchema = z.object({
  id: z.string(),
  renderingStyle: z.enum(["ink", "painterly", "pixel", "photo", "flat"]),
  palette: z.array(z.string()).default([]),
  tone: z.string().optional(),
  safetyMode: z.enum(["teen", "adult"]),
});

// Catalog entry with provenance
export const ArtAssetSchema = z.object({
  key: z.object({
    elementType: z.enum(["beat", "location", "npc", "item"]),
    elementId: z.string(),
    styleProfileId: z.string(),
  }),
  uri: z.string(),
  altText: z.string(),                  // accessibility: required
  provenance: z.object({
    source: z.enum(["generated", "curated"]),
    seed: z.string().optional(),
    approvedBy: z.string().optional(),
  }),
  safetyStatus: z.enum(["pending", "passed", "blocked"]),
});
```

---

## Runtime & integration

1. **Bind.** Authors/generation set `artRef`/`artPrompt` on elements; style profile derived from `WorldDNA`.
2. **Generate (optional).** Image agent produces an asset (AIResult), runs a safety check, caches it in the catalog.
3. **Render.** Play UI looks up `artRef`; shows the image (+ alt text) if `safetyStatus: passed`, else text-only.
4. **No gameplay coupling.** The engine, ledger, and validators ignore art entirely.

---

## AI proposes / validators check / engine executes

| Step              | Who              | Constraint                               |
| ----------------- | ---------------- | ---------------------------------------- |
| Propose art       | Image agent      | `AIResult`; cached; never blocks play    |
| Safety check      | Filter           | `safetyMode`; blocked assets never shown |
| Approve (curated) | Human (optional) | For showcase/published worlds            |
| Render            | UI               | Presentation only; text fallback         |

---

## Security & safety

- All imagery passes a `safetyMode`-aware content check; blocked → text fallback.
- `altText` required on every asset (accessibility + moderation).
- Generated assets carry provenance + seed; curated assets carry approver.
- No PII, no user-likeness/avatar generation (out of scope).
- Cost/latency bounded by caching + lazy generation.

---

## Phase map / dependency order

| Order | Prerequisite                | Enables                              |
| ----- | --------------------------- | ------------------------------------ |
| 1     | Phase 1 play UI (W2-S6)     | Surface to render into               |
| 2     | Phase 2 AI Gateway          | Image agent behind provider contract |
| 3     | Phase 5 libraries           | Stable keys for reuse                |
| 4     | Phase 6 caching/persistence | Asset storage                        |
| 5     | Phase 8+ visual roadmap     | First visual layer                   |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name                                  | Goal                           |
| ------------------- | ------------------------------------- | ------------------------------ |
| AR-S1               | Art bindings + ArtStyleProfile schema | Optional refs + style          |
| AR-S2               | ArtAsset catalog + cache              | Keyed, validated assets        |
| AR-S3               | Image agent behind AI Gateway         | Generate via provider contract |
| AR-S4               | Safety check + altText enforcement    | Blocked → fallback             |
| AR-S5               | Play UI render + text fallback        | Graceful presentation          |
| AR-S6               | Stonepass illustrated showcase        | Dogfood art layer              |

---

## Definition of done (v1)

- [ ] Elements can carry optional `artRef`/`artPrompt`
- [ ] Image agent generates cached assets with provenance + seed
- [ ] Every asset has alt text and passes a safety check or is not shown
- [ ] Play UI renders art when present, text-only otherwise — never breaks
- [ ] Gameplay/validation provably unaffected by art presence/absence
- [ ] Stonepass has an illustrated showcase variant

---

## Risks & mitigations

| Risk                          | Mitigation                                         |
| ----------------------------- | -------------------------------------------------- |
| Unsafe imagery                | Safety check + human approval for published worlds |
| Cost/latency                  | Cache by key; lazy generation; reuse across worlds |
| Style inconsistency           | Per-world style profile from WorldDNA              |
| Scope creep to real rendering | Hard rule: static/illustrative presentation only   |

---

## Open questions

1. Asset storage: repo, object storage, or DB blob (Phase 6)?
2. Per-element art vs per-location backdrop only in v1?
3. Regenerate-on-demand vs fixed-on-approve for published worlds?
4. License/provenance requirements for curated art?

---

## References

- [Voice_Narration_and_TTS_Layer.md](./Voice_Narration_and_TTS_Layer.md) — sibling presentation layer
- [2D_Map_and_Node_Graph_Play_View.md](./2D_Map_and_Node_Graph_Play_View.md) — structural visual layer
- README — 2D/3D as later output layers over the same JSON
