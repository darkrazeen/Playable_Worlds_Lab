# Voice Narration & TTS Layer

> **Living document** for an **optional audio presentation layer**: text-to-speech narration of beats and NPC reaction lines, with per-NPC voice profiles, caching, and full graceful fallback to silent text — presentation only, never affecting gameplay.
>
> **Status:** Brainstorm / proposed direction — **not in step tracker yet** (Future_Features only).  
> **Last updated:** 2026-05-28  
> **Related:** [Illustrated_Text_and_Scene_Art_Layer.md](./Illustrated_Text_and_Scene_Art_Layer.md), [Accessibility_and_Localization_Layer.md](./Accessibility_and_Localization_Layer.md), [NPC_Memory_and_Relationship_Arcs.md](./NPC_Memory_and_Relationship_Arcs.md), [README.md](./README.md)

**Rules:**

- Entries here do **not** override `Playable_Worlds_Lab_v4_1_Notion_Step_Tracker.csv` or phase gates until human-approved steps are added.
- Every feature respects: **AI proposes → validators check → deterministic engine executes.**
- Audio is **presentation only**: never affects gameplay, ledger, or validation. Silent text-first always works.
- **Out of scope (per README):** real-time voice chat between players, voice input as a control scheme (v1).
- When shipped, move status to **Implemented** and link to code paths / step IDs.

---

## Feature index entry

| Feature                        | Status                | Target phase (approx.)  | Last updated |
| ------------------------------ | --------------------- | ----------------------- | ------------ |
| TTS narration of beats/choices | Brainstorm / proposed | Phase 8+ (output layer) | 2026-05-28   |
| Per-NPC voice profiles         | Brainstorm / proposed | Phase 8+                | 2026-05-28   |
| Audio cache + fallback         | Brainstorm / proposed | Phase 8+                | 2026-05-28   |

---

## One-line summary

Beat text and NPC reaction lines can be spoken via a TTS agent using per-NPC/narrator **voice profiles** (driven by `WorldDNA` tone + NPC attitude); audio is cached and validated, and the experience degrades cleanly to silent text — accessibility and immersion without touching the engine.

---

## Why this fits the project and plays to its strengths

- **Another pure output layer.** Like art, audio is projection over the same JSON; the engine is untouched.
- **Accessibility win.** Narration directly supports the [accessibility layer](./Accessibility_and_Localization_Layer.md) (screen-reader-adjacent, low-vision, reading support).
- **NPC voices reinforce relationship arcs.** A consistent ogre voice across the playthrough deepens the [NPC memory](./NPC_Memory_and_Relationship_Arcs.md) payoff.
- **Tone alignment is free.** `WorldDNA` already encodes tone; voice selection maps to it.
- **Cache pattern reuses AIResult.** Audio generation caches like art — controlled cost/latency.

---

## How this fits the existing architecture

| Existing piece                                                  | Role in this feature                    |
| --------------------------------------------------------------- | --------------------------------------- |
| `StoryBeat` text, `Npc` reaction lines                          | The content narrated                    |
| `WorldDNA`                                                      | Tone → narrator/voice style selection   |
| `Npc` attitude + memory                                         | Per-NPC voice profile + delivery hints  |
| AI Gateway (Phase 2)                                            | TTS agent behind provider contract      |
| `AIResult`                                                      | Wraps audio generation + provenance     |
| Play UI (apps/web)                                              | Playback controls; silent fallback      |
| Caching/persistence (Phase 6)                                   | Stores audio keyed by text hash + voice |
| [Localization layer](./Accessibility_and_Localization_Layer.md) | Per-locale narration                    |

**Core mantra unchanged:** AI proposes → validators check → engine executes — "executes" = play audio, never mutate state.

---

## Audio binding model

```text
Voice profile (per narrator + per NPC):
  voiceId, pitch/rate hints, tone (from WorldDNA + attitude), locale

Audio catalog (cached):
  key:   hash(text) + voiceId + locale
  asset: audio uri + duration + transcript + provenance + safety status
  fallback: silent (text only)

Flow:
  beat/NPC line + voice profile → TTS agent → AIResult → safety check
  → cache → catalog. Missing/failed → silent text.
```

The engine never reads the audio catalog; only the **view layer** does.

---

## Schema sketches (illustrative — not final)

```ts
export const VoiceProfileSchema = z.object({
  voiceId: z.string(),
  role: z.enum(["narrator", "npc"]),
  npcId: z.string().optional(),
  rate: z.number().min(0.5).max(2).default(1),
  pitch: z.number().min(0.5).max(2).default(1),
  locale: z.string().default("en"),
});

export const AudioAssetSchema = z.object({
  key: z.object({
    textHash: z.string(),
    voiceId: z.string(),
    locale: z.string(),
  }),
  uri: z.string(),
  durationMs: z.number().int(),
  transcript: z.string(), // == source text; accessibility
  provenance: z.object({
    source: z.enum(["generated", "recorded"]),
    approvedBy: z.string().optional(),
  }),
  safetyStatus: z.enum(["pending", "passed", "blocked"]),
});
```

---

## Runtime & integration

1. **Select voice.** Narrator voice from `WorldDNA` tone; NPC voice from attitude/memory + per-NPC profile.
2. **Generate (optional).** TTS agent renders audio (AIResult), safety/transcript check, cached by text hash + voice + locale.
3. **Play.** UI offers playback (auto or on-demand); shows transcript; silent text fallback if missing/blocked.
4. **No gameplay coupling.** Engine, ledger, validators ignore audio.

---

## AI proposes / validators check / engine executes

| Step                    | Who              | Constraint                              |
| ----------------------- | ---------------- | --------------------------------------- |
| Generate audio          | TTS agent        | `AIResult`; cached; never blocks play   |
| Safety/transcript check | Filter           | Transcript == source text; `safetyMode` |
| Approve (published)     | Human (optional) | For showcase/published worlds           |
| Play                    | UI               | Presentation only; silent fallback      |

---

## Security & safety

- Transcript must equal source text (no hidden audio content); blocked → silent.
- `safetyMode`-aware; no voice cloning of real people; synthetic voices only.
- Provenance recorded; cache keyed deterministically by text/voice/locale.
- Cost/latency bounded by cache + lazy/opt-in generation.

---

## Phase map / dependency order

| Order | Prerequisite            | Enables                            |
| ----- | ----------------------- | ---------------------------------- |
| 1     | Phase 1 play UI (W2-S6) | Playback surface                   |
| 2     | Phase 2 AI Gateway      | TTS agent behind provider contract |
| 3     | NPC memory/attitude     | Per-NPC voices                     |
| 4     | Phase 6 caching         | Audio storage                      |
| 5     | Localization layer      | Multi-locale narration             |

---

## Proposed step-tracker additions (NOT approved — for human review)

| Step ID (suggested) | Name                                   | Goal                           |
| ------------------- | -------------------------------------- | ------------------------------ |
| VN-S1               | VoiceProfile + AudioAsset schemas      | Voices + catalog               |
| VN-S2               | TTS agent behind AI Gateway            | Generate via provider contract |
| VN-S3               | Audio cache keyed by text/voice/locale | Reuse + cost control           |
| VN-S4               | Transcript/safety enforcement          | Blocked → silent               |
| VN-S5               | Playback UI + silent fallback          | Graceful audio                 |
| VN-S6               | Stonepass narrated showcase            | Dogfood audio layer            |

---

## Definition of done (v1)

- [ ] Beats/NPC lines can be narrated via cached TTS assets
- [ ] Narrator + per-NPC voice profiles driven by tone/attitude
- [ ] Every asset has a transcript matching source text + passes safety or stays silent
- [ ] UI playback works with a clean silent text fallback
- [ ] Gameplay/validation provably unaffected
- [ ] Stonepass has a narrated showcase variant

---

## Risks & mitigations

| Risk                            | Mitigation                                         |
| ------------------------------- | -------------------------------------------------- |
| Cost/latency                    | Cache by text/voice/locale; lazy/opt-in generation |
| Voice mismatch with tone        | Profiles from WorldDNA + attitude                  |
| Unsafe/altered audio            | Transcript-equals-text check + safety filter       |
| Scope creep to voice chat/input | Hard rule: narration output only in v1             |

---

## Open questions

1. Auto-play vs tap-to-play default?
2. Provider strategy (browser SpeechSynthesis vs cloud TTS) for cost/quality?
3. Streaming vs pre-generated for long beats?
4. How tightly to couple with localization (generate per locale on demand)?

---

## References

- [Illustrated_Text_and_Scene_Art_Layer.md](./Illustrated_Text_and_Scene_Art_Layer.md) — sibling visual presentation layer
- [Accessibility_and_Localization_Layer.md](./Accessibility_and_Localization_Layer.md) — narration as accessibility + per-locale audio
- [NPC_Memory_and_Relationship_Arcs.md](./NPC_Memory_and_Relationship_Arcs.md) — consistent NPC voices
- README — audio/visual as later output layers over text-first JSON
