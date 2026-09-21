# @playable-worlds/web

Next.js presentation layer for Playable Worlds Lab. **No game logic here** — runtime lives in `@playable-worlds/core`.

## Commands

```bash
npm run dev -w @playable-worlds/web    # http://localhost:3000 — /play = Stonepass Spire Floor 1
npm run build -w @playable-worlds/web
```

On Windows PowerShell, if `npm` is blocked by execution policy, use `npm.cmd run dev` from the repo root.

## Play route

- **`/play`** — **Stonepass Spire — Floor 1** (`features/world-play/`) with read-only **World ledger**, **Debug trace**, and **Director reasoning** panels (`features/world-debug/`)
- Phase 1 acceptance smoke: `apps/web/tests/phase1-acceptance.smoke.test.tsx`

**UI gap (2026-09-20):** temporary instance (cave → puzzle → dragon) works in `@playable-worlds/core` integration tests; navigation/encounter/puzzle UI is not wired into `/play` yet. Director suggestions are advisory only (no auto-apply).

## Source of truth

- [AGENT_SESSION_HANDOFF.md](../../AGENT_SESSION_HANDOFF.md)
- [Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv](../../Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv)
- [Stonepass_Spire_Aincrad_Castle.md](../../Future_Features/Stonepass_Spire_Aincrad_Castle.md#product-naming-human-approved-2026-05-29)
