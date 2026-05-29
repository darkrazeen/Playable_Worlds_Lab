import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

const REPLAY_ROOT_SEED = "stonepass_replay_root_001";
const REPLAY_CHOICE = "fight_ogre";

function runSeededChoices(sessionId: string) {
  const worldResult = loadWorld("world_stonepass_valley", contentRoot);
  expect(worldResult.ok).toBe(true);
  const world = worldResult.world!;

  const init = initializeWorldSession(world, {
    sessionId,
    generationSeed: REPLAY_ROOT_SEED,
  });
  expect(init.ok).toBe(true);

  let session = init.session!;
  const result = applyPlayerChoice(world, session, REPLAY_CHOICE);
  expect(result.ok).toBe(true);
  session = result.session!;

  return session;
}

describe("seeded run reproducibility integration", () => {
  it("records generationSeed on session init and session_loaded debug", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const init = initializeWorldSession(worldResult.world!, {
      sessionId: "session_seed_record",
      generationSeed: REPLAY_ROOT_SEED,
    });

    expect(init.session?.generationSeed).toBe(REPLAY_ROOT_SEED);
    expect(init.session?.debugEvents[0]?.metadata?.generationSeed).toBe(REPLAY_ROOT_SEED);
  });

  it("defaults generationSeed safely when none is provided", () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const init = initializeWorldSession(worldResult.world!, {
      sessionId: "session_seed_default",
    });

    expect(init.session?.generationSeed).toBe("world_stonepass_valley_session_seed_default");
  });

  it("same root seed and choices yield identical beat progression", () => {
    const sessionA = runSeededChoices("session_replay_a");
    const sessionB = runSeededChoices("session_replay_b");

    expect(sessionA.generationSeed).toBe(REPLAY_ROOT_SEED);
    expect(sessionB.generationSeed).toBe(REPLAY_ROOT_SEED);
    expect(sessionA.choiceHistory).toEqual([REPLAY_CHOICE]);
    expect(sessionB.choiceHistory).toEqual([REPLAY_CHOICE]);
    expect(sessionA.currentBeatId).toBe(sessionB.currentBeatId);
    expect(sessionA.ledger.activeFlags).toEqual(sessionB.ledger.activeFlags);
  });

  it("preserves generationSeed across applyPlayerChoice turns", () => {
    const session = runSeededChoices("session_seed_persist");
    expect(session.generationSeed).toBe(REPLAY_ROOT_SEED);
  });
});
