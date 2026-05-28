# @playable-worlds/web

Next.js presentation layer for Playable Worlds Lab. **No game logic here** — runtime lives in `@playable-worlds/core`.

## Commands

```bash
npm run dev -w @playable-worlds/web    # http://localhost:3000
npm run build -w @playable-worlds/web
```

## Phase 1+

UI features under `features/` (world-play, debug, creator). When importing workspace packages, configure `transpilePackages` in `next.config.ts` for `@playable-worlds/core`, `@playable-worlds/ai`, and `@playable-worlds/content`.

## Source of truth

- [AGENT_SESSION_HANDOFF.md](../../AGENT_SESSION_HANDOFF.md)
- [Playable_Worlds_Lab_v4_1_FULL_CURSOR.md](../../Playable_Worlds_Lab_v4_1_FULL_CURSOR.md)
