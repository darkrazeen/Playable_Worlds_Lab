import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { activateStonepassHiddenCave, moveToTemporaryRoom } from "../../src/instances/index.js";
import { resolveSessionTemporaryInstanceRoom } from "../../src/session/temporaryInstanceRoom.js";
import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("Stonepass cave room navigation", () => {
  it("navigates entrance → fallen rocks → dragon chamber", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_cave_rooms",
    });
    const world = worldResult.world!;
    let session = sessionResult.session!;

    const fight = applyPlayerChoice(world, session, "fight_ogre");
    expect(fight.ok).toBe(true);
    session = fight.session!;

    const activated = activateStonepassHiddenCave(world, session);
    expect(activated.ok).toBe(true);
    session = activated.session;

    expect(resolveSessionTemporaryInstanceRoom(world, session)?.currentRoom.id).toBe(
      "room_cave_entrance",
    );

    const toRocks = moveToTemporaryRoom(world, session, "room_fallen_rocks");
    expect(toRocks.ok).toBe(true);
    session = toRocks.session;

    const toChamber = moveToTemporaryRoom(world, session, "room_dragon_chamber");
    expect(toChamber.ok).toBe(true);
    expect(toChamber.session.currentTemporaryRoomId).toBe("room_dragon_chamber");
  });
});
