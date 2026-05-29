import { describe, expect, it } from "vitest";

import { validateConsequencePreconditions } from "../../../src/consequence/validateConsequencePreconditions.js";
import { applyConsequenceEngine } from "../../../src/consequence/consequenceEngine.js";
import { parseConsequence, type Consequence } from "../../../src/schemas/consequence.js";
import {
  createWorldDefinitionShell,
  type WorldDefinition,
} from "../../../src/schemas/worldDefinition.js";
import { createWorldSession } from "../../../src/schemas/worldSession.js";

function testConsequence(partial: {
  id: string;
  summary: string;
  requiredFlags?: string[];
  blockedByFlags?: string[];
  unlockGoals?: string[];
  npcUpdates?: Consequence["npcUpdates"];
  temporaryInstances?: string[];
}): Consequence {
  return parseConsequence(partial);
}

function minimalWorld(consequences: Consequence[]): WorldDefinition {
  return createWorldDefinitionShell({
    id: "world_test_preconditions",
    title: "Test",
    summary: "Test world for consequence preconditions.",
    worldDNA: {
      genre: "fantasy",
      tone: "heroic",
      sessionLengthMinutes: 10,
      coreLoop: ["choose"],
      consequenceIntensity: "light",
      aiCreativity: "conservative",
      safetyMode: "teen",
    },
    startingBeatId: "beat_start",
    storyBeats: [
      {
        id: "beat_start",
        title: "Start",
        description: "Start beat.",
        trigger: "start",
        availableChoices: [
          {
            id: "choice_gated",
            label: "Gated",
            requiredFlags: ["flag_required"],
            consequenceId: "consequence_gated",
          },
          {
            id: "choice_open",
            label: "Open",
            consequenceId: "consequence_open",
          },
        ],
        possibleConsequences: ["consequence_gated", "consequence_open"],
      },
    ],
    consequences,
    npcs: [
      {
        id: "npc_ogre",
        name: "Ogre",
        role: "guard",
        description: "Bridge ogre.",
      },
    ],
    temporaryInstances: [
      {
        id: "instance_hidden_cave",
        title: "Hidden Cave",
        type: "cave",
        requiredEntryFlags: ["flag_required"],
        entranceText: "Cold air.",
        rooms: [
          {
            id: "room_entry",
            title: "Entry",
            description: "Dark.",
            interactions: [],
            connectedRoomIds: [],
          },
        ],
        completionCondition: "exit",
        completionConsequenceId: "consequence_open",
        cleanupBehavior: "vanish",
      },
    ],
  });
}

describe("validateConsequencePreconditions", () => {
  it("accepts a consequence with satisfied requiredFlags and known references", () => {
    const world = minimalWorld([
      testConsequence({
        id: "consequence_open",
        summary: "Open path.",
        unlockGoals: ["goal_reach_valley"],
        npcUpdates: [{ npcId: "npc_ogre", attitude: "neutral" }],
        temporaryInstances: ["instance_hidden_cave"],
      }),
      testConsequence({
        id: "consequence_gated",
        summary: "Gated path.",
        requiredFlags: ["flag_required"],
        unlockGoals: ["goal_reach_valley"],
      }),
    ]);
    const session = createWorldSession(
      {
        id: "session_ok",
        worldId: world.id,
        worldVersionId: "v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );
    session.ledger.activeFlags = ["flag_required"];

    const consequence = world.consequences[0]!;
    const result = validateConsequencePreconditions(world, session, consequence);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects unmet consequence requiredFlags", () => {
    const world = minimalWorld([
      testConsequence({
        id: "consequence_gated",
        summary: "Needs a flag.",
        requiredFlags: ["flag_required"],
        unlockGoals: ["goal_reach_valley"],
      }),
      testConsequence({
        id: "consequence_open",
        summary: "Open.",
        unlockGoals: ["goal_reach_valley"],
      }),
    ]);
    const session = createWorldSession(
      {
        id: "session_missing_flag",
        worldId: world.id,
        worldVersionId: "v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = validateConsequencePreconditions(
      world,
      session,
      world.consequences[0]!,
    );

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("flag_required"))).toBe(true);
  });

  it("rejects active blockedByFlags on the consequence", () => {
    const world = minimalWorld([
      testConsequence({
        id: "consequence_blocked",
        summary: "Blocked when flag present.",
        blockedByFlags: ["flag_blocked"],
        unlockGoals: ["goal_reach_valley"],
      }),
      testConsequence({
        id: "consequence_open",
        summary: "Open.",
        unlockGoals: ["goal_reach_valley"],
      }),
    ]);
    const session = createWorldSession(
      {
        id: "session_blocked",
        worldId: world.id,
        worldVersionId: "v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );
    session.ledger.activeFlags = ["flag_blocked"];

    const result = validateConsequencePreconditions(
      world,
      session,
      world.consequences[0]!,
    );

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("flag_blocked"))).toBe(true);
  });

  it("rejects unknown npc and temporary instance references on the consequence", () => {
    const world = minimalWorld([
      testConsequence({
        id: "consequence_bad_refs",
        summary: "Bad refs.",
        npcUpdates: [{ npcId: "npc_missing", attitude: "hostile" }],
        temporaryInstances: ["instance_missing"],
      }),
      testConsequence({
        id: "consequence_open",
        summary: "Open.",
        unlockGoals: ["goal_reach_valley"],
      }),
    ]);
    const session = createWorldSession(
      {
        id: "session_bad_refs",
        worldId: world.id,
        worldVersionId: "v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = validateConsequencePreconditions(
      world,
      session,
      world.consequences[0]!,
    );

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("npc_missing"))).toBe(true);
    expect(result.errors.some((error) => error.includes("instance_missing"))).toBe(true);
  });

  it("rejects choice context when choice flag requirements are unmet", () => {
    const world = minimalWorld([
      testConsequence({
        id: "consequence_gated",
        summary: "Gated.",
        unlockGoals: ["goal_reach_valley"],
      }),
      testConsequence({
        id: "consequence_open",
        summary: "Open.",
        unlockGoals: ["goal_reach_valley"],
      }),
    ]);
    const session = createWorldSession(
      {
        id: "session_choice_blocked",
        worldId: world.id,
        worldVersionId: "v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = validateConsequencePreconditions(world, session, world.consequences[0]!, {
      choiceId: "choice_gated",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("choice_gated"))).toBe(true);
  });
});

describe("applyConsequenceEngine precondition gate", () => {
  it("rejects fake consequence ids before mutating session", () => {
    const world = minimalWorld([
      testConsequence({ id: "consequence_open", summary: "Open.", unlockGoals: ["goal_reach_valley"] }),
    ]);
    const session = createWorldSession(
      {
        id: "session_fake",
        worldId: world.id,
        worldVersionId: "v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = applyConsequenceEngine(world, session, "consequence_fake");

    expect(result.ok).toBe(false);
    expect(result.session).toBeUndefined();
    expect(session.turnNumber).toBe(0);
  });

  it("rejects apply when consequence preconditions fail", () => {
    const world = minimalWorld([
      testConsequence({
        id: "consequence_gated",
        summary: "Gated.",
        requiredFlags: ["flag_required"],
        unlockGoals: ["goal_reach_valley"],
      }),
      testConsequence({
        id: "consequence_open",
        summary: "Open.",
        unlockGoals: ["goal_reach_valley"],
      }),
    ]);
    const session = createWorldSession(
      {
        id: "session_engine_gate",
        worldId: world.id,
        worldVersionId: "v1",
        startingBeatId: world.startingBeatId,
      },
      world,
    );

    const result = applyConsequenceEngine(world, session, "consequence_gated");

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("consequence-precondition"))).toBe(
      true,
    );
    expect(session.turnNumber).toBe(0);
  });
});
