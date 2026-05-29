import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { initializeWorldSession } from "../../../src/session/initializeWorldSession.js";
import { loadWorldFromFile } from "../../../src/world/loadWorld.js";
import { parseWorldDefinition } from "../../../src/schemas/worldDefinition.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");
const stonepassWorldPath = join(contentRoot, "worlds/stonepass/stonepass-valley.world.json");

describe("initializeWorldSession", () => {
  it("creates a valid session at the world startingBeatId with turn 0 and empty history", () => {
    const loadResult = loadWorldFromFile(stonepassWorldPath);
    expect(loadResult.ok).toBe(true);

    const result = initializeWorldSession(loadResult.world!, {
      sessionId: "session_stonepass_test_001",
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.session?.worldId).toBe("world_stonepass_valley");
    expect(result.session?.worldVersionId).toBe("world_stonepass_valley_v1");
    expect(result.session?.currentBeatId).toBe("beat_ogre_bridge");
    expect(result.session?.turnNumber).toBe(0);
    expect(result.session?.choiceHistory).toEqual([]);
    expect(result.session?.debugEvents).toHaveLength(1);
    expect(result.session?.debugEvents[0]?.type).toBe("session_loaded");
    expect(result.session?.generationSeed).toBe(
      "world_stonepass_valley_session_stonepass_test_001",
    );
    expect(result.session?.debugEvents[0]?.metadata?.generationSeed).toBe(
      "world_stonepass_valley_session_stonepass_test_001",
    );
    expect(result.session?.ledger.activeFlags).toEqual([]);
    expect(result.session?.ledger.worldEvents).toEqual([]);
  });

  it("accepts an explicit worldVersionId", () => {
    const loadResult = loadWorldFromFile(stonepassWorldPath);
    const result = initializeWorldSession(loadResult.world!, {
      sessionId: "session_stonepass_test_002",
      worldVersionId: "world_stonepass_valley_custom_v2",
    });

    expect(result.ok).toBe(true);
    expect(result.session?.worldVersionId).toBe("world_stonepass_valley_custom_v2");
  });

  it("accepts an explicit generationSeed override", () => {
    const loadResult = loadWorldFromFile(stonepassWorldPath);
    const result = initializeWorldSession(loadResult.world!, {
      sessionId: "session_stonepass_test_seed",
      generationSeed: "custom_run_seed_42",
    });

    expect(result.ok).toBe(true);
    expect(result.session?.generationSeed).toBe("custom_run_seed_42");
    expect(result.session?.debugEvents[0]?.metadata?.generationSeed).toBe("custom_run_seed_42");
  });

  it("returns structured errors when startingBeatId is missing from the world", () => {
    const world = parseWorldDefinition(
      JSON.parse(
        readFileSync(
          join(contentRoot, "examples/world-definition-stonepass-minimal.example.json"),
          "utf8",
        ),
      ),
    );
    world.startingBeatId = "beat_does_not_exist";

    const result = initializeWorldSession(world, {
      sessionId: "session_bad_beat_001",
    });

    expect(result.ok).toBe(false);
    expect(result.session).toBeUndefined();
    expect(result.errors.some((error) => error.includes("startingBeatId"))).toBe(true);
  });

  it("returns schema errors for invalid session ids", () => {
    const loadResult = loadWorldFromFile(stonepassWorldPath);
    const result = initializeWorldSession(loadResult.world!, {
      sessionId: "Invalid Session Id",
    });

    expect(result.ok).toBe(false);
    expect(result.session).toBeUndefined();
    expect(result.errors.some((error) => error.startsWith("session:"))).toBe(true);
  });
});
