# Curator & Community Library Contributions

> **Living document** for a **curated** contribution pipeline: humans (and an assistive curator agent) submit content-library templates (creatures, NPCs, encounters, puzzles, items); each submission is validated, reviewed, and version-bumped into the shared libraries — UGC **without** a public marketplace, monetization, or open discovery.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md), [Authoring_Studio_and_Visual_Beat_Editor.md](./Authoring_Studio_and_Visual_Beat_Editor.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- **Out of scope (per README):** public UGC marketplace, creator monetization, open social discovery. This is **curated, reviewed** contribution only.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature                              | Status                | Target phase (approx.)                   | Last updated |
| ------------------------------------ | --------------------- | ---------------------------------------- | ------------ |
| Contribution submission + validation | Brainstorm / proposed | Phase 7+ (after content libraries W7-S7) | 2026-05-28   |
| Review + approval workflow           | Brainstorm / proposed | Phase 7–9                                | 2026-05-28   |
| Library versioning + provenance      | Brainstorm / proposed | Phase 6–9                                | 2026-05-28   |

---

## One-line summary

A contributor submits a library template draft (optionally AI-assisted by a **curator agent**); it passes Zod + `validateLibraryEntry` + safety filters; a reviewer approves; the entry is added with **provenance + a library version bump** — growing the creature/NPC/encounter/puzzle/item libraries safely and traceably.

---

## Why this fits the project and plays to its strengths

- **Libraries are the scaling lever.** Player world generation (Phase 5) is only as rich as the libraries; a contribution pipeline is how they grow without the core team authoring everything.
- **Validation infrastructure already exists.** `validateLibraryEntry` (W7-S8) + safety filters mean submissions can be machine-checked before any human looks.
- **Curated, not open.** Fits the README boundary precisely: reviewed contributions, no marketplace/monetization/discovery.
- **Versioning + provenance reuse Phase 6.** World versioning patterns extend to library versions and attribution.
- **Curator agent reuses the agent pattern.** It _drafts_; validators + humans gate — same mantra.

---

## How this fits the existing architecture

| Existing piece                     | Role in this feature                     |
| ---------------------------------- | ---------------------------------------- |
| Content libraries (W7-S7–S11)      | The target of contributions              |
| `validateLibraryEntry` (W7-S8)     | First automated gate on every submission |
| Safety filters / `safetyMode`      | Content safety gate                      |
| `AIResult`                         | Wraps curator-agent draft output         |
| World/library versioning (Phase 6) | `libraryVersion` bump + provenance       |
| Creator Cockpit (W12)              | Submission + review UI                   |
| Health/playtester patterns         | Optional quality scoring for entries     |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Contribution pipeline

```text
1. DRAFT      contributor authors a template (or curator agent drafts one)
2. VALIDATE   Zod + validateLibraryEntry + safety filters  (automated, blocking)
3. REVIEW     reviewer inspects content, tags, theme fit, safety
4. APPROVE    entry added with provenance + libraryVersion bump
5. PUBLISH    available to queryLibrary (Architect/Director selection)
6. AUDIT      every entry traceable to submitter + reviewer + version
```

Rejected drafts return structured reasons; nothing reaches the live library without steps 2–4.

---

## Schema sketches (illustrative — not final)

```ts
// Wraps any library entry with submission metadata
export const ContributionSchema = z.object({
  contributionId: z.string(),
  entryType: z.enum(["creature", "npc", "encounter", "puzzle", "item"]),
  entry: z.unknown(), // validated against the matching template schema
  submittedBy: z.string(),
  source: z.enum(["human", "curator_agent", "extracted"]),
  status: z.enum(["draft", "validated", "in_review", "approved", "rejected"]),
  validationErrors: z.array(z.string()).default([]),
  safetyMode: z.enum(["teen", "adult"]),
  themeTags: z.array(z.string()).default([]),
});

// Library version + provenance
export const LibraryEntryProvenanceSchema = z.object({
  entryId: z.string(),
  libraryVersion: z.string(), // separate from schemaVersion
  contributionId: z.string(),
  approvedBy: z.string(),
  approvedAt: z.string(),
});
```

---

## Runtime & integration

1. **Submit.** Contributor or curator agent produces a `Contribution` (draft).
2. **Validate.** Automated Zod + `validateLibraryEntry` + safety filter; failures block with reasons.
3. **Review.** Reviewer sees the entry + auto-check results in the cockpit; approve/reject with notes.
4. **Version + publish.** Approved entry gets provenance + `libraryVersion` bump; becomes queryable by the Architect/Director.
5. **Audit.** Every live entry traces back to submitter + reviewer + version.

---

## AI proposes / validators check / engine executes

| Step        | Who                             | Constraint                                      |
| ----------- | ------------------------------- | ----------------------------------------------- |
| Draft entry | Curator agent (optional)        | `AIResult`; must validate; never auto-published |
| Validate    | `validateLibraryEntry` + safety | Blocking; structured errors                     |
| Approve     | Human reviewer                  | Mandatory before publish                        |
| Publish     | Engine                          | Version bump + provenance                       |

---

## Security & safety

- No public marketplace/discovery/monetization (README boundary).
- Two gates: automated validation **and** human review before publish.
- `safetyMode` + content filters on every submission (human or AI authored).
- Full provenance/audit trail; entries can be deprecated/rolled back by version.

---

## Phase map / dependency order

| Order | Prerequisite               | Enables                      |
| ----- | -------------------------- | ---------------------------- |
| 1     | W7-S7 library schemas      | Entry types to contribute    |
| 2     | W7-S8 validateLibraryEntry | Automated gate               |
| 3     | Phase 6 versioning         | Library version + provenance |
| 4     | W6 health / W11 playtester | Optional quality scoring     |
| 5     | W12 Creator Cockpit        | Submission + review UI       |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name                                   | Goal                             |
| ------------------- | -------------------------------------- | -------------------------------- |
| CC-S1               | Contribution schema + status lifecycle | Submission record                |
| CC-S2               | Automated validate + safety gate       | Block invalid/unsafe drafts      |
| CC-S3               | Curator agent draft mode               | AI-assisted authoring (optional) |
| CC-S4               | Review workflow + approve/reject       | Human gate                       |
| CC-S5               | Library versioning + provenance        | Traceable publish                |
| CC-S6               | Contribution + review UI               | Cockpit integration              |

---

## Definition of done (v1)

- [ ] Contributors submit entries that auto-validate (Zod + `validateLibraryEntry` + safety)
- [ ] Invalid/unsafe submissions are blocked with structured reasons
- [ ] Reviewer can approve/reject; only approved entries publish
- [ ] Approved entries carry provenance + a library version
- [ ] Curator agent can draft an entry that still requires validation + review
- [ ] Live entries are fully auditable; rollback by version works

---

## Risks & mitigations

| Risk                     | Mitigation                                        |
| ------------------------ | ------------------------------------------------- |
| Unsafe/off-tone UGC      | Two gates (auto + human) + safetyMode filters     |
| Drift toward marketplace | Hard boundary: curated, no monetization/discovery |
| Library bloat / dupes    | Tagging + dedup checks + review                   |
| Provenance gaps          | Mandatory submitter/reviewer/version on publish   |

---

## Open questions

1. `libraryVersion` scheme — per-entry, per-pack, or global?
2. Who can be a reviewer in early phases (core team only)?
3. Should community entries be namespaced from official packs?
4. Quality score threshold required for approval?

---

## References

- [Player_World_Generation_and_Content_Libraries.md](./Player_World_Generation_and_Content_Libraries.md) — the libraries being grown (open question on versioning)
- [Authoring_Studio_and_Visual_Beat_Editor.md](./Authoring_Studio_and_Visual_Beat_Editor.md) — authoring surface for contributions
- README — UGC marketplace/monetization explicitly out of scope
