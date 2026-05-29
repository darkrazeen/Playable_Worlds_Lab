import { describe, expect, it } from "vitest";

import {
  deriveAiGenerationSeed,
  resolveSessionGenerationSeed,
} from "../../../src/runtime/generationSeed.js";

describe("generationSeed runtime helpers", () => {
  it("resolveSessionGenerationSeed prefers explicit then world then default", () => {
    expect(
      resolveSessionGenerationSeed({
        sessionId: "session_a",
        worldId: "world_test",
        explicitSeed: "explicit_root",
        worldGenerationSeed: "world_root",
      }),
    ).toBe("explicit_root");

    expect(
      resolveSessionGenerationSeed({
        sessionId: "session_a",
        worldId: "world_test",
        worldGenerationSeed: "world_root",
      }),
    ).toBe("world_root");

    expect(
      resolveSessionGenerationSeed({
        sessionId: "session_a",
        worldId: "world_test",
      }),
    ).toBe("world_test_session_a");
  });

  it("deriveAiGenerationSeed combines root, turn, and task", () => {
    const seed = deriveAiGenerationSeed(
      {
        id: "session_a",
        worldId: "world_test",
        turnNumber: 2,
        generationSeed: "root_seed",
      },
      "director_select_next_beat",
    );

    expect(seed).toBe("root_seed_t2_director_select_next_beat");
  });

  it("deriveAiGenerationSeed falls back to default root when session has no generationSeed", () => {
    const seed = deriveAiGenerationSeed(
      {
        id: "session_a",
        worldId: "world_test",
        turnNumber: 0,
      },
      "npc_reaction",
    );

    expect(seed).toBe("world_test_session_a_t0_npc_reaction");
  });
});
