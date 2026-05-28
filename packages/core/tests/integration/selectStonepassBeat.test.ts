import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { selectStoryBeat } from "../../src/story/selectStoryBeat.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("Stonepass story beat selection integration", () => {
  it("selects the ogre bridge beat for a fresh Stonepass session", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    expect(worldResult.ok).toBe(true);

    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_stonepass_beat_001",
    });
    expect(sessionResult.ok).toBe(true);

    const beatResult = selectStoryBeat(worldResult.world!, sessionResult.session!);

    expect(beatResult.ok).toBe(true);
    expect(beatResult.source).toBe("current");
    expect(beatResult.beat?.id).toBe("beat_ogre_bridge");
    expect(beatResult.beat?.availableChoices).toHaveLength(5);
  });
});
