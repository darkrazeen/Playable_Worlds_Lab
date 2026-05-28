import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  createEmptyWorldLedger,
  parseWorldEvent,
  parseWorldLedger,
  safeParseWorldEvent,
  safeParseWorldLedger,
  WorldEventSchema,
  WorldLedgerSchema,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validEvent = {
  id: "event_fight_ogre",
  type: "consequence",
  summary: "Player defeated the ogre at the bridge.",
  turnNumber: 1,
};

const validPostOgreLedger = {
  activeFlags: ["ogre_defeated", "bridge_open", "landslide_triggered"],
  resolvedFlags: [],
  unlockedGoals: ["goal_reach_valley"],
  completedGoals: [],
  discoveredLocations: ["location_hidden_cave"],
  worldEvents: [validEvent],
};

describe("WorldEventSchema", () => {
  it("accepts a valid world event", () => {
    expect(WorldEventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("accepts optional metadata", () => {
    const withMetadata = {
      ...validEvent,
      metadata: { consequenceId: "consequence_fight_ogre" },
    };
    expect(WorldEventSchema.safeParse(withMetadata).success).toBe(true);
  });

  it("parses via parseWorldEvent helper", () => {
    const event = parseWorldEvent(validEvent);
    expect(event.id).toBe("event_fight_ogre");
    expect(event.type).toBe("consequence");
  });

  it("rejects missing required fields", () => {
    const { id: _id, ...noId } = validEvent;
    const { summary: _summary, ...noSummary } = validEvent;
    const { turnNumber: _turn, ...noTurn } = validEvent;
    expect(WorldEventSchema.safeParse(noId).success).toBe(false);
    expect(WorldEventSchema.safeParse(noSummary).success).toBe(false);
    expect(WorldEventSchema.safeParse(noTurn).success).toBe(false);
  });

  it("rejects empty id or summary, invalid type, or negative turnNumber", () => {
    expect(WorldEventSchema.safeParse({ ...validEvent, id: "" }).success).toBe(false);
    expect(WorldEventSchema.safeParse({ ...validEvent, summary: "" }).success).toBe(false);
    expect(WorldEventSchema.safeParse({ ...validEvent, type: "invalid" }).success).toBe(false);
    expect(WorldEventSchema.safeParse({ ...validEvent, turnNumber: -1 }).success).toBe(false);
    expect(safeParseWorldEvent({ ...validEvent, turnNumber: 1.5 }).success).toBe(false);
  });
});

describe("WorldLedgerSchema", () => {
  it("accepts an empty ledger and defaults arrays to empty", () => {
    const result = WorldLedgerSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activeFlags).toEqual([]);
      expect(result.data.worldEvents).toEqual([]);
      expect(result.data.discoveredLocations).toEqual([]);
    }
  });

  it("creates an empty ledger via createEmptyWorldLedger", () => {
    const ledger = createEmptyWorldLedger();
    expect(ledger.activeFlags).toEqual([]);
    expect(ledger.resolvedFlags).toEqual([]);
    expect(ledger.unlockedGoals).toEqual([]);
    expect(ledger.completedGoals).toEqual([]);
    expect(ledger.discoveredLocations).toEqual([]);
    expect(ledger.worldEvents).toEqual([]);
  });

  it("accepts a post-ogre ledger with flags, goals, locations, and worldEvents", () => {
    const result = WorldLedgerSchema.safeParse(validPostOgreLedger);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activeFlags).toContain("ogre_defeated");
      expect(result.data.unlockedGoals).toContain("goal_reach_valley");
      expect(result.data.discoveredLocations).toContain("location_hidden_cave");
      expect(result.data.worldEvents).toHaveLength(1);
    }
  });

  it("parses via parseWorldLedger helper", () => {
    const ledger = parseWorldLedger(validPostOgreLedger);
    expect(ledger.worldEvents[0]?.summary).toBe("Player defeated the ogre at the bridge.");
  });

  it("rejects malformed ledger arrays", () => {
    expect(
      WorldLedgerSchema.safeParse({ ...validPostOgreLedger, activeFlags: [""] }).success,
    ).toBe(false);
    expect(
      WorldLedgerSchema.safeParse({ ...validPostOgreLedger, unlockedGoals: "bad" }).success,
    ).toBe(false);
    expect(
      WorldLedgerSchema.safeParse({
        ...validPostOgreLedger,
        discoveredLocations: [""],
      }).success,
    ).toBe(false);
    expect(safeParseWorldLedger({ ...validPostOgreLedger, worldEvents: "bad" }).success).toBe(
      false,
    );
  });

  it("rejects malformed nested events", () => {
    expect(
      WorldLedgerSchema.safeParse({
        ...validPostOgreLedger,
        worldEvents: [{ ...validEvent, summary: "" }],
      }).success,
    ).toBe(false);
  });

  it("validates JSON example from packages/content/examples", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "world-ledger-post-ogre.example.json"), "utf8"),
    );
    expect(WorldLedgerSchema.safeParse(example).success).toBe(true);
  });
});
