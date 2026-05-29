import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  activateStonepassHiddenCave,
  CAVE_EXPOSED_FLAG,
  loadStonepassHiddenCave,
} from "../../src/instances/index.js";
import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

describe("loadStonepassHiddenCave integration", () => {
  it("blocks cave before fight path exposes it", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    expect(worldResult.ok).toBe(true);

    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_cave_blocked",
    });
    expect(sessionResult.ok).toBe(true);
    const session = sessionResult.session!;

    const blocked = loadStonepassHiddenCave(worldResult.world!, session);
    expect(blocked.ok).toBe(false);
    expect(blocked.errors.some((e) => e.includes(CAVE_EXPOSED_FLAG))).toBe(true);
  });

  it("allows cave load and activation after fight ogre sets cave_exposed", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_cave_allowed",
    });
    const world = worldResult.world!;
    let session = sessionResult.session!;

    const fight = applyPlayerChoice(world, session, "fight_ogre");
    expect(fight.ok).toBe(true);
    session = fight.session!;

    expect(session.ledger.activeFlags).toContain(CAVE_EXPOSED_FLAG);

    const loaded = loadStonepassHiddenCave(world, session);
    expect(loaded.ok).toBe(true);
    expect(loaded.instance?.requiredEntryFlags).toContain(CAVE_EXPOSED_FLAG);

    const activated = activateStonepassHiddenCave(world, session);
    expect(activated.ok).toBe(true);
    expect(activated.session.activeTemporaryInstanceId).toBe("instance_hidden_cave");
    expect(activated.session.currentTemporaryRoomId).toBe("room_cave_entrance");
  });

  it("peaceful ogre paths never expose the cave", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const world = worldResult.world!;

    for (const choiceId of ["trick_ogre", "feed_ogre", "talk_ogre", "sneak_ogre"]) {
      const sessionResult = initializeWorldSession(world, {
        sessionId: `session_peaceful_${choiceId}`,
      });
      const applied = applyPlayerChoice(world, sessionResult.session!, choiceId);
      expect(applied.ok).toBe(true);
      expect(applied.session!.ledger.activeFlags).not.toContain(CAVE_EXPOSED_FLAG);

      const blocked = loadStonepassHiddenCave(world, applied.session!);
      expect(blocked.ok).toBe(false);
    }
  });
});
