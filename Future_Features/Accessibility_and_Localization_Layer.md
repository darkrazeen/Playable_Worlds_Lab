# Accessibility & Localization Layer

> **Living document** for a schema-driven **accessibility + localization** layer: per-locale text variants, reading-level/tone adaptations within `safetyMode`, and accessibility metadata (alt text, transcripts, plain-language summaries) — presentation/content variants over the same `WorldDefinition`, never changing gameplay logic.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Voice_Narration_and_TTS_Layer.md](./Voice_Narration_and_TTS_Layer.md), [Illustrated_Text_and_Scene_Art_Layer.md](./Illustrated_Text_and_Scene_Art_Layer.md), [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- Localized/adapted text is a **content variant** keyed to the same IDs; it never changes graph structure, flags, consequences, or validation.
- `safetyMode` is preserved across all locales/reading levels — translation cannot loosen safety.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| Localized text variants (i18n) | Brainstorm / proposed | Phase 6+ (content layer) | 2026-05-28 |
| Reading-level / tone adaptation | Brainstorm / proposed | Phase 6+ | 2026-05-28 |
| Accessibility metadata (alt/transcript/plain) | Brainstorm / proposed | Phase 1+ (incremental) | 2026-05-28 |

---

## One-line summary

Every player-visible string (beat text, choice labels, NPC lines) gains optional **locale + reading-level variants** stored against the same element IDs; a translation/adaptation agent drafts variants that are validated for safety + completeness; the UI picks the right variant — making worlds reachable across languages and abilities without forking the world.

---

## Why this fits the project and plays to its strengths

- **Text-first means localization is tractable.** The product is strings + structure; separating *display text* from *structure* is a clean, high-value split the architecture invites.
- **Structure stays canonical.** IDs (beats, choices, flags) are language-neutral; only the *rendered text* varies — so logic, validation, and replay are untouched.
- **Safety-first product needs this.** Teen/adult `safetyMode` + reading-level adaptation supports the stated audience care; accessibility (alt text/transcripts) complements the art/voice layers.
- **Generation-ready.** Generated worlds can be localized via the same agent pattern; libraries carry locale variants.
- **Incremental.** Accessibility metadata (alt text, plain-language summaries) can start in Phase 1 with no schema upheaval.

---

## How this fits the existing architecture

| Existing piece | Role in this feature |
| --- | --- |
| `StoryBeat`, `PlayerChoice`, `Npc` text fields | Source strings keyed by element ID |
| `WorldDefinition` IDs | Language-neutral keys for variants |
| `WorldDNA` tone + `safetyMode` | Drives reading-level/tone adaptation + safety floor |
| AI Gateway (Phase 2) | Translation/adaptation agent behind provider contract |
| `AIResult` | Wraps draft variants + provenance |
| [Voice layer](./Voice_Narration_and_TTS_Layer.md) | Per-locale narration |
| [Art layer](./Illustrated_Text_and_Scene_Art_Layer.md) | Alt text shares accessibility metadata |
| `validateWorldDefinition` | Unchanged; structure stays canonical (variant completeness checked separately) |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Localization & accessibility model

```text
Canonical world: structure + base-locale strings (e.g. en, teen)

Variant bundle (keyed by elementId):
  locale:        en | es | fr | ...
  readingLevel:  simple | standard      (within safetyMode)
  text:          translated/adapted string
  status:        draft | validated | approved

Accessibility metadata (per element):
  altText (for art), transcript (for audio), plainSummary (optional)

Selection at runtime:
  pick variant by (locale, readingLevel); fall back to base locale if missing
  safetyMode is fixed by the world; adaptation may simplify, never desafe
```

A missing variant **falls back** to the base locale — the world is always playable.

---

## Schema sketches (illustrative — not final)

```ts
export const LocalizedTextSchema = z.object({
  elementId: z.string(),                  // beat/choice/npc field key
  locale: z.string(),                     // BCP-47, e.g. "es", "fr"
  readingLevel: z.enum(["simple", "standard"]).default("standard"),
  text: z.string().min(1),
  status: z.enum(["draft", "validated", "approved"]).default("draft"),
  safetyMode: z.enum(["teen", "adult"]),  // must match world; cannot loosen
});

export const AccessibilityMetaSchema = z.object({
  elementId: z.string(),
  altText: z.string().optional(),
  transcript: z.string().optional(),
  plainSummary: z.string().optional(),
});

// Variant bundle attached alongside (not inside) the canonical world
export const LocalizationBundleSchema = z.object({
  worldId: z.string(),
  worldVersionId: z.string(),
  baseLocale: z.string(),
  entries: z.array(LocalizedTextSchema),
  accessibility: z.array(AccessibilityMetaSchema).default([]),
});
```

---

## Runtime & integration

1. **Author/generate base.** World ships base-locale strings (canonical).
2. **Draft variants.** A translation/adaptation agent produces locale + reading-level variants (AIResult); safety-checked; completeness tracked (which IDs are covered).
3. **Validate.** Variant safety = world `safetyMode`; coverage report flags missing IDs; structure untouched.
4. **Select.** UI renders the best variant for the player's locale/reading-level; falls back to base locale per element.
5. **Accessibility.** Alt text/transcripts/plain summaries surface for art/audio/screen-reader use.

---

## AI proposes / validators check / engine executes

| Step | Who | Constraint |
| --- | --- | --- |
| Draft translations/adaptations | Translation agent | `AIResult`; safety = world mode; never auto-approved for publish |
| Validate variants | Safety + coverage checks | Cannot loosen `safetyMode`; report gaps |
| Approve (published worlds) | Human (optional) | Quality gate for showcase/published |
| Select + render | UI | Presentation only; base-locale fallback |

---

## Security & safety

- `safetyMode` is a floor: adaptation may simplify language but never make content less safe.
- Variant content passes the same safety filters as base text.
- No structural change — flags/consequences/IDs are language-neutral, so localization can't alter logic or break validation.
- Provenance recorded for AI-drafted vs human-approved variants.

---

## Phase map / dependency order

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | Phase 1 text fields (done) | Source strings + accessibility meta |
| 2 | Phase 2 AI Gateway | Translation/adaptation agent |
| 3 | Phase 6 persistence | Store variant bundles |
| 4 | Voice/art layers | Per-locale narration + alt text |
| 5 | W12 Creator Cockpit | Variant review + coverage UI |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name | Goal |
| --- | --- | --- |
| LX-S1 | Accessibility metadata fields | altText/transcript/plainSummary |
| LX-S2 | LocalizedText + LocalizationBundle schema | Variant model keyed by ID |
| LX-S3 | Variant selection + base-locale fallback | Runtime rendering |
| LX-S4 | Translation/adaptation agent | Draft variants via AI Gateway |
| LX-S5 | Safety + coverage validation | safetyMode floor + gap report |
| LX-S6 | Variant review + coverage UI | Cockpit integration |

---

## Definition of done (v1)

- [ ] Player-visible strings can carry locale + reading-level variants keyed by element ID
- [ ] Missing variants fall back to base locale; world always playable
- [ ] Translation agent drafts variants; safety = world `safetyMode`; coverage tracked
- [ ] Accessibility metadata (alt/transcript/plain) supported and surfaced
- [ ] Structure/validation/replay provably unaffected by localization
- [ ] Stonepass demonstrates one additional locale + a simple reading level

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Mistranslation changes meaning/gates | Structure is ID-based; text-only variants; human review for published |
| Safety drift across locales | `safetyMode` floor enforced on every variant |
| Coverage gaps | Coverage report + base-locale fallback |
| Variant sprawl/storage | Bundle per world version; expire stale drafts |

---

## Open questions

1. Variant storage: alongside world JSON, separate bundle files, or DB (Phase 6)?
2. Reading-level axis in v1, or locale-only first?
3. RTL / pluralization / interpolation handling for complex locales?
4. Human review required for all locales or only published/showcase worlds?

---

## References

- [Voice_Narration_and_TTS_Layer.md](./Voice_Narration_and_TTS_Layer.md) — per-locale narration + transcripts
- [Illustrated_Text_and_Scene_Art_Layer.md](./Illustrated_Text_and_Scene_Art_Layer.md) — shared alt-text accessibility metadata
- README — teen/adult safety model; text-first foundation
- `packages/core/src/schemas/storyBeat.ts`, `playerChoice.ts`, `npc.ts`
