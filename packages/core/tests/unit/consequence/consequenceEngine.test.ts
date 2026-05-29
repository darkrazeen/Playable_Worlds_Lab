import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyConsequenceToLedger } from "../../../src/consequence/applyConsequenceToLedger.js";
import { applyConsequenceEngine } from "../../../src/consequence/consequenceEngine.js";
import { createEmptyWorldLedger } from "../../../src/schemas/worldLedger.js";
import type { WorldDefinition } from "../../../src/schemas/worldDefinition.js";
import { createWorldSession } from "../../../src/schemas/worldSession.js";
import { loadWorldFromFile } from "../../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");
const stonepassWorldPath = join(contentRoot, "worlds/stonepass/stonepass-valley.world.json");

describe("applyConsequenceToLedger", () => {
  it("applies addFlags, removeFlags, unlockGoals, and exposeLocations", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const consequence = world.consequences.find((entry) => entry.id === "consequence_fight_ogre");
    expect(consequence).toBeDefined();

    const ledger = applyConsequenceToLedger(createEmptyWorldLedger(), consequence!, 1, {
      choiceId: "fight_ogre",
    });

    expect(ledger.activeFlags).toEqual(["ogre_defeated", "bridge_open", "landslide_triggered"]);
    expect(ledger.resolvedFlags).toEqual(["ogre_blocks_bridge"]);
    expect(ledger.unlockedGoals).toEqual(["goal_reach_valley", "goal_explore_cave"]);
    expect(ledger.discoveredLocations).toEqual(["location_hidden_cave"]);
    expect(ledger.worldEvents).toHaveLength(1);
    expect(ledger.worldEvents[0]?.type).toBe("consequence");
    expect(ledger.worldEvents[0]?.metadata?.consequenceId).toBe("consequence_fight_ogre");
  });

  it("records visibleChanges on the ledger world event", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const consequence = world.consequences.find((entry) => entry.id === "consequence_fight_ogre");
    expect(consequence).toBeDefined();

    const ledger = applyConsequenceToLedger(createEmptyWorldLedger(), consequence!, 1);

    expect(ledger.worldEvents[0]?.metadata?.visibleChanges).toEqual(consequence!.visibleChanges);
  });
});

describe("applyConsequenceEngine", () => {
  it("applies fight_ogre through the centralized engine with validated post-state", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_engine_fight",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = applyConsequenceEngine(world, session, "consequence_fight_ogre", {
      choiceId: "fight_ogre",
      beatId: "beat_ogre_bridge",
      choiceLabel: "Fight the ogre",
    });

    expect(result.ok).toBe(true);
    expect(result.session?.turnNumber).toBe(1);
    expect(result.session?.choiceHistory).toEqual(["fight_ogre"]);
    expect(result.session?.ledger.activeFlags).toContain("landslide_triggered");
    expect(result.session?.ledger.worldEvents[0]?.metadata?.visibleChanges).toEqual(
      result.consequence?.visibleChanges,
    );
    expect(result.session?.debugEvents.map((event) => event.type)).toEqual([
      "choice_selected",
      "consequence_applied",
      "flags_changed",
      "goal_unlocked",
      "goal_unlocked",
    ]);
  });

  it("rejects unknown consequence ids", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const session = createWorldSession(
      {
        id: "session_engine_missing",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = applyConsequenceEngine(world, session, "consequence_does_not_exist");

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("not found"))).toBe(true);
    expect(result.session?.debugEvents.at(-1)?.type).toBe("validation_failed");
    expect(session.turnNumber).toBe(0);
  });

  it("rejects consequences with unknown npc references before mutating session", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const brokenWorld = {
      ...world,
      consequences: world.consequences.map((entry) =>
        entry.id === "consequence_fight_ogre"
          ? {
              ...entry,
              npcUpdates: [{ npcId: "npc_does_not_exist", attitude: "hostile" }],
            }
          : entry,
      ),
    } as WorldDefinition;
    const session = createWorldSession(
      {
        id: "session_engine_bad_npc",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = applyConsequenceEngine(brokenWorld, session, "consequence_fight_ogre");

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("npc_does_not_exist"))).toBe(true);
    expect(result.session?.debugEvents.at(-1)?.type).toBe("validation_failed");
    expect(session.turnNumber).toBe(0);
  });

  it("rejects malformed consequence data before mutating session", () => {
    const world = loadWorldFromFile(stonepassWorldPath).world!;
    const brokenWorld = {
      ...world,
      consequences: [
        {
          id: "consequence_broken",
          summary: "",
          addFlags: [],
          removeFlags: [],
        },
      ],
    } as unknown as WorldDefinition;
    const session = createWorldSession(
      {
        id: "session_engine_broken",
        worldId: world.id,
        worldVersionId: "world_stonepass_valley_v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = applyConsequenceEngine(brokenWorld, session, "consequence_broken");

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.startsWith("consequence:"))).toBe(true);
    expect(result.session?.debugEvents.at(-1)?.type).toBe("validation_failed");
    expect(session.turnNumber).toBe(0);
  });
});
