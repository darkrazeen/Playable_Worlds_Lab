import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { validateLedgerFlags } from "../../src/ledger/flagLifecycle.js";
import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import {
  listAvailableChoices,
  resolvePlayerChoice,
} from "../../src/runtime/resolvePlayerChoice.js";
import { safeParseWorldSession } from "../../src/schemas/worldSession.js";
import { initializeWorldSession } from "../../src/session/initializeWorldSession.js";
import { selectStoryBeat } from "../../src/story/selectStoryBeat.js";
import {
  parseAndValidateWorldDefinition,
  type WorldDefinition,
} from "../../src/validators/validateWorldDefinition.js";
import { loadWorld } from "../../src/world/loadWorld.js";
import type { WorldSession } from "../../src/schemas/worldSession.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");

const STONEPASS_WORLD_ID = "world_stonepass_valley";
const OGRE_CHOICE_IDS = [
  "fight_ogre",
  "trick_ogre",
  "feed_ogre",
  "talk_ogre",
  "sneak_ogre",
] as const;

function loadValidatedStonepassWorld(): WorldDefinition {
  const worldResult = loadWorld(STONEPASS_WORLD_ID, contentRoot);
  expect(worldResult.ok).toBe(true);
  expect(worldResult.world).toBeDefined();

  const validation = parseAndValidateWorldDefinition(worldResult.world!);
  expect(validation.ok).toBe(true);

  return worldResult.world!;
}

function assertValidSession(session: WorldSession, label: string) {
  const parsed = safeParseWorldSession(session);
  expect(parsed.success, `${label}: WorldSession schema`).toBe(true);

  const flagValidation = validateLedgerFlags(
    session.ledger.activeFlags,
    session.ledger.resolvedFlags,
  );
  expect(flagValidation.ok, `${label}: ledger flags`).toBe(true);
}

describe("Phase 1 acceptance — Stonepass text runtime (no AI)", () => {
  it("runs load → init → resolve → apply → ledger/debug with validators passing", () => {
    const world = loadValidatedStonepassWorld();

    const initResult = initializeWorldSession(world, {
      sessionId: "session_phase1_acceptance",
    });
    expect(initResult.ok).toBe(true);
    assertValidSession(initResult.session!, "after init");

    const session = initResult.session!;
    expect(session.currentBeatId).toBe("beat_ogre_bridge");
    expect(session.turnNumber).toBe(0);
    expect(session.debugEvents.at(-1)?.type).toBe("session_loaded");

    const beatResult = selectStoryBeat(world, session);
    expect(beatResult.ok).toBe(true);
    expect(beatResult.beat?.id).toBe("beat_ogre_bridge");

    const choicesResult = listAvailableChoices(world, session);
    expect(choicesResult.ok).toBe(true);
    expect(choicesResult.choices?.map((choice) => choice.id)).toEqual([...OGRE_CHOICE_IDS]);

    const resolveResult = resolvePlayerChoice(world, session, "fight_ogre");
    expect(resolveResult.ok).toBe(true);
    expect(resolveResult.consequenceId).toBe("consequence_fight_ogre");

    const applyResult = applyPlayerChoice(world, session, "fight_ogre");
    expect(applyResult.ok).toBe(true);
    assertValidSession(applyResult.session!, "after fight_ogre");

    const nextSession = applyResult.session!;
    expect(nextSession.turnNumber).toBe(1);
    expect(nextSession.ledger.activeFlags).toContain("ogre_defeated");
    expect(nextSession.ledger.worldEvents).toHaveLength(1);

    const debugTypes = nextSession.debugEvents.map((event) => event.type);
    expect(debugTypes).toContain("session_loaded");
    expect(debugTypes).toContain("choice_selected");
    expect(debugTypes).toContain("consequence_applied");
    expect(debugTypes).toContain("flags_changed");
    expect(debugTypes.filter((type) => type === "goal_unlocked").length).toBeGreaterThan(0);

    const postBeat = selectStoryBeat(world, nextSession);
    expect(postBeat.ok).toBe(true);
    expect(postBeat.beat?.id).toBe("beat_ogre_bridge");
  });

  it("blocks an invalid choice without advancing turn or mutating ledger", () => {
    const world = loadValidatedStonepassWorld();
    const init = initializeWorldSession(world, { sessionId: "session_phase1_blocked" });
    const session = init.session!;

    const ledgerBefore = structuredClone(session.ledger);
    const applyResult = applyPlayerChoice(world, session, "choice_does_not_exist");

    expect(applyResult.ok).toBe(false);
    assertValidSession(applyResult.session!, "after blocked choice");

    const nextSession = applyResult.session!;
    expect(nextSession.turnNumber).toBe(0);
    expect(nextSession.ledger).toEqual(ledgerBefore);
    expect(nextSession.debugEvents.at(-1)?.type).toBe("validation_failed");
  });

  it.each(OGRE_CHOICE_IDS)(
    "accepts ogre bridge choice %s with valid session and debug trace",
    (choiceId) => {
      const world = loadValidatedStonepassWorld();
      const init = initializeWorldSession(world, {
        sessionId: `session_phase1_${choiceId}`,
      });

      const applyResult = applyPlayerChoice(world, init.session!, choiceId);
      expect(applyResult.ok).toBe(true);
      assertValidSession(applyResult.session!, `after ${choiceId}`);
      expect(applyResult.session?.choiceHistory).toEqual([choiceId]);
      expect(applyResult.session?.debugEvents.some((event) => event.type === "consequence_applied"))
        .toBe(true);
    },
  );
});
