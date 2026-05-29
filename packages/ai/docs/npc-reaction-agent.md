# NPCReactionAgent (W4-S5)

`NPCReactionAgent` proposes short `NpcReaction` flavor lines through `AIGateway` only. It **never** mutates `WorldSession`, NPC definitions, or ledger state.

## Output shape

```typescript
{
  npcId: string;
  line: string;
} // line max 280 characters
```

Post-gateway validation enforces:

- `npcId` matches the requested NPC
- **Teen** `safetyMode` — blocklist for unsafe terms
- **Tone** — line must reflect at least one keyword from the NPC's `toneRules`

Failures apply a deterministic fallback (ogre/elder Stonepass presets or a generic line).

## Usage

```typescript
import { createNPCReactionAgentFromEnv } from "@playable-worlds/ai";
import { loadWorld, initializeWorldSession, parseNpc } from "@playable-worlds/core";

const director = createNPCReactionAgentFromEnv();
const session = /* WorldSession */;
const ogre = /* Npc from world */;

const result = await director.suggestReaction({
  session,
  npc: ogre,
  safetyMode: world.worldDNA.safetyMode,
  world,
  trigger: "Player chose to fight the ogre.",
});

if (result.ok) {
  // Display result.value.line — engine does not auto-apply
}
```

## Stonepass presets

Tests and fallbacks use `STONEPASS_OGRE_REACTION` and `STONEPASS_ELDER_REACTION` in `fakeNpcReactionScenarios.ts`.
