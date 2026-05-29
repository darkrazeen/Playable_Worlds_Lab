import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyPlayerChoice, initializeWorldSession, loadWorld } from "@playable-worlds/core";

import { createAIGateway } from "../../src/gateway/aiGateway.js";
import { createDirectorAgent } from "../../src/agents/directorAgent.js";
import { FakeProvider } from "../../src/providers/fakeProvider.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("AI fallback playability integration", () => {
  it("logs fallback_used and still applies player choices after director failure", async () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    expect(worldResult.ok).toBe(true);
    const world = worldResult.world!;

    const sessionResult = initializeWorldSession(world, {
      sessionId: "session_ai_fallback_playability",
    });
    expect(sessionResult.ok).toBe(true);
    const session = sessionResult.session!;
    expect(session.currentBeatId).toBe("beat_ogre_bridge");

    const agent = createDirectorAgent(
      createAIGateway(
        new FakeProvider({
          scenario: { kind: "error", message: "director unavailable" },
        }),
      ),
    );

    const ledgerBefore = JSON.stringify(session.ledger);
    const { result, session: afterAi } = await agent.suggestNextBeat({ session });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(JSON.stringify(afterAi.ledger)).toBe(ledgerBefore);
    expect(afterAi.debugEvents.some((e) => e.type === "fallback_used")).toBe(true);

    const playResult = applyPlayerChoice(world, afterAi, "fight_ogre");
    expect(playResult.ok).toBe(true);
    expect(playResult.session?.currentBeatId).toBe("beat_landslide_aftermath");
    expect(playResult.session?.ledger.activeFlags).toContain("ogre_defeated");
    expect(playResult.session?.turnNumber).toBe(1);
  });
});
