import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  activateStonepassHiddenCave,
  completeStonepassHiddenCave,
  moveToTemporaryRoom,
} from "../../src/instances/index.js";
import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("Stonepass cave completion", () => {
  it("completes the hidden cave from the dragon chamber and returns to the main world", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_cave_complete",
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

    const toChamber = moveToTemporaryRoom(world, session, "room_dragon_chamber");
    expect(toChamber.ok).toBe(true);
    session = toChamber.session;

    const completed = completeStonepassHiddenCave(world, session);
    expect(completed.ok).toBe(true);
    session = completed.session;

    expect(session.activeTemporaryInstanceId).toBeUndefined();
    expect(session.currentTemporaryRoomId).toBeUndefined();
    expect(session.ledger.activeFlags).toContain("dragon_awake");
    expect(session.ledger.activeFlags).toContain("cave_collapsed");
    expect(session.ledger.unlockedGoals).toContain("goal_face_dragon");
    expect(session.currentBeatId).toBe("beat_dragon_stirring");
    expect(
      session.ledger.worldEvents.some(
        (event) => event.type === "instance" && event.metadata?.cleanupBehavior === "collapse",
      ),
    ).toBe(true);
    expect(
      session.debugEvents.some(
        (event) =>
          event.type === "choice_selected" && event.metadata?.source === "instance_cleanup",
      ),
    ).toBe(true);
  });
});
