import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  parseTemporaryInstance,
  safeParseTemporaryInstance,
  TemporaryInstanceRoomSchema,
  TemporaryInstanceSchema,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validRoom = {
  id: "room_cave_entrance",
  title: "Cave Mouth",
  description: "Mud and broken roots line the narrow entrance.",
  interactions: ["inspect_mud"],
  connectedRoomIds: ["room_fallen_rocks"],
};

const validHiddenCave = {
  id: "instance_hidden_cave",
  title: "The Hidden Cave",
  type: "cave",
  description: "A unstable cave exposed by the landslide beneath Stonepass Bridge.",
  entranceText: "Cold air spills from a jagged opening in the cliff.",
  requiredEntryFlags: ["landslide_triggered"],
  rooms: [
    validRoom,
    {
      id: "room_fallen_rocks",
      title: "Fallen Rocks",
      description: "A pile of boulders blocks the path deeper into the cave.",
      interactions: ["climb_rocks"],
      connectedRoomIds: ["room_cave_entrance", "room_dragon_chamber"],
    },
    {
      id: "room_dragon_chamber",
      title: "Dragon Chamber",
      description: "A vast chamber opens ahead. Something ancient stirs in the dark.",
      interactions: ["observe_chamber"],
      connectedRoomIds: ["room_fallen_rocks"],
    },
  ],
  completionCondition: "reached_dragon_chamber",
  completionConsequenceId: "consequence_cave_complete",
  cleanupBehavior: "collapse",
};

describe("TemporaryInstanceRoomSchema", () => {
  it("accepts a valid room", () => {
    expect(TemporaryInstanceRoomSchema.safeParse(validRoom).success).toBe(true);
  });

  it("defaults interactions and connectedRoomIds to empty arrays", () => {
    const { interactions: _interactions, connectedRoomIds: _connectedRoomIds, ...minimalRoom } =
      validRoom;
    const result = TemporaryInstanceRoomSchema.safeParse(minimalRoom);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interactions).toEqual([]);
      expect(result.data.connectedRoomIds).toEqual([]);
    }
  });

  it("accepts optional encounter and puzzle hooks", () => {
    expect(
      TemporaryInstanceRoomSchema.safeParse({
        ...validRoom,
        encounter: "encounter_cave_bats",
        puzzle: "puzzle_dragon_runes",
      }).success,
    ).toBe(true);
  });

  it("rejects empty room id, title, or description", () => {
    expect(TemporaryInstanceRoomSchema.safeParse({ ...validRoom, id: "" }).success).toBe(false);
    expect(TemporaryInstanceRoomSchema.safeParse({ ...validRoom, title: "" }).success).toBe(false);
    expect(TemporaryInstanceRoomSchema.safeParse({ ...validRoom, description: "" }).success).toBe(
      false,
    );
  });

  it("rejects malformed interactions or connectedRoomIds", () => {
    expect(
      TemporaryInstanceRoomSchema.safeParse({ ...validRoom, interactions: [""] }).success,
    ).toBe(false);
    expect(
      TemporaryInstanceRoomSchema.safeParse({ ...validRoom, connectedRoomIds: [""] }).success,
    ).toBe(false);
    expect(
      TemporaryInstanceRoomSchema.safeParse({ ...validRoom, connectedRoomIds: "bad" }).success,
    ).toBe(false);
  });
});

describe("TemporaryInstanceSchema", () => {
  it("accepts a valid hidden-cave temporary instance", () => {
    const result = TemporaryInstanceSchema.safeParse(validHiddenCave);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("cave");
      expect(result.data.rooms).toHaveLength(3);
      expect(result.data.cleanupBehavior).toBe("collapse");
    }
  });

  it("parses via parseTemporaryInstance helper", () => {
    const instance = parseTemporaryInstance(validHiddenCave);
    expect(instance.id).toBe("instance_hidden_cave");
    expect(instance.completionConsequenceId).toBe("consequence_cave_complete");
  });

  it("accepts all allowed cleanup behaviors including v4.2 remain_inactive", () => {
    for (const cleanupBehavior of [
      "collapse",
      "vanish",
      "seal",
      "resolve",
      "remain_inactive",
    ] as const) {
      expect(
        TemporaryInstanceSchema.safeParse({ ...validHiddenCave, cleanupBehavior }).success,
      ).toBe(true);
    }
  });

  it("rejects missing type, entrance text, completion condition, or completion consequence", () => {
    const { type: _type, ...noType } = validHiddenCave;
    const { entranceText: _entranceText, ...noEntranceText } = validHiddenCave;
    const { completionCondition: _completionCondition, ...noCompletionCondition } = validHiddenCave;
    const { completionConsequenceId: _completionConsequenceId, ...noCompletionConsequence } =
      validHiddenCave;
    expect(TemporaryInstanceSchema.safeParse(noType).success).toBe(false);
    expect(TemporaryInstanceSchema.safeParse(noEntranceText).success).toBe(false);
    expect(TemporaryInstanceSchema.safeParse(noCompletionCondition).success).toBe(false);
    expect(TemporaryInstanceSchema.safeParse(noCompletionConsequence).success).toBe(false);
    expect(safeParseTemporaryInstance(noCompletionConsequence).success).toBe(false);
  });

  it("rejects empty required strings", () => {
    expect(TemporaryInstanceSchema.safeParse({ ...validHiddenCave, entranceText: "" }).success).toBe(
      false,
    );
    expect(
      TemporaryInstanceSchema.safeParse({ ...validHiddenCave, completionCondition: "" }).success,
    ).toBe(false);
    expect(
      TemporaryInstanceSchema.safeParse({ ...validHiddenCave, completionConsequenceId: "" }).success,
    ).toBe(false);
  });

  it("rejects missing or empty required entry flags", () => {
    expect(
      TemporaryInstanceSchema.safeParse({ ...validHiddenCave, requiredEntryFlags: [] }).success,
    ).toBe(false);
    expect(
      TemporaryInstanceSchema.safeParse({
        ...validHiddenCave,
        requiredEntryFlags: [""],
      }).success,
    ).toBe(false);
  });

  it("rejects instances with no rooms", () => {
    expect(TemporaryInstanceSchema.safeParse({ ...validHiddenCave, rooms: [] }).success).toBe(false);
  });

  it("rejects malformed nested rooms", () => {
    expect(
      TemporaryInstanceSchema.safeParse({
        ...validHiddenCave,
        rooms: [{ ...validRoom, title: "" }],
      }).success,
    ).toBe(false);
  });

  it("rejects invalid cleanup behavior or instance type", () => {
    expect(
      TemporaryInstanceSchema.safeParse({
        ...validHiddenCave,
        cleanupBehavior: "explode",
      }).success,
    ).toBe(false);
    expect(
      TemporaryInstanceSchema.safeParse({
        ...validHiddenCave,
        type: "castle",
      }).success,
    ).toBe(false);
  });

  it("validates JSON example from packages/content/examples", () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "temporary-instance-hidden-cave.example.json"), "utf8"),
    );
    expect(TemporaryInstanceSchema.safeParse(example).success).toBe(true);
  });
});
