# DirectorAgent (W4-S4)

`DirectorAgent` proposes `DirectorDecision` values through `AIGateway` only. It **never** mutates `WorldSession`, `WorldLedger`, or other permanent world state — the deterministic engine applies accepted suggestions separately.

## Methods

| Method                    | Director action          | Task                              |
| ------------------------- | ------------------------ | --------------------------------- |
| `suggestNextBeat`         | `select_next_beat`       | `director_select_next_beat`       |
| `suggestRecap`            | `summarize_world`        | `director_summarize_world`        |
| `suggestSessionWrapup`    | `suggest_session_wrapup` | `director_suggest_session_wrapup` |
| `suggestInstanceRequest`  | `generate_instance`      | `director_generate_instance`      |
| `suggestDifficultyAdjust` | `adjust_difficulty`      | `director_adjust_difficulty`      |

## Usage

```typescript
import { createDirectorAgentFromEnv } from "@playable-worlds/ai";
import { initializeWorldSession, loadWorld } from "@playable-worlds/core";

const world = loadWorld("world_stonepass_valley", contentRoot).world!;
const session = initializeWorldSession(world, { sessionId: "session_001" }).session!;

const director = createDirectorAgentFromEnv(); // respects OPENAI_ENABLED in .env.local

const result = await director.suggestNextBeat({ session, world });

if (result.ok && result.value?.action === "select_next_beat") {
  // Engine validates targetId and applies beat change — not DirectorAgent
}
```

## Fallbacks

Every call passes a schema-valid `fallbackValue` to the gateway:

- Custom: `fallback` on `DirectorSuggestionInput`
- Default: `buildDefaultDirectorFallback(action, session, { profile })` — e.g. hold at `currentBeatId` for `select_next_beat`, advisory tier from ledger signals for `adjust_difficulty`

## adjust_difficulty (W4-S10)

- `targetId` must be `difficulty_tier_<integer>` (encounter-intensity tier).
- Post-gateway clamp via `clampDirectorDifficultyDecision` and `DifficultyProfile.allowedRange` (default `[1, 3]`).
- Advisory only — no ledger, flag, or reward mutation.

## Wiring

- Use `createDirectorAgent(gateway)` in tests with `FakeProvider`
- Use `createDirectorAgentFromEnv()` in local dev (toggle: [ai-provider-toggle.md](./ai-provider-toggle.md))
- Reasoning panel on `/play` (W4-S7) reads debug events; engine apply for `adjust_difficulty` is future work (W8-S20)
