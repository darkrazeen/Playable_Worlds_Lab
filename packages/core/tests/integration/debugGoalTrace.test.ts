import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("debug goal trace uniqueness", () => {
  it("does not duplicate goal_unlocked events when a goal was already unlocked", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_goal_trace" });

    const afterFight = applyPlayerChoice(world, init.session!, "fight_ogre");
    expect(afterFight.ok).toBe(true);

    const afterCave = applyPlayerChoice(world, afterFight.session!, "enter_hidden_cave");
    expect(afterCave.ok).toBe(true);

    const exploreCaveEvents = afterCave.session!.debugEvents.filter(
      (event) => event.type === "goal_unlocked" && event.metadata?.goalId === "goal_explore_cave",
    );

    expect(exploreCaveEvents).toHaveLength(1);

    const eventIds = afterCave.session!.debugEvents.map((event) => event.id);
    expect(new Set(eventIds).size).toBe(eventIds.length);
  });
});
