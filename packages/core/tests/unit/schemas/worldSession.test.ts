import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  createWorldSession,
  CURRENT_SCHEMA_VERSION,
  parseWorldSession,
  safeParseWorldSession,
  WorldSessionSchema,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validNewSession = {
  id: "session_test_001",
  schemaVersion: CURRENT_SCHEMA_VERSION,
  worldId: "world_stonepass_valley",
  worldVersionId: "world_stonepass_valley_v1",
  currentBeatId: "beat_ogre_bridge",
  ledger: {},
  turnNumber: 0,
  choiceHistory: [],
  debugEvents: [],
};

const validSessionWithChoice = {
  ...validNewSession,
  turnNumber: 1,
  choiceHistory: ["fight_ogre"],
  ledger: {
    activeFlags: ["ogre_defeated"],
    worldEvents: [
      {
        id: "event_fight_ogre",
        type: "consequence",
        summary: "Player defeated the ogre at the bridge.",
        turnNumber: 1,
      },
    ],
  },
  debugEvents: [
    {
      id: "debug_choice_001",
      turnNumber: 1,
      type: "choice_selected",
      summary: "Player chose to fight the ogre.",
      metadata: { choiceId: "fight_ogre" },
    },
  ],
};

describe("WorldSessionSchema", () => {
  it("accepts a valid new session with empty ledger and debug log", () => {
    const result = WorldSessionSchema.safeParse(validNewSession);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.turnNumber).toBe(0);
      expect(result.data.ledger.activeFlags).toEqual([]);
      expect(result.data.debugEvents).toEqual([]);
    }
  });

  it("accepts a session after a choice with ledger and debug events", () => {
    expect(WorldSessionSchema.safeParse(validSessionWithChoice).success).toBe(true);
  });

  it("parses via parseWorldSession helper", () => {
    const session = parseWorldSession(validNewSession);
    expect(session.worldId).toBe("world_stonepass_valley");
    expect(session.currentBeatId).toBe("beat_ogre_bridge");
  });

  it("creates a new session via createWorldSession", () => {
    const session = createWorldSession({
      id: "session_created_001",
      worldId: "world_stonepass_valley",
      worldVersionId: "world_stonepass_valley_v1",
      startingBeatId: "beat_ogre_bridge",
    });
    expect(session.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(session.turnNumber).toBe(0);
    expect(session.ledger.worldEvents).toEqual([]);
    expect(session.choiceHistory).toEqual([]);
    expect(session.debugEvents).toEqual([]);
  });

  it("accepts optional active temporary instance and room ids", () => {
    const withInstance = {
      ...validNewSession,
      activeTemporaryInstanceId: "instance_hidden_cave",
      currentTemporaryRoomId: "room_cave_entrance",
    };
    expect(WorldSessionSchema.safeParse(withInstance).success).toBe(true);
  });

  it("defaults omitted choiceHistory and debugEvents to empty arrays", () => {
    const { choiceHistory: _choiceHistory, debugEvents: _debugEvents, ...minimal } =
      validNewSession;
    const session = parseWorldSession(minimal);
    expect(session.choiceHistory).toEqual([]);
    expect(session.debugEvents).toEqual([]);
  });

  it("parses the world-session-stonepass-start example JSON", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "world-session-stonepass-start.example.json"), "utf8"),
    );
    const session = parseWorldSession(example);
    expect(session.currentBeatId).toBe("beat_ogre_bridge");
    expect(session.debugEvents).toHaveLength(1);
    expect(session.debugEvents[0]?.type).toBe("session_loaded");
  });

  it("rejects missing required fields", () => {
    const { id: _id, ...noId } = validNewSession;
    const { worldId: _worldId, ...noWorldId } = validNewSession;
    const { currentBeatId: _beat, ...noBeat } = validNewSession;
    const { ledger: _ledger, ...noLedger } = validNewSession;
    expect(WorldSessionSchema.safeParse(noId).success).toBe(false);
    expect(WorldSessionSchema.safeParse(noWorldId).success).toBe(false);
    expect(WorldSessionSchema.safeParse(noBeat).success).toBe(false);
    expect(WorldSessionSchema.safeParse(noLedger).success).toBe(false);
  });

  it("rejects empty currentBeatId and invalid turnNumber", () => {
    expect(
      WorldSessionSchema.safeParse({ ...validNewSession, currentBeatId: "" }).success,
    ).toBe(false);
    expect(WorldSessionSchema.safeParse({ ...validNewSession, turnNumber: -1 }).success).toBe(
      false,
    );
    expect(WorldSessionSchema.safeParse({ ...validNewSession, turnNumber: 1.5 }).success).toBe(
      false,
    );
  });

  it("rejects malformed ledger", () => {
    const badLedger = {
      ...validNewSession,
      ledger: {
        worldEvents: [{ id: "event_bad", type: "not_a_type", summary: "x", turnNumber: 0 }],
      },
    };
    expect(WorldSessionSchema.safeParse(badLedger).success).toBe(false);
    expect(safeParseWorldSession(badLedger).success).toBe(false);
  });

  it("rejects malformed debugEvents", () => {
    const badDebug = {
      ...validNewSession,
      debugEvents: [{ id: "debug_1", turnNumber: 0, type: "invalid_type", summary: "x" }],
    };
    expect(WorldSessionSchema.safeParse(badDebug).success).toBe(false);
  });
});
