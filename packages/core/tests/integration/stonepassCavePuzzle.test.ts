import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  activateStonepassHiddenCave,
  moveToTemporaryRoom,
  submitInstancePuzzleSolution,
} from "../../src/instances/index.js";
import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("Stonepass cave puzzle", () => {
  it("solves the dragon runes puzzle in the chamber and records ledger/debug events", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_cave_puzzle",
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

    const submitted = submitInstancePuzzleSolution(world, session, "align_awakening_sequence", {
      kind: "contentRoot",
      contentRoot,
    });
    expect(submitted.ok).toBe(true);
    expect(submitted.completesPuzzle).toBe(true);
    session = submitted.session;

    expect(session.ledger.activeFlags).toContain("dragon_runes_solved");
    expect(
      session.ledger.worldEvents.some(
        (event) =>
          event.type === "instance" &&
          event.metadata?.puzzleId === "puzzle_dragon_runes" &&
          event.metadata?.roomId === "room_dragon_chamber",
      ),
    ).toBe(true);
    expect(
      session.debugEvents.some(
        (event) => event.type === "choice_selected" && event.metadata?.source === "instance_puzzle",
      ),
    ).toBe(true);
  });

  it("fails gracefully on an invalid puzzle solution id", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_cave_puzzle_invalid",
    });
    const world = worldResult.world!;
    let session = sessionResult.session!;

    const fight = applyPlayerChoice(world, session, "fight_ogre");
    session = fight.session!;

    const activated = activateStonepassHiddenCave(world, session);
    session = activated.session;

    const toRocks = moveToTemporaryRoom(world, session, "room_fallen_rocks");
    session = toRocks.session;

    const toChamber = moveToTemporaryRoom(world, session, "room_dragon_chamber");
    session = toChamber.session;

    const submitted = submitInstancePuzzleSolution(world, session, "invalid_solution", {
      kind: "contentRoot",
      contentRoot,
    });

    expect(submitted.ok).toBe(false);
    expect(submitted.errors[0]).toContain("unknown solution");
    expect(submitted.session.ledger.activeFlags).not.toContain("dragon_runes_solved");
  });
});
