# Cursor Project Context - Playable Worlds Lab

> **Use this file as the main Cursor-readable project document.**
> Recommended repo path: `docs/cursor-project-context.md`

This document is written for Cursor or any AI coding tool working inside the Playable Worlds Lab repository. It summarizes the project vision, scope, architecture, source priority, implementation rules, and roadmap in a plain Markdown format that is easier for Cursor to read than PDF or DOCX.

## Cursor Usage Rules

Before implementing any code, Cursor should:

1. Treat this file as project context, not as permission to build everything at once.
2. Implement only the current human-approved step.
3. List allowed scope, blocked scope, expected files, tests, and assumptions before coding.
4. Keep AI advisory only: AI proposes, validators check, deterministic engine executes.
5. Prefer schemas, validators, fixtures, and tests before UI or generated content.
6. Stop when credentials, external setup, Supabase, API keys, billing, or unclear scope is required.
7. End every task with files changed, tests run, result, blockers, and next safe step.

## Source Priority

1. Current human-approved task prompt.
2. This Cursor Project Context document.
3. Existing repository code.
4. Archived or older PDFs only as historical references.
5. Cursor suggestions.

If instructions conflict, Cursor should stop and ask the human owner which instruction wins.

---

# Playable Worlds Lab

> **A schema-first, text-first AI-directed world engine where player choices change remembered world state.**

Playable Worlds Lab is an experimental game-world platform for creating, playing, evolving, testing, sharing, forking, and remixing AI-directed playable worlds.

The short version:

**AI proposes. Validators check. The game engine executes.**

This project is not trying to become a giant 3D metaverse on day one. The first goal is smaller, stricter, and more useful: prove that an AI-assisted game world can be represented as structured game logic, validated safely, played through meaningful choices, remembered through state, tested for broken paths, and eventually rendered through richer visual layers.

The first proof world is **Stonepass Valley**, a compact fantasy scenario where a player reaches a bridge blocked by an ogre. The player can fight, trick, feed, talk to, or sneak around the ogre. Each choice changes world state. One path causes a landslide, exposes a temporary cave, sends the player through a short instance, and awakens a dragon. That small chain proves the core systems before bigger generation, sharing, multiplayer, 2D, or 3D layers are added.

---

## Table of Contents

- [Project Status](#project-status)
- [What This Project Is](#what-this-project-is)
- [What This Project Is Not](#what-this-project-is-not)
- [Core Product Thesis](#core-product-thesis)
- [Why Text First](#why-text-first)
- [First Proof World: Stonepass Valley](#first-proof-world-stonepass-valley)
- [Core Operating Principles](#core-operating-principles)
- [MVP Scope](#mvp-scope)
- [High-Level Architecture](#high-level-architecture)
- [Core Systems](#core-systems)
- [Runtime Flow](#runtime-flow)
- [AI Direction Model](#ai-direction-model)
- [Validation and Safety Model](#validation-and-safety-model)
- [Replay Variation Model](#replay-variation-model)
- [Tech Stack](#tech-stack)
- [Recommended Repository Structure](#recommended-repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Common Commands](#common-commands)
- [Data Contracts](#data-contracts)
- [Testing Strategy](#testing-strategy)
- [Development Workflow](#development-workflow)
- [Rules for Cursor and AI Coding Tools](#rules-for-cursor-and-ai-coding-tools)
- [Roadmap](#roadmap)
- [Definitions of Done](#definitions-of-done)
- [Debugging and Observability](#debugging-and-observability)
- [Future Vision](#future-vision)
- [FAQ](#faq)
- [License](#license)

---

## Project Status

**Status:** Early implementation / pre-MVP foundation.

Playable Worlds Lab should be treated as an active experimental product and engineering prototype. The current priority is to build the foundation correctly, not to overbuild visuals, social systems, marketplaces, or multiplayer too early.

The first milestone is not “build the full game.”

The first milestone is:

> Make Stonepass Valley playable in the browser as a text-first world where choices update world state, consequences are recorded in a ledger, AI can suggest next steps safely, and invalid generated output is rejected.

---

## What This Project Is

Playable Worlds Lab is a platform and runtime for AI-directed playable worlds.

It is:

- A **game concept compiler** that can eventually turn vague world ideas into structured playable blueprints.
- A **world-state engine** that tracks choices, flags, goals, locations, NPC attitudes, temporary instances, and history.
- A **story beat graph runtime** where player choices lead to consequences and next playable moments.
- A **consequence engine** that applies deterministic world changes.
- A **world memory ledger** that records what happened and why it matters.
- An **AI Director runtime** that can suggest next beats, NPC reactions, recaps, temporary instances, critiques, and generated drafts.
- A **validation-first game framework** where generated content must pass schemas and deterministic checks before it becomes playable.
- A **creator tool foundation** that can later support generating, editing, testing, sharing, forking, and remixing worlds.
- A **future network of worlds** where players may eventually carry identity, memories, badges, artifacts, and decisions across portals.

The project is built around one key idea:

> The future of AI games is not just generating pretty scenes from prompts. The stronger bet is generating structured, inspectable, validated, replayable game logic first.

---

## What This Project Is Not

At least for the MVP, this project is **not**:

- A Roblox clone.
- A public user-generated-content chaos platform.
- A VR-only metaverse.
- A AAA 3D open-world generator.
- A real-time multiplayer game.
- A public marketplace.
- A full RPG stat, inventory, economy, or combat simulator.
- A voice-chat social platform.
- An AI chatbot pretending to be a game engine.
- An autonomous AI agent that can directly rewrite permanent world truth.

Those features may sound exciting, but building them too early would be a mistake. The engine needs structure, memory, validation, testing, and replayability before visual or social scale makes sense.

---

## Core Product Thesis

Playable Worlds Lab turns game ideas into living, shareable, AI-directed playable worlds.

The long-term product path looks like this:

```text
Idea
-> WorldDefinition
-> Story beats
-> Choices
-> Consequences
-> Ledger memory
-> AI suggestions
-> Validation
-> Playtesting
-> Save/share/fork/remix
-> Later visual runtime
```

The project starts with text because text exposes whether the world actually works.

If a world cannot survive as validated text logic, it will not magically become good because it has graphics.

---

## Why Text First

Text-first does not mean low ambition. It means the project is proving the hardest system-level pieces before spending time on presentation.

Text-first lets the project validate:

- Whether player choices matter.
- Whether consequences are applied correctly.
- Whether world state is remembered.
- Whether branches remain reachable.
- Whether AI suggestions are useful but controlled.
- Whether generated content can be validated.
- Whether temporary instances can resolve back into the main world.
- Whether replay variation can be explained instead of random.
- Whether playtesting can detect broken or weak paths.
- Whether worlds can later be saved, shared, forked, and remixed.

Visuals can come later as an output layer.

The world engine comes first.

---

## First Proof World: Stonepass Valley

**Stonepass Valley** is the first official proof world.

It is intentionally small. That is the point.

The player reaches a bridge blocked by an ogre. The player can choose different approaches:

- Fight the ogre.
- Trick the ogre.
- Feed the ogre.
- Talk to the ogre.
- Sneak around the ogre.

Each path changes world state differently.

A core proof chain looks like this:

```text
Player reaches ogre-blocked bridge
-> Player makes a choice
-> Consequence Engine applies world change
-> World Ledger records the event
-> Main path causes landslide
-> Hidden cave is exposed
-> Player enters temporary cave
-> Cave has rooms, obstacle, encounter, or puzzle
-> Cave resolves or collapses
-> Dragon awakens
-> New goal appears
```

This one small loop proves:

- Story beat selection.
- Player choice handling.
- Consequence application.
- World flags.
- Ledger memory.
- Temporary instance support.
- AI Director suggestions.
- NPC reactions.
- Validation and fallback behavior.
- Debug visibility.
- Future save/share/fork/remix support.

Stonepass Valley is the hello-world world.

If Stonepass does not work, the larger platform should not move forward.

---

## Core Operating Principles

### 1. AI proposes

AI may suggest:

- Next story beats.
- NPC reactions.
- Recaps.
- Hints.
- Temporary instance drafts.
- Critiques.
- Generated world drafts.
- Playtester reports.

AI does **not** directly mutate permanent world truth.

### 2. Validators check

All generated or manually-authored content must pass schemas and deterministic validation before use.

This includes:

- World definitions.
- Story beats.
- Player choices.
- Consequences.
- Temporary instances.
- Director decisions.
- NPC reactions.
- Generated world drafts.
- Playtester reports.

### 3. The game engine executes

Only deterministic runtime code can update:

- `WorldSession`
- `WorldLedger`
- world flags
- current beat
- active goals
- completed consequences
- temporary instance state
- debug events

The AI can suggest. The engine decides what becomes real.

### 4. Stonepass first

Every core system should prove itself through Stonepass Valley before generalizing into larger generated worlds.

### 5. Text before visuals

The project should prove world logic before building 2D or 3D presentation.

### 6. One step, one report

Every implementation step should end with:

- Files changed.
- Tests added or updated.
- Commands run.
- Results.
- Acceptance criteria.
- Blockers.
- Next safe step.

---

## MVP Scope

The MVP should prove the text-first playable world engine.

### MVP should include

- Text-based playable world runtime.
- Manual Stonepass Valley world data.
- `WorldDNA` schema.
- `WorldDefinition` schema.
- `StoryBeat` schema.
- `PlayerChoice` schema.
- `Consequence` schema.
- `WorldLedger` schema.
- `WorldSession` object.
- Consequence Engine.
- Story beat selector.
- Choice resolver.
- Debug event log.
- AI provider interface.
- Fake AI provider.
- AI Gateway.
- `AIResult` wrapper.
- AI Director v1.
- NPC Reaction Agent.
- Structured output validation.
- Retry/fallback behavior.
- Temporary Instance schema.
- Temporary cave generator or deterministic fallback.
- Cross-file world validation.
- World Health Score v1.
- AI Playtester v1.
- Browser text play page.
- Ledger/debug/reasoning panels.
- Local or basic persistence.
- Save/resume.
- Share/fork/remix after earlier gates pass.

### MVP should not include yet

- 2D runtime.
- 3D runtime.
- Large procedural maps.
- Public world discovery.
- Public user-generated content.
- Marketplace.
- Creator monetization.
- Real-time multiplayer.
- Voice chat.
- VR.
- Full RPG character builder.
- Full economy.
- PvP.
- Complex avatar cosmetics.
- Public child-safe world sharing.

---

## High-Level Architecture

The project is organized around deterministic world logic with controlled AI assistance.

```text
                    ┌──────────────────────┐
                    │      Player UI        │
                    │ Text choices + panels │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Runtime Engine     │
                    │ beat + choice resolver│
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
      ┌──────────────┐ ┌──────────────┐ ┌────────────────┐
      │ Story Graph  │ │ Consequence  │ │ World Session  │
      │ Beat rules   │ │ Engine       │ │ Current state   │
      └──────────────┘ └──────┬───────┘ └───────┬────────┘
                              │                 │
                              ▼                 ▼
                       ┌──────────────┐ ┌────────────────┐
                       │ World Ledger │ │ Debug Events   │
                       │ Memory log   │ │ Why it happened│
                       └──────┬───────┘ └────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Validators + Schemas  │
                    │ Zod + graph checks    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      AI Gateway       │
                    │ Provider abstraction  │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐ ┌──────────────┐ ┌───────────────┐
       │ AI Director │ │ NPC Reaction │ │ AI Playtester │
       │ suggestions │ │ generation   │ │ quality check │
       └─────────────┘ └──────────────┘ └───────────────┘
```

The important part:

**The runtime is deterministic. AI is advisory. Validators are mandatory.**

---

## Core Systems

### World DNA

`WorldDNA` defines the identity and operating rules of a world.

It includes details like:

- Genre.
- Tone.
- Session length.
- Core loop.
- Consequence intensity.
- AI creativity level.
- Safety mode.

World DNA prevents vague generation and helps make worlds remixable.

Example:

```ts
type WorldDNA = {
  genre: "fantasy" | "sci_fi" | "mystery" | "cozy" | "survival";
  tone: "cozy" | "heroic" | "dark" | "funny" | "mysterious";
  sessionLengthMinutes: 5 | 10 | 15 | 30 | 45;
  coreLoop: string[];
  consequenceIntensity: "light" | "medium" | "major";
  aiCreativity: "conservative" | "balanced" | "wild";
  safetyMode: "teen" | "adult";
};
```

### WorldDefinition

`WorldDefinition` is the full validated world blueprint.

It should eventually include:

- World identity.
- World DNA.
- Locations.
- NPCs.
- Story beats.
- Consequences.
- Temporary instance templates.
- Safety rules.
- Initial ledger state.
- Completion conditions.
- Debug metadata.
- Version metadata.

A world is not playable until its full definition validates.

### Story Beat Graph

The Story Beat Graph is the playable structure of a world.

A story beat is a moment where something can happen:

- The player enters a scene.
- An NPC blocks the path.
- A choice appears.
- A goal is introduced.
- A consequence unlocks another route.
- A hidden beat becomes available.
- A temporary instance opens.

Story beats are not just text. They are structured nodes with triggers, available choices, required flags, blocked flags, possible consequences, and next hooks.

### Player Choice

A player choice is an action the player can take inside a story beat.

Choices can have:

- labels
- descriptions
- required flags
- blocked flags
- consequence IDs

The runtime must reject invalid choices.

### Consequence Engine

The Consequence Engine applies deterministic world changes after a valid choice.

Consequences may:

- add flags
- remove flags
- update NPC attitude
- unlock goals
- complete goals
- expose locations
- close locations
- start temporary instances
- update visible world state
- write ledger events
- create debug events

This is one of the most important systems in the project.

AI can suggest a consequence, but the engine must validate and execute it.

### World Ledger

The World Ledger is the memory of the world.

It records:

- player choices
- consequences
- flags
- goals
- AI suggestions
- temporary instance events
- system events
- important world changes

The ledger allows the world to remember, recap, debug, and explain itself.

### WorldSession

`WorldSession` is the current playable state of a run.

It should track:

- session ID
- world ID
- current story beat
- turn number
- active flags
- completed choices
- active goals
- active temporary instance
- ledger
- debug events
- run profile
- save metadata

### DebugEvent Log

Debug events explain why something happened.

Examples:

- choice accepted
- choice rejected
- consequence applied
- flag added
- story beat selected
- AI output rejected
- fallback used
- temporary instance started
- world validation failed

This matters because AI game systems can become confusing fast. The creator and developer need visibility into why the world behaved a certain way.

### AI Gateway

The AI Gateway is the controlled access layer for all model/provider calls.

It should handle:

- provider selection
- fake provider support
- prompt contracts
- structured output parsing
- schema validation
- retry behavior
- fallbacks
- safety checks
- trace/debug metadata

No agent should call a provider directly without going through the gateway.

### AIResult Wrapper

All AI calls should return a controlled result object.

A useful pattern:

```ts
type AIResult<T> =
  | {
      ok: true;
      data: T;
      provider: string;
      model?: string;
      debug?: Record<string, unknown>;
    }
  | {
      ok: false;
      error: string;
      fallbackUsed: boolean;
      fallback?: T;
      debug?: Record<string, unknown>;
    };
```

This keeps AI behavior inspectable and recoverable.

### AI Director

The AI Director suggests next meaningful actions based on world state.

It may suggest:

- next beat
- pacing adjustment
- hint
- NPC reaction direction
- recap
- temporary instance idea
- branch critique

It must not directly mutate permanent state.

### NPC Reaction Agent

The NPC Reaction Agent generates or selects NPC reactions that fit:

- the current story beat
- NPC personality
- player choice
- world tone
- safety mode
- previous ledger state

If generation fails or validation rejects output, the runtime must use fallback text.

### Temporary Instance Generator

Temporary instances are short playable spaces that exist for a limited purpose.

Examples:

- cave
- ruin
- dream
- dungeon
- trial
- memory sequence

For Stonepass, the core temporary instance is the cave exposed by a landslide.

A valid temporary instance should have:

- ID
- title
- entrance condition
- rooms
- encounters or puzzles
- completion condition
- exit consequence
- cleanup behavior
- fallback template

Temporary instances should not become uncontrolled permanent map bloat.

### World Validator

The world validator checks whether a world is structurally playable.

It should catch:

- missing IDs
- duplicate IDs
- invalid references
- broken consequence links
- unreachable required beats
- choices pointing to missing consequences
- consequences pointing to missing flags or beats
- invalid safety mode
- missing fallback behavior
- invalid temporary instance structure

### World Health Score

The World Health Score is a quality signal for a world.

It may consider:

- schema validity
- graph validity
- path coverage
- broken links
- unreachable goals
- consequence quality
- replay variation quality
- safety compliance
- fallback coverage
- playtester results

The goal is not to pretend quality is fully objective. The goal is to prevent obviously broken worlds from being shared or promoted.

### AI Playtester

The AI Playtester is a quality agent that attempts to inspect or simulate world paths.

It should report:

- broken paths
- missing goals
- weak choices
- repetitive beats
- unresolved consequences
- safety issues
- unreachable endings
- confusing state changes
- poor replay value

The AI Playtester should not be treated as the only test layer. It is extra coverage on top of deterministic tests.

---

## Runtime Flow

A basic deterministic text runtime should work like this:

```text
1. Load WorldDefinition.
2. Validate WorldDefinition.
3. Create WorldSession.
4. Select starting StoryBeat.
5. Render beat text and available choices.
6. Player selects a choice.
7. Runtime validates choice availability.
8. Consequence Engine applies consequence.
9. World Ledger records event.
10. DebugEvent records why changes happened.
11. Runtime selects next valid StoryBeat.
12. AI Director may suggest next beat/reaction.
13. AI output is validated.
14. Invalid AI output is rejected.
15. Fallback behavior keeps the game playable.
16. Session can be saved/resumed.
```

The engine should remain playable even when AI fails.

---

## AI Direction Model

The AI layer should be useful, but never trusted blindly.

### AI may do

- Suggest next story beats.
- Suggest NPC reactions.
- Generate short recaps.
- Generate temporary instance drafts.
- Critique weak branches.
- Assist with prompt-to-world drafts after core runtime exists.
- Help playtest world quality.
- Explain possible pacing improvements.

### AI may not do

- Directly mutate `WorldLedger`.
- Directly mutate permanent world state.
- Bypass schemas.
- Bypass safety mode.
- Invent new runtime object shapes.
- Add rewards, economy, inventory, or permanent truth without validation.
- Continue gameplay if required validation fails.
- Hide why a suggestion was made.
- Become the game engine.

### Required fallback behavior

Every AI-powered feature needs fallback behavior.

Examples:

- If Director output is invalid, use deterministic next-beat logic.
- If NPC reaction fails, use authored fallback dialogue.
- If temporary instance generation fails, use a default cave template.
- If recap generation fails, summarize from the ledger deterministically.
- If provider credentials are missing, use FakeProvider or disable real provider calls cleanly.

---

## Validation and Safety Model

Playable Worlds Lab is built as a teen/adult project.

```ts
type SafetyMode = "teen" | "adult";
```

### Teen mode allows

- Adventure-safe tone.
- Fantasy danger.
- Suspense.
- Non-graphic combat.
- Mystery.
- Limited mild romance references.

### Teen mode blocks

- Explicit sexual content.
- Graphic gore.
- Hate content.
- Self-harm instruction.
- Real-world extremist praise.
- Exploitative content.
- Instructions for real-world harm or illegal activity.

### Adult mode allows

- Darker stakes.
- Stronger danger.
- Mature themes.
- Sparing stronger language when tone supports it.

### Adult mode still blocks

- Explicit sexual content.
- Graphic gore.
- Hate content.
- Self-harm instruction.
- Real-world extremist praise.
- Exploitative content.
- Instructions for real-world harm or illegal activity.

### Public features are blocked until safety gates exist

The following should not ship early:

- Public UGC.
- Public discovery.
- Creator monetization.
- Social chat.
- Voice chat.
- Public remix library.
- Child public sharing.

---

## Replay Variation Model

Playable Worlds Lab should respect what existing text and interactive-fiction games already do well: choices, branches, variables, routes, archetypes, alternate endings, and slightly different playthroughs.

The difference is that this project turns those ideas into a validated world engine with AI direction, memory, creator inspection, playtesting, sharing, forking, remixing, and later visual layers.

### Variation layers

| Layer | Name | Example | Build timing |
| --- | --- | --- | --- |
| 1 | Starting archetype | warrior, mage, rogue, diplomat | Lightweight Phase 1/2 support only |
| 2 | Starting route | bridge, town, castle, forest | Phase 1/2 as flavor or small route changes |
| 3 | Consequence branches | ogre defeated, allied, tricked, avoided | Phase 1 |
| 4 | Conditional text | mage sees runes; warrior sees battle marks | Phase 1/2 |
| 5 | NPC memory | elder trusts or fears player | Phase 2 |
| 6 | Temporary instance variants | puzzle cave vs creature cave | Phase 3 |
| 7 | AI Director variation | next beat adapts to current state | Phase 2/3 |
| 8 | Remix/fork variation | alternate timeline/version | Phase 6 |
| 9 | Generated world variation | prompt creates a new valid world | Phase 5+ |

### Replay guardrails

Every variation should be explainable by one or more of:

- player profile
- starting route
- seed
- flag
- consequence
- NPC attitude
- validated AI suggestion
- approved remix/fork

Do not use random AI improvisation as a substitute for world logic.

Do not build a full RPG class system in the MVP.

A lightweight future contract may look like this:

```ts
type PlayerArchetype = "warrior" | "mage" | "rogue" | "diplomat";

type RunProfile = {
  archetype: PlayerArchetype;
  startingRoute?: "bridge" | "town" | "castle" | "forest";
  personalityTags?: string[];
};
```

This should remain a replay-flavor layer, not a full character-builder system.

---

## Tech Stack

Recommended stack:

| Area | Choice | Reason |
| --- | --- | --- |
| App framework | Next.js | Browser MVP, routing, API routes, fast iteration |
| UI | React | Component-based play and creator UI |
| Language | TypeScript | Safer contracts for world/runtime objects |
| Styling | Tailwind CSS | Fast UI scaffolding |
| Validation | Zod | Runtime schema validation |
| Unit tests | Vitest | Fast schema/runtime testing |
| Browser tests later | Playwright | End-to-end text runtime testing |
| AI provider layer | Custom interface | OpenAI/Anthropic/Gemini/Ollama/FakeProvider can be swapped |
| Persistence later | Supabase Postgres | Simple MVP backend once local runtime works |
| 2D later | Phaser | Browser 2D rendering after text gate |

The early stack should stay boring on purpose.

Do not add state-management libraries, UI kits, game engines, auth systems, marketplace infrastructure, or database layers before the relevant phase requires them.

---

## Recommended Repository Structure

```text
playable-worlds-lab/
  apps/
    web/
      app/
      components/
      features/
        world-create/
        world-play/
        world-debug/
        world-share/
        creator/

  docs/
    source-priority.md
    content-safety-rules.md
    decision-log.md
    architecture.md
    roadmap.md

  packages/
    core/
      world/
      story/
      ledger/
      consequence/
      runtime/
      session/
      debug/
      validators/
        validateWorldDefinition.ts
      migrations/
      health/
      playtest/
      schemas/

    ai/
      gateway/
      contracts/
      providers/
        fakeProvider.ts
        openaiProvider.ts
        anthropicProvider.ts
        geminiProvider.ts
        ollamaProvider.ts
      agents/
        worldArchitectAgent.ts
        directorAgent.ts
        consequenceAgent.ts
        instanceGeneratorAgent.ts
        npcAgent.ts
        playtesterAgent.ts
        criticAgent.ts

    content/
      templates/
      worlds/
        stonepass-valley/
      npcs/
      creatures/
      story-beats/

  tests/
    unit/
    integration/
    fixtures/

  .env.example
  .nvmrc
  package.json
  README.md
```

This structure can be adjusted as the implementation becomes real, but the separation should stay clear:

- `core` owns deterministic world logic.
- `ai` owns provider abstractions and AI agents.
- `content` owns world data and templates.
- `apps/web` owns browser UI.
- `tests` owns validation and runtime proof.

---

## Getting Started

> These instructions assume the repository has been initialized and the planned JavaScript/TypeScript stack has been installed. Adjust commands if the package manager changes.

### Prerequisites

Recommended:

- Node.js 20+
- npm
- Git
- A code editor such as Cursor or VS Code

Check your local versions:

```bash
node -v
npm -v
git --version
```

### Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/playable-worlds-lab.git
cd playable-worlds-lab
```

### Install dependencies

```bash
npm install
```

### Create environment file

```bash
cp .env.example .env.local
```

For early phases, real provider keys are not required. The project should support FakeProvider tests before real AI calls.

### Run development server

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### Run type checks

```bash
npm run typecheck
```

### Run linting

```bash
npm run lint
```

---

## Environment Variables

Use `.env.example` to document required variables.

Do not commit real secrets.

```bash
# AI providers - blocked until the AI provider phase requires them
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

# Supabase - blocked until persistence/share phases
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App config
NEXT_PUBLIC_APP_URL=
```

Rules:

- Real provider keys are not needed for FakeProvider tests.
- Supabase variables are not needed before persistence and sharing work.
- Service role keys must never be exposed to browser/client code.
- Cursor or any AI coding assistant must update `.env.example` whenever a new env var is introduced.
- Missing credentials should result in a clear human setup callout, not fake completion.

---

## Common Commands

Recommended scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "validate:content": "tsx scripts/validate-content.ts"
  }
}
```

Expected usage:

```bash
npm run dev
npm test
npm run typecheck
npm run lint
npm run validate:content
```

The exact scripts may change during implementation, but every phase should keep testing and validation easy to run.

---

## Data Contracts

The project should be schema-first.

The examples below are simplified starter contracts. The real implementation should use Zod schemas and inferred TypeScript types.

### SafetyMode

```ts
type SafetyMode = "teen" | "adult";
```

### WorldDNA

```ts
type WorldDNA = {
  genre: "fantasy" | "sci_fi" | "mystery" | "cozy" | "survival";
  tone: "cozy" | "heroic" | "dark" | "funny" | "mysterious";
  sessionLengthMinutes: 5 | 10 | 15 | 30 | 45;
  coreLoop: string[];
  consequenceIntensity: "light" | "medium" | "major";
  aiCreativity: "conservative" | "balanced" | "wild";
  safetyMode: SafetyMode;
};
```

### PlayerChoice

```ts
type PlayerChoice = {
  id: string;
  label: string;
  description?: string;
  requiredFlags?: string[];
  blockedByFlags?: string[];
  consequenceId: string;
};
```

### StoryBeat

```ts
type StoryBeat = {
  id: string;
  title: string;
  description: string;
  trigger: string;
  availableChoices: PlayerChoice[];
  possibleConsequences: string[];
  requiredFlags?: string[];
  blockedByFlags?: string[];
  isEnding?: boolean;
  isHidden?: boolean;
};
```

### WorldEvent

```ts
type WorldEvent = {
  id: string;
  type: "choice" | "consequence" | "flag" | "goal" | "instance" | "ai" | "system";
  summary: string;
  turnNumber: number;
  metadata?: Record<string, unknown>;
};
```

### WorldLedger

```ts
type WorldLedger = {
  activeFlags: string[];
  completedFlags: string[];
  activeGoals: string[];
  completedGoals: string[];
  events: WorldEvent[];
};
```

### WorldSession

```ts
type WorldSession = {
  id: string;
  worldId: string;
  currentBeatId: string;
  turnNumber: number;
  ledger: WorldLedger;
  activeInstanceId?: string;
  choiceHistory: string[];
  debugEvents: DebugEvent[];
};
```

### DebugEvent

```ts
type DebugEvent = {
  id: string;
  type:
    | "choice.accepted"
    | "choice.rejected"
    | "consequence.applied"
    | "flag.added"
    | "beat.selected"
    | "ai.validated"
    | "ai.rejected"
    | "fallback.used"
    | "instance.started"
    | "instance.completed"
    | "system.error";
  message: string;
  turnNumber: number;
  metadata?: Record<string, unknown>;
};
```

### DirectorDecision

```ts
type DirectorDecision = {
  suggestedBeatId?: string;
  suggestedNpcReaction?: string;
  reason: string;
  confidence: number;
  safetyNotes?: string[];
};
```

### TemporaryInstance

```ts
type TemporaryInstance = {
  id: string;
  title: string;
  description: string;
  entranceConditionFlags: string[];
  rooms: TemporaryInstanceRoom[];
  completionCondition: string;
  exitConsequenceId: string;
  cleanupBehavior: "collapse" | "vanish" | "seal" | "remain_inactive";
};
```

---

## Testing Strategy

Testing is not a later concern. It is part of the product.

### Phase 0 tests

- Schema validation tests.
- Valid Stonepass world fixture passes.
- Invalid world fixtures fail.
- FakeProvider returns valid structured output.
- Invalid AI output is rejected.

### Phase 1 tests

- Player can start Stonepass Valley.
- Player can select valid choices.
- Invalid choices are blocked.
- Consequences update flags correctly.
- Ledger records events.
- Next beat selection works.
- Runtime works without AI.

### Phase 2 tests

- AI Director returns valid `DirectorDecision`.
- Invalid AI output is rejected.
- Fallback behavior fires.
- AI cannot mutate ledger directly.
- NPC reaction respects tone and length.
- Game remains playable if AI provider fails.

### Phase 3 tests

- Temporary cave requires the correct flag.
- Cave has entrance, rooms, goal, completion condition, and exit consequence.
- Player can complete cave.
- Completing cave adds `dragon_awake`.
- Cave resolves or collapses after completion.
- Ledger records the instance lifecycle.

### Phase 4 tests

- Browser play page loads.
- Player can play through a basic path.
- Ledger panel updates.
- Debug/reasoning panel updates.
- Save/resume works locally or through approved persistence.

### Later tests

- Prompt-to-world creates valid world definitions.
- Share/fork/remix does not overwrite originals.
- AI Playtester catches broken worlds.
- World Health Score reflects validation and playtest results.
- 2D runtime renders from the same world data without changing core logic.

---

## Development Workflow

Use a phase-locked workflow.

1. Pick one incomplete step.
2. Confirm the phase.
3. List allowed scope.
4. List blocked scope.
5. Make the smallest useful change.
6. Add or update schemas first.
7. Add deterministic validators.
8. Add tests.
9. Run the narrowest relevant command.
10. Report results.
11. Stop.
12. Commit one clean step.

Do not combine unrelated features in one change.

Do not let “while I’m here” refactors creep into the project.

---

## Rules for Cursor and AI Coding Tools

AI coding tools can help build this project, but they must be controlled tightly.

### Before coding, the AI tool must answer

```text
Step I am implementing:
Phase/week this belongs to:
Files I expect to create/change:
Files I will not touch:
Dependencies needed, if any:
Tests I will add or update:
Risks or assumptions:
Human setup required, if any:
Acceptance criteria I am targeting:
Waiting for approval before coding:
```

If the answer is vague, do not allow code changes yet.

### Global rules

- Implement only the assigned step.
- Do not jump to the next phase.
- Do not invent object shapes.
- Do not add dependencies casually.
- Do not add multiplayer early.
- Do not add 2D/3D early.
- Do not add marketplace/public UGC early.
- Do not hardcode secrets.
- Do not let AI mutate permanent truth.
- Add tests before calling work complete.
- Use fallbacks for AI failure.
- Report exact test commands and results.

### Dangerous prompts to avoid

Avoid prompts like:

- “Make this more impressive.”
- “Improve the architecture.”
- “Build the full game.”
- “Make it production ready.”
- “Clean up everything.”
- “Add whatever is missing.”
- “Just make it work.”

Use scoped prompts instead:

- “Implement Phase 0 schema validation only.”
- “Add the StoryBeat schema and tests.”
- “Implement the choice resolver without AI.”
- “Add fallback behavior for invalid DirectorDecision output.”
- “Add the temporary cave validator and one valid/invalid fixture.”

---

## Roadmap

### Phase 0: Product and Architecture Foundation

Goal: define the world contracts and prove Stonepass can exist as structured data.

Build:

- Master project spec.
- World DNA schema.
- Story Beat schema.
- Player Choice schema.
- Consequence schema.
- World Ledger schema.
- Director Decision schema.
- Temporary Instance schema.
- AI provider interface.
- FakeProvider.
- Manual Stonepass Valley JSON.
- Schema tests.

Done when:

- All core schemas exist.
- Invalid AI/world data is rejected.
- Stonepass can be represented fully in JSON.
- FakeProvider can return a valid DirectorDecision.

### Phase 1: Text-Only Playable Runtime

Goal: make Stonepass playable through deterministic text choices without AI dependency.

Build:

- World loader.
- WorldSession object.
- Story beat selector.
- Choice resolver.
- Consequence applier.
- World Ledger writer.
- Text play screen.
- Manual Stonepass path tests.

Done when:

- Player can start Stonepass.
- Player can select fight, feed, sneak, talk, or trick choices.
- Choice applies correct consequence.
- Ledger records event.
- Invalid choice is blocked.
- Runtime works without AI.

### Phase 2: AI Director v1

Goal: add AI suggestions while keeping deterministic systems as source of truth.

Build:

- AI Gateway.
- FakeProvider.
- Provider placeholders.
- DirectorAgent.
- NPCReactionAgent.
- Structured output validation.
- Retry/fallback logic.
- Director reasoning panel.

Done when:

- Valid DirectorDecision passes validation.
- Invalid JSON is rejected.
- Fallback fires.
- AI cannot mutate ledger.
- NPC reaction stays within tone and length constraints.
- Game remains playable if AI fails.

### Phase 3: Temporary Instance Generation

Goal: generate or load a short cave/ruin/trial that resolves back to the main world.

Build:

- TemporaryInstance schema.
- Instance validator.
- Room system.
- Encounter/puzzle support.
- Completion consequence.
- Cleanup/vanish mechanic.
- Default cave fallback.

Done when:

- Cave requires `cave_exposed` flag.
- Cave has entrance, rooms, goal, completion condition, and exit consequence.
- Player can complete cave.
- Completing cave adds `dragon_awake`.
- Cave resolves or vanishes.
- Ledger records the full chain.

### Phase 4: Browser UI and Persistence

Goal: make the text product usable in the browser.

Build:

- Play page.
- Choice UI.
- Ledger panel.
- Debug events panel.
- AI reasoning panel.
- World card.
- Save/resume.

Done when:

- User can play Stonepass in browser.
- User can inspect choices, ledger, and debug reasoning.
- User can resume progress locally or through approved persistence.
- UI does not require real AI provider success.

### Phase 5: Prompt-to-World

Goal: generate basic playable text worlds from prompts after Stonepass works manually.

Build:

- WorldArchitectAgent.
- Template selector.
- World DNA generator.
- Initial story beats.
- Initial consequences.
- Health score.
- Validation pipeline.

Done when:

- Prompt produces a valid playable text world.
- Invalid generated worlds are rejected.
- User can review before applying.
- Generated world does not bypass validators.

### Phase 6: Share/Fork/Remix

Goal: make worlds portable and replayable.

Build:

- Share links.
- Snapshot vs fresh-start modes.
- Forking.
- Remixing.
- Versioning.
- Patch notes.

Done when:

- Forked worlds do not overwrite originals.
- Shared worlds preserve intended state.
- Remixes have traceable lineage.
- Broken worlds are blocked from public sharing.

### Phase 7: AI Playtester and World Health

Goal: prevent weak or broken AI worlds from becoming playable/shared.

Build:

- PlaytesterAgent.
- CriticAgent.
- Consistency checker.
- Reward/consequence validator.
- Approval queue.
- Health dashboard.

Done when:

- Broken worlds are flagged.
- Missing paths are detected.
- Weak consequences are reported.
- World Health Score is visible.

### Phase 8: 2D Runtime

Goal: render the same world data as simple 2D scenes.

Build:

- Phaser map renderer.
- Player movement.
- NPC/object rendering.
- Simple interactions.
- Visual state changes.
- Temporary cave rendering.

Done when:

- Same JSON powers text and 2D.
- Visual layer does not rewrite the engine.
- Stonepass can be represented visually.

### Phase 9: Creator Cockpit

Goal: give creators inspection and control.

Build:

- World DNA editor.
- Graph viewer.
- Ledger viewer.
- AI rules editor.
- Health dashboard.
- Patch/rollback controls.

Done when:

- Creator can inspect, edit, approve, reject, and rollback world changes.

### Phase 10: World Passport

Goal: create cross-world identity.

Build:

- Player profile.
- World Passport.
- Badges.
- Artifacts.
- Visited worlds.
- Major decisions.

Done when:

- Player has persistent world history across worlds.

### Phase 11: Official World Packs

Goal: launch polished official examples.

Possible packs:

- Stonepass Valley.
- Dragon Grove Learning Pack.
- Aetherfall RPG Pack.
- Puzzle Temple Pack.

Done when:

- Official packs are valid, playable, tested, and useful as templates.

### Phase 12: Co-op Experiments

Goal: add social play carefully.

Possible experiments:

- Friend challenge.
- Play my fork.
- Two-player co-op prototype.

Done when:

- Social play works without MMO complexity.

### Phase 13: 2.5D / 3D Output Layer

Goal: move toward richer presentation without replacing the engine.

Possible work:

- Stylized portal hub.
- Low-poly world instance.
- 3D adapter.

Done when:

- 3D is an output layer, not a rewrite.

---

## Definitions of Done

### 30-day definition of done

Stonepass Valley is playable in the browser as text.

Required:

- Player can make meaningful choices.
- Choice consequences update world state.
- Ledger records events.
- AI Director can suggest next beat or reaction.
- AI cannot mutate permanent truth.
- Invalid AI output is rejected.
- Fallback behavior works.
- NPC reaction generation works or safely falls back.
- Progress can be resumed locally or through basic persistence.
- No prompt-to-world, 2D, multiplayer, marketplace, or public UGC work has started.

### 90-day definition of done

The text-world engine becomes a real prototype platform.

Required:

- Prompt-to-world generation creates valid playable text worlds.
- Story Beat Graph supports branching.
- Required paths are not unreachable.
- Consequence Engine supports meaningful world changes.
- Temporary cave flow works.
- AI Director works through validated output.
- NPC reactions work through provider/fallback.
- World Ledger is visible.
- World Health Score exists.
- AI Playtester exists.
- Save/share/fork/remix exists.
- Creator Cockpit v1 exists.
- Stonepass has a complete end-to-end text demo.
- 2D runtime has not started until this gate passes.

---

## Debugging and Observability

Playable Worlds Lab should be easy to inspect.

Every important state change should be explainable.

Useful debug views:

- Current world ID.
- Current session ID.
- Current beat ID.
- Available choices.
- Active flags.
- Active goals.
- Completed goals.
- NPC attitudes.
- Active instance.
- Ledger events.
- Debug events.
- Last AI request.
- Last AI response.
- AI validation result.
- Fallback used.
- World Health Score.

This project should avoid black-box magic.

If the player or creator asks “why did that happen?”, the system should have an answer.

---

## Future Vision

The long-term vision is a cross-platform universe of AI-directed playable worlds.

Not one giant world.

A network of controlled worlds.

Possible future features:

- World Hub.
- Official world packs.
- Private worlds.
- Friend-shared worlds.
- Forked timelines.
- Remixable templates.
- World Passport.
- Badges.
- Artifacts.
- Secrets.
- Portal links.
- Seasonal challenges.
- Creator tools.
- AI-assisted world repair.
- 2D and 3D output layers.
- Curated public discovery after safety gates.
- Co-op experiments after single-player foundations work.

The OASIS-like inspiration is useful only as a north star:

- many worlds
- one identity
- portals
- secrets
- trophies
- social hubs
- player-created spaces
- cross-world journeys

But the build path must stay practical.

Start with Stonepass.

Prove the engine.

Then expand.

---

## FAQ

### Is this a text adventure game?

Partly, but that is too small of a description.

The first runtime is text-first, but the product is really a structured playable-world engine. Text is the first output layer because it makes logic, state, validation, and replayability easier to prove.

### Is this an AI chatbot game?

No.

The AI does not own the world. The AI suggests. Validators check. The deterministic engine executes.

### Why not start with 2D or 3D?

Because graphics can hide broken game logic. The project first needs to prove that choices, consequences, world memory, validation, and replay variation actually work.

### Why Stonepass Valley?

Stonepass is small enough to build but rich enough to prove the core systems. The ogre bridge, landslide, cave, and dragon chain tests choices, consequences, memory, temporary instances, and next-goal selection.

### Can AI generate entire worlds?

Eventually, yes. But not before the manual Stonepass runtime works. Prompt-to-world should come after schemas, validators, and the deterministic runtime are stable.

### Can players share worlds?

Eventually, yes. Share/fork/remix is a planned major feature, but it should not ship before world validation, safety rules, and quality gates exist.

### Can this become multiplayer?

Eventually, maybe. But multiplayer is intentionally blocked until the single-player world engine works.

### Can this become 2D or 3D?

Yes. The plan is to let the same structured world data power later visual runtimes. 2D or 3D should be an output layer, not a rewrite of the core engine.

### Can public users create worlds?

Eventually, yes, but public UGC is blocked until moderation, validation, quality scoring, and safety gates exist.

### What makes this different from existing interactive fiction?

Existing interactive fiction often uses branches, variables, routes, classes, stats, and endings. Playable Worlds Lab keeps those strengths but adds structured world validation, AI direction, ledger memory, creator inspection, playtesting, sharing, forking, remixing, and future visual rendering.

---

## License

License is currently **TBD**.

Before publishing or accepting outside contributions, choose and add a real license file such as:

- MIT
- Apache-2.0
- GPL-3.0
- Proprietary / All rights reserved

Do not assume open-source rights until a license is explicitly added.

---

## Current North Star

Build Stonepass Valley as a browser-playable, text-first AI-directed world where player choices change remembered world state, AI suggests validated next steps, a temporary cave can awaken a dragon, and the whole world can later be saved, tested, shared, forked, and remixed safely.

**AI proposes. Validators check. The game engine executes.**
