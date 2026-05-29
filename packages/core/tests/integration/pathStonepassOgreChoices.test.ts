import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { safeParseWorldSession } from "../../src/schemas/worldSession.js";
import {
  parseAndValidateWorldDefinition,
  type WorldValidationResult,
} from "../../src/validators/validateWorldDefinition.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { loadWorld } from "../../src/world/loadWorld.js";
import type { WorldDefinition } from "../../src/schemas/worldDefinition.js";
import type { WorldSession } from "../../src/schemas/worldSession.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

type OgrePathCase = {
  choiceId: string;
  consequenceId: string;
  signatureFlag: string;
  expectedBeatId: string;
  expectedActiveFlags: string[];
  expectedGoals: string[];
  expectedDiscoveredLocations?: string[];
  mustNotHaveFlags?: string[];
};

const OGRE_PATH_CASES: OgrePathCase[] = [
  {
    choiceId: "fight_ogre",
    consequenceId: "consequence_fight_ogre",
    signatureFlag: "ogre_defeated",
    expectedBeatId: "beat_landslide_aftermath",
    expectedActiveFlags: ["ogre_defeated", "bridge_open", "landslide_triggered", "cave_exposed"],
    expectedGoals: ["goal_reach_valley", "goal_explore_cave"],
    expectedDiscoveredLocations: ["location_hidden_cave"],
    mustNotHaveFlags: ["ogre_peaceful_crossing"],
  },
  {
    choiceId: "trick_ogre",
    consequenceId: "consequence_trick_ogre",
    signatureFlag: "ogre_tricked",
    expectedBeatId: "beat_valley_square",
    expectedActiveFlags: ["ogre_tricked", "bridge_open", "ogre_peaceful_crossing"],
    expectedGoals: ["goal_reach_valley"],
    mustNotHaveFlags: ["landslide_triggered"],
  },
  {
    choiceId: "feed_ogre",
    consequenceId: "consequence_feed_ogre",
    signatureFlag: "ogre_fed",
    expectedBeatId: "beat_valley_square",
    expectedActiveFlags: ["ogre_fed", "ogre_allied", "bridge_open", "ogre_peaceful_crossing"],
    expectedGoals: ["goal_reach_valley"],
    mustNotHaveFlags: ["landslide_triggered"],
  },
  {
    choiceId: "talk_ogre",
    consequenceId: "consequence_talk_ogre",
    signatureFlag: "ogre_talked",
    expectedBeatId: "beat_valley_square",
    expectedActiveFlags: [
      "ogre_talked",
      "bridge_open",
      "elder_knows_player",
      "ogre_peaceful_crossing",
    ],
    expectedGoals: ["goal_reach_valley", "goal_hear_elder_counsel"],
    mustNotHaveFlags: ["landslide_triggered"],
  },
  {
    choiceId: "sneak_ogre",
    consequenceId: "consequence_sneak_ogre",
    signatureFlag: "ogre_avoided",
    expectedBeatId: "beat_valley_square",
    expectedActiveFlags: ["ogre_avoided", "bridge_open", "ogre_peaceful_crossing"],
    expectedGoals: ["goal_reach_valley"],
    mustNotHaveFlags: ["landslide_triggered"],
  },
];

function loadValidatedStonepassWorld(): WorldDefinition {
  const worldResult = loadWorld("world_stonepass_valley", contentRoot);
  expect(worldResult.ok).toBe(true);
  expect(worldResult.world).toBeDefined();
  return worldResult.world!;
}

function assertWorldValid(world: WorldDefinition): WorldValidationResult {
  const validation = parseAndValidateWorldDefinition(world);
  expect(validation.ok).toBe(true);
  return validation;
}

function createFreshOgreBridgeSession(sessionSuffix: string): WorldSession {
  const world = loadValidatedStonepassWorld();
  assertWorldValid(world);

  const sessionResult = initializeWorldSession(world, {
    sessionId: `session_stonepass_path_${sessionSuffix}`,
  });
  expect(sessionResult.ok).toBe(true);
  expect(sessionResult.session).toBeDefined();

  const parsed = safeParseWorldSession(sessionResult.session);
  expect(parsed.success).toBe(true);
  expect(parsed.data?.currentBeatId).toBe("beat_ogre_bridge");
  expect(parsed.data?.turnNumber).toBe(0);

  return parsed.data!;
}

describe("Stonepass Spire Floor 1 — ogre bridge path integration", () => {
  it.each(OGRE_PATH_CASES)(
    "applies $choiceId with ledger and debug updates from a fresh session",
    ({
      choiceId,
      consequenceId,
      signatureFlag,
      expectedBeatId,
      expectedActiveFlags,
      expectedGoals,
      expectedDiscoveredLocations = [],
      mustNotHaveFlags = [],
    }) => {
      const world = loadValidatedStonepassWorld();
      const session = createFreshOgreBridgeSession(choiceId);

      const applyResult = applyPlayerChoice(world, session, choiceId);

      expect(applyResult.ok).toBe(true);
      expect(applyResult.consequence?.id).toBe(consequenceId);

      const nextSession = applyResult.session!;
      const parsed = safeParseWorldSession(nextSession);
      expect(parsed.success).toBe(true);

      expect(nextSession.turnNumber).toBe(1);
      expect(nextSession.currentBeatId).toBe(expectedBeatId);
      expect(nextSession.choiceHistory).toEqual([choiceId]);
      expect(nextSession.ledger.activeFlags).toContain(signatureFlag);
      expect(nextSession.ledger.resolvedFlags).toContain("ogre_blocks_bridge");

      for (const flag of expectedActiveFlags) {
        expect(nextSession.ledger.activeFlags).toContain(flag);
      }
      for (const flag of mustNotHaveFlags) {
        expect(nextSession.ledger.activeFlags).not.toContain(flag);
      }
      for (const goal of expectedGoals) {
        expect(nextSession.ledger.unlockedGoals).toContain(goal);
      }
      for (const location of expectedDiscoveredLocations) {
        expect(nextSession.ledger.discoveredLocations).toContain(location);
      }

      expect(nextSession.ledger.worldEvents).toHaveLength(1);
      expect(nextSession.ledger.worldEvents[0]?.metadata?.consequenceId).toBe(consequenceId);
      expect(nextSession.ledger.worldEvents[0]?.metadata?.choiceId).toBe(choiceId);

      const debugTypes = nextSession.debugEvents.map((event) => event.type);
      expect(debugTypes).toContain("session_loaded");
      expect(debugTypes).toContain("choice_selected");
      expect(debugTypes).toContain("consequence_applied");
      expect(debugTypes).toContain("flags_changed");
      expect(debugTypes.filter((type) => type === "goal_unlocked")).toHaveLength(
        expectedGoals.length,
      );
    },
  );

  it("starts at beat_ogre_bridge with an empty ledger before any choice", () => {
    const session = createFreshOgreBridgeSession("start");

    expect(session.ledger.activeFlags).toEqual([]);
    expect(session.ledger.resolvedFlags).toEqual([]);
    expect(session.ledger.worldEvents).toHaveLength(0);
    expect(session.debugEvents).toHaveLength(1);
    expect(session.debugEvents[0]?.type).toBe("session_loaded");
    expect(session.choiceHistory).toEqual([]);
  });
});
