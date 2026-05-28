import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { resolvePlayerChoice } from "../../src/runtime/resolvePlayerChoice.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("Stonepass choice resolution integration", () => {
  it("resolves fight_ogre on a fresh Stonepass session", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    expect(worldResult.ok).toBe(true);

    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_stonepass_choice_001",
    });
    expect(sessionResult.ok).toBe(true);

    const choiceResult = resolvePlayerChoice(
      worldResult.world!,
      sessionResult.session!,
      "fight_ogre",
    );

    expect(choiceResult.ok).toBe(true);
    expect(choiceResult.beat?.id).toBe("beat_ogre_bridge");
    expect(choiceResult.consequenceId).toBe("consequence_fight_ogre");
  });
});
