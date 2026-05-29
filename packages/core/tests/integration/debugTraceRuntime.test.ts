import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("debug trace runtime integration", () => {
  it("logs session_loaded when initializing a Stonepass session", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const result = initializeWorldSession(world, {
      sessionId: "session_debug_init",
    });

    expect(result.ok).toBe(true);
    expect(result.session?.debugEvents).toHaveLength(1);
    expect(result.session?.debugEvents[0]?.type).toBe("session_loaded");
  });

  it("logs choice, consequence, flags, and goals after fight_ogre", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_debug_fight" });
    const result = applyPlayerChoice(world, init.session!, "fight_ogre");

    expect(result.ok).toBe(true);
    const types = result.session?.debugEvents.map((event) => event.type);
    expect(types).toContain("session_loaded");
    expect(types).toContain("choice_selected");
    expect(types).toContain("consequence_applied");
    expect(types).toContain("flags_changed");
    expect(types?.filter((type) => type === "goal_unlocked")).toHaveLength(2);

    const flagsEvent = result.session?.debugEvents.find((event) => event.type === "flags_changed");
    expect(flagsEvent?.metadata?.consequenceId).toBe("consequence_fight_ogre");
  });

  it("logs validation_failed for an unknown choice without advancing turn", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_debug_blocked" });

    const applyResult = applyPlayerChoice(world, init.session!, "choice_does_not_exist");

    expect(applyResult.ok).toBe(false);
    expect(applyResult.session?.turnNumber).toBe(0);
    expect(applyResult.session?.debugEvents.at(-1)?.type).toBe("validation_failed");
  });
});
