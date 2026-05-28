import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  applyConsequence,
  applyPlayerChoice,
} from "../../../src/runtime/applyConsequence.js";
import { applyConsequenceToLedger } from "../../../src/runtime/applyConsequenceToLedger.js";
import { createWorldSession } from "../../../src/schemas/worldSession.js";
import { createEmptyWorldLedger } from "../../../src/schemas/worldLedger.js";
import { loadWorldFromFile } from "../../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");
const stonepassWorldPath = join(
  contentRoot,
  "worlds/stonepass/stonepass-valley.world.json",
);

describe("applyConsequenceToLedger", () => {
  it("updates flags, goals, locations, and world events for fight_ogre", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const consequence = world.consequences.find((entry) => entry.id === "consequence_fight_ogre");
    expect(consequence).toBeDefined();

    const ledger = applyConsequenceToLedger(createEmptyWorldLedger(), consequence!, 1, {
      choiceId: "fight_ogre",
    });

    expect(ledger.activeFlags).toEqual([
      "ogre_defeated",
      "bridge_open",
      "landslide_triggered",
    ]);
    expect(ledger.resolvedFlags).toEqual(["ogre_blocks_bridge"]);
    expect(ledger.unlockedGoals).toEqual(["goal_reach_valley", "goal_explore_cave"]);
    expect(ledger.discoveredLocations).toEqual(["location_hidden_cave"]);
    expect(ledger.worldEvents).toHaveLength(1);
    expect(ledger.worldEvents[0]?.type).toBe("consequence");
    expect(ledger.worldEvents[0]?.metadata?.consequenceId).toBe("consequence_fight_ogre");
  });
});

describe("applyPlayerChoice", () => {
  it("applies fight_ogre with remembered ledger and debug trace updates", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_apply_fight",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = applyPlayerChoice(world, session, "fight_ogre");

    expect(result.ok).toBe(true);
    expect(result.session?.turnNumber).toBe(1);
    expect(result.session?.choiceHistory).toEqual(["fight_ogre"]);
    expect(result.session?.ledger.activeFlags).toContain("landslide_triggered");
    expect(result.session?.ledger.unlockedGoals).toContain("goal_reach_valley");
    expect(result.session?.ledger.worldEvents).toHaveLength(1);
    expect(result.session?.debugEvents.map((event) => event.type)).toEqual([
      "choice_selected",
      "consequence_applied",
      "goal_unlocked",
      "goal_unlocked",
    ]);
    expect(session.turnNumber).toBe(0);
    expect(session.choiceHistory).toEqual([]);
  });

  it("rejects unknown consequences", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_apply_missing",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = applyConsequence(world, session, "consequence_does_not_exist");

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("not found"))).toBe(true);
  });

  it("rejects unresolved player choices", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_apply_fake",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = applyPlayerChoice(world, session, "choice_does_not_exist");

    expect(result.ok).toBe(false);
    expect(result.session).toBeUndefined();
  });
});
