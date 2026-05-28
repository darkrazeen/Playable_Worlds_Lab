# Async Shared Worlds & Asymmetric Co-op

> **Living document** for **turn-based / asynchronous** multiplayer over a single `WorldDefinition`: multiple players act on a shared (or branched) `WorldLedger` with an explicit, validated merge model — text-first, no real-time netcode, no voice/chat, staying within README's "not day one" multiplayer boundary.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md), [Curator_and_Community_Library_Contributions.md](./Curator_and_Community_Library_Contributions.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- **Out of scope (per README):** real-time multiplayer, voice/chat, PvP, public matchmaking. This is **asynchronous, invite-only** co-op only.
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature | Status | Target phase (approx.) | Last updated |
| --- | --- | --- | --- |
| Shared session model + turn ownership | Brainstorm / proposed | Phase 6+ (after persistence/share) | 2026-05-28 |
| Ledger merge / conflict resolution | Brainstorm / proposed | Phase 6+ | 2026-05-28 |
| Asymmetric roles (player vs "guide") | Brainstorm / proposed | Phase 7+ | 2026-05-28 |

---

## One-line summary

Two-plus invited players share one world; turns are **owned** (or branched then merged); the engine applies each player's validated choices to a shared ledger with a deterministic **merge + conflict policy**, logging every change — async by design, like correspondence chess for AI-directed text worlds.

---

## Why this fits the project and plays to its strengths

- **The ledger is already an event-sourced truth.** Async multiplayer is fundamentally "apply ordered, validated consequences to shared state" — which is exactly what the engine does single-player.
- **Determinism makes merges tractable.** Because consequences are validated and explicit, a merge policy can be principled rather than guesswork.
- **No netcode required.** Turn-based async over persisted sessions (Phase 6) avoids real-time infrastructure entirely — fits the text-first ethos.
- **Asymmetric roles reuse the Director seam.** A "guide/DM" player can *propose* (like the Director does) while the engine still validates — a natural, safe role split.
- **Share links already planned.** Phase 6 share/fork is the on-ramp; this extends a share into a co-played session.

---

## How this fits the existing architecture

| Existing piece | Role in this feature |
| --- | --- |
| `WorldSession` | Becomes a **shared session** with a participants list + turn owner |
| `WorldLedger` | Shared truth; all writes are ordered, validated consequences |
| `applyPlayerChoice` | Per-turn apply path, unchanged, now attributed to a player |
| `DebugEvent` | Already an ordered event log — basis for sync + replay |
| Save/load (W9-S5) | Persistence backbone for async turns |
| Share token (W9-S6) | Invite mechanism (private/unlisted) |
| Fork/remix (W10) | "Branch then merge" co-op variant |
| `validateWorldDefinition` / session validation | Each applied turn must keep state valid |

**Core mantra unchanged:** AI proposes → validators check → engine executes.

---

## Co-op models

```text
MODEL A — Shared turn order (simplest)
  participants take turns; only the turn owner may apply a choice
  ledger is single + linear; no merge needed
  conflicts impossible by construction

MODEL B — Branch + merge (richer)
  each player advances their own branch from a common ancestor
  merge step: engine replays both branches' consequences in order,
    applying a conflict policy on contested flags
  unresolved conflicts → flagged for human (host) resolution

ASYMMETRIC ROLES
  PLAYER  applies choices (writes via engine)
  GUIDE   proposes beats/hints/quests (like the Director) — engine validates,
          host or rules approve; GUIDE cannot write ledger directly
```

Start with **Model A** (no merge) for v1; Model B + asymmetric roles later.

---

## Schema sketches (illustrative — not final)

```ts
// Extends WorldSession into a shared session
export const SharedSessionSchema = WorldSessionSchema.extend({
  participants: z.array(z.object({
    playerId: z.string(),
    role: z.enum(["player", "guide", "observer"]).default("player"),
    displayName: z.string(),
  })).min(1),
  turnOwnerId: z.string(),               // Model A
  coopModel: z.enum(["shared_turn", "branch_merge"]).default("shared_turn"),
});

// Attributed turn (who applied what)
export const SharedTurnSchema = z.object({
  turnNumber: z.number().int(),
  playerId: z.string(),
  choiceId: z.string(),
  appliedConsequenceId: z.string(),
});

// Merge conflict (Model B)
export const LedgerConflictSchema = z.object({
  flagId: z.string(),
  branchAValue: z.boolean(),
  branchBValue: z.boolean(),
  resolution: z.enum(["a_wins", "b_wins", "needs_host"]).default("needs_host"),
});
```

---

## Runtime & integration

1. **Create shared session.** Host opens a world, invites players via a private share token; participants + roles recorded.
2. **Take turns (Model A).** Only `turnOwnerId` may call `applyPlayerChoice`; engine applies, advances turn owner, logs attributed `DebugEvent`.
3. **Branch + merge (Model B).** Players advance branches; on merge, engine replays consequence streams in order, applies conflict policy, surfaces `needs_host` conflicts.
4. **Guide role.** A guide submits `DirectorDecision`-style proposals; engine validates; host/rules approve before they take effect.

---

## AI proposes / validators check / engine executes

| Step | Who | Constraint |
| --- | --- | --- |
| Apply turn | Player (turn owner) | Validated choice; session stays valid |
| Propose (guide) | Guide player | Like Director: proposes; engine validates; needs approval |
| Merge branches | Engine | Deterministic replay + conflict policy |
| AI flavor | DirectorAgent | Same bounded rules as single-player |

---

## Security & safety

- **Invite-only / private** — no public discovery, matchmaking, or open lobbies (README boundary).
- No real-time chat/voice; communication is in-world text + out-of-band.
- All writes are validated consequences; a malicious client cannot inject arbitrary state.
- `safetyMode` enforced for all participants; host sets the mode.
- Every turn attributed + logged for moderation/rollback.

---

## Phase map / dependency order

| Order | Prerequisite | Enables |
| --- | --- | --- |
| 1 | W9-S5 save/load | Persisted sessions |
| 2 | W9-S6 share token | Invite mechanism |
| 3 | Phase 1 runtime (done) | Per-turn apply |
| 4 | W10 fork/remix | Branch + merge basis |
| 5 | Phase 2 Director | Guide role analog |
| 6 | Faction/NPC memory | Shared social state |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name | Goal |
| --- | --- | --- |
| MP-S1 | SharedSession schema + participants/roles | Multi-player session shape |
| MP-S2 | Turn ownership + attributed apply (Model A) | Safe shared-turn play |
| MP-S3 | Private invite via share token | Invite-only join |
| MP-S4 | Branch + deterministic merge (Model B) | Replay + conflict policy |
| MP-S5 | Conflict resolution (host) UI | Resolve needs_host flags |
| MP-S6 | Guide (asymmetric) role + proposal validation | DM-style bounded role |

---

## Definition of done (v1 — Model A)

- [ ] Host creates a shared session and invites players privately
- [ ] Only the turn owner can apply a choice; turns rotate deterministically
- [ ] Every turn is attributed and logged
- [ ] Session stays valid after each turn; save/resume works
- [ ] No public discovery, chat, or real-time components
- [ ] (Stretch) Branch + merge with conflict surfacing for Model B

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Merge complexity (Model B) | Ship Model A first; Model B behind a flag |
| Scope creep into real-time | Hard async-only boundary; no sockets in v1 |
| Griefing | Invite-only + attribution + host rollback |
| Safety drift across players | Host-set `safetyMode` enforced engine-side |

---

## Open questions

1. Backend for async turns (Supabase tables from W9) — polling vs notifications?
2. Conflict policy defaults for Model B (last-writer, host-arbitrated, role-priority)?
3. Can guide and player roles swap mid-session?
4. Max participants for v1?

---

## References

- README — multiplayer explicitly "not day one"; this is the constrained async on-ramp
- [Procedural_Region_and_Biome_Composer.md](./Procedural_Region_and_Biome_Composer.md) — shared regions for co-op
- `packages/core/src/schemas/worldSession.ts`, `runtime/applyConsequence.ts`
