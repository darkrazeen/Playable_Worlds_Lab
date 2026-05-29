import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  activateStonepassHiddenCave,
  applyInstanceEncounterChoice,
  moveToTemporaryRoom,
} from "../../src/instances/index.js";
import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("Stonepass cave encounter", () => {
  it("resolves the bat encounter in fallen rocks and records ledger/debug events", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_cave_encounter",
    });
    const world = worldResult.world!;
    let session = sessionResult.session!;

    const fight = applyPlayerChoice(world, session, "fight_ogre");
    expect(fight.ok).toBe(true);
    session = fight.session!;

    const activated = activateStonepassHiddenCave(world, session);
    expect(activated.ok).toBe(true);
    session = activated.session;

    const toRocks = moveToTemporaryRoom(world, session, "room_fallen_rocks");
    expect(toRocks.ok).toBe(true);
    session = toRocks.session;

    const applied = applyInstanceEncounterChoice(world, session, "fight_bats", {
      kind: "contentRoot",
      contentRoot,
    });
    expect(applied.ok).toBe(true);
    session = applied.session;

    expect(session.ledger.activeFlags).toContain("cave_bats_cleared");
    expect(
      session.ledger.worldEvents.some(
        (event) =>
          event.type === "instance" &&
          event.metadata?.encounterId === "encounter_cave_bats" &&
          event.metadata?.roomId === "room_fallen_rocks",
      ),
    ).toBe(true);
    expect(
      session.debugEvents.some(
        (event) =>
          event.type === "choice_selected" && event.metadata?.source === "instance_encounter",
      ),
    ).toBe(true);
  });
});
