import { describe, expect, it } from "vitest";

import { appendDebugEvent } from "../../../src/debug/index.js";
import { createWorldSession } from "../../../src/schemas/index.js";

describe("appendDebugEvent", () => {
  it("appends a validated debug event to the session", () => {
    const session = createWorldSession({
      id: "session_test",
      worldId: "world_stonepass_valley",
      worldVersionId: "world_stonepass_valley_v1",
      startingBeatId: "beat_ogre_bridge",
    });

    const updated = appendDebugEvent(session, {
      id: "debug_choice_001",
      turnNumber: 1,
      type: "choice_selected",
      summary: "Player chose to fight the ogre.",
      metadata: { choiceId: "fight_ogre" },
    });

    expect(updated.debugEvents).toHaveLength(1);
    expect(updated.debugEvents[0]?.type).toBe("choice_selected");
    expect(session.debugEvents).toHaveLength(0);
  });

  it("rejects invalid debug events without mutating session", () => {
    const session = createWorldSession({
      id: "session_test",
      worldId: "world_stonepass_valley",
      worldVersionId: "world_stonepass_valley_v1",
      startingBeatId: "beat_ogre_bridge",
    });

    expect(() =>
      appendDebugEvent(session, {
        id: "debug_bad",
        turnNumber: 1,
        type: "not_a_type",
        summary: "bad",
      }),
    ).toThrow();
    expect(session.debugEvents).toHaveLength(0);
  });
});
