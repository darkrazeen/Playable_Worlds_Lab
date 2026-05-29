import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("Stonepass session initialization integration", () => {
  it("loads Stonepass and initializes a play-ready session", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    expect(worldResult.ok).toBe(true);

    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_stonepass_integration_001",
    });

    expect(sessionResult.ok).toBe(true);
    expect(sessionResult.session?.currentBeatId).toBe(worldResult.world?.startingBeatId);
    expect(sessionResult.session?.turnNumber).toBe(0);
    expect(sessionResult.session?.choiceHistory).toEqual([]);
    expect(sessionResult.session?.debugEvents).toHaveLength(1);
    expect(sessionResult.session?.debugEvents[0]?.type).toBe("session_loaded");
  });
});
