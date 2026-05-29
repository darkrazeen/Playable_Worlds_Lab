import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("Stonepass consequence application integration", () => {
  it("applies fight_ogre from a fresh Stonepass session", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    expect(worldResult.ok).toBe(true);

    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_stonepass_apply_001",
    });
    expect(sessionResult.ok).toBe(true);

    const applyResult = applyPlayerChoice(worldResult.world!, sessionResult.session!, "fight_ogre");

    expect(applyResult.ok).toBe(true);
    expect(applyResult.session?.ledger.activeFlags).toContain("ogre_defeated");
    expect(applyResult.session?.ledger.unlockedGoals).toContain("goal_reach_valley");
    expect(
      applyResult.session?.debugEvents.some((event) => event.type === "consequence_applied"),
    ).toBe(true);
  });
});
