import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  activateStonepassHiddenCave,
  completeStonepassHiddenCave,
  moveToTemporaryRoom,
} from "../../src/instances/index.js";
import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { listAvailableChoices } from "../../src/runtime/resolvePlayerChoice.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("Stonepass dragon awakening path", () => {
  it("runs ogre → landslide → cave → dragon and returns to the main-world dragon beat", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_dragon_path" });
    let session = init.session!;

    const fight = applyPlayerChoice(world, session, "fight_ogre");
    expect(fight.ok).toBe(true);
    session = fight.session!;
    expect(session.currentBeatId).toBe("beat_landslide_aftermath");

    const enterCave = applyPlayerChoice(world, session, "enter_hidden_cave");
    expect(enterCave.ok).toBe(true);
    session = enterCave.session!;
    expect(session.ledger.activeFlags).toContain("cave_entered");

    const activated = activateStonepassHiddenCave(world, session);
    expect(activated.ok).toBe(true);
    session = activated.session;

    session = moveToTemporaryRoom(world, session, "room_fallen_rocks").session;
    session = moveToTemporaryRoom(world, session, "room_dragon_chamber").session;

    const completed = completeStonepassHiddenCave(world, session);
    expect(completed.ok).toBe(true);
    session = completed.session;

    expect(session.activeTemporaryInstanceId).toBeUndefined();
    expect(session.currentTemporaryRoomId).toBeUndefined();
    expect(session.ledger.activeFlags).toContain("dragon_awake");
    expect(session.ledger.activeFlags).not.toContain("cave_entered");
    expect(session.ledger.unlockedGoals).toContain("goal_face_dragon");
    expect(session.currentBeatId).toBe("beat_dragon_stirring");

    const view = listAvailableChoices(world, session);
    expect(view.beat?.title).toBe("The Dragon Stirs");
    expect(view.choices?.map((choice) => choice.id)).toEqual(["warn_the_valley"]);
  });

  it("warn_the_valley completes the dragon goal and unlocks protect the valley", () => {
    const world = loadWorld("world_stonepass_valley", contentRoot).world!;
    const init = initializeWorldSession(world, { sessionId: "session_dragon_warn" });
    let session = init.session!;

    session = applyPlayerChoice(world, session, "fight_ogre").session!;
    session = applyPlayerChoice(world, session, "enter_hidden_cave").session!;
    session = activateStonepassHiddenCave(world, session).session;
    session = moveToTemporaryRoom(world, session, "room_fallen_rocks").session;
    session = moveToTemporaryRoom(world, session, "room_dragon_chamber").session;
    session = completeStonepassHiddenCave(world, session).session;

    const warned = applyPlayerChoice(world, session, "warn_the_valley");
    expect(warned.ok).toBe(true);
    expect(warned.session!.ledger.activeFlags).toContain("valley_warned");
    expect(warned.session!.ledger.completedGoals).toContain("goal_face_dragon");
    expect(warned.session!.ledger.unlockedGoals).toContain("goal_protect_valley");
  });
});
