import { describe, expect, it } from "vitest";

import {
  applyInstanceEncounterChoice,
  CAVE_EXPOSED_FLAG,
  completeStonepassHiddenCave,
  loadStonepassHiddenCave,
  moveToTemporaryRoom,
  STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
  submitInstancePuzzleSolution,
} from "../../src/instances/index.js";
import { applyPlayerChoice } from "../../src/runtime/applyConsequence.js";
import { listAvailableChoices } from "../../src/runtime/resolvePlayerChoice.js";
import {
  activateHiddenCave,
  assertValidSession,
  expectCaveBlocked,
  initStonepassSession,
  loadExampleSessionFixture,
  loadValidatedStonepassWorld,
  runFightPathToLandslide,
  runFullStonepassCaveAcceptancePath,
  STONEPASS_CONTENT_ROOT,
} from "./helpers/stonepassCaveAcceptance.js";

describe("Phase 3 acceptance — Stonepass temporary instance (no AI)", () => {
  describe("world instance contract", () => {
    it("defines a gated cave with rooms, goals, completion, and collapse cleanup", () => {
      const world = loadValidatedStonepassWorld();
      const hiddenCave = world.temporaryInstances.find(
        (instance) => instance.id === STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
      );

      expect(hiddenCave?.requiredEntryFlags).toContain(CAVE_EXPOSED_FLAG);
      expect(hiddenCave?.rooms.map((room) => room.id)).toEqual([
        "room_cave_entrance",
        "room_fallen_rocks",
        "room_dragon_chamber",
      ]);
      expect(hiddenCave?.rooms.find((room) => room.id === "room_fallen_rocks")?.encounter).toBe(
        "encounter_cave_bats",
      );
      expect(hiddenCave?.rooms.find((room) => room.id === "room_dragon_chamber")?.puzzle).toBe(
        "puzzle_dragon_runes",
      );
      expect(hiddenCave?.completionCondition).toBe("reached_dragon_chamber");
      expect(hiddenCave?.completionConsequenceId).toBe("consequence_cave_complete");
      expect(hiddenCave?.cleanupBehavior).toBe("collapse");

      const caveComplete = world.consequences.find(
        (consequence) => consequence.id === "consequence_cave_complete",
      );
      expect(caveComplete?.addFlags).toContain("dragon_awake");
      expect(caveComplete?.unlockGoals).toContain("goal_face_dragon");
      expect(caveComplete?.completeGoals).toContain("goal_explore_cave");
    });

    it("parses the mid-cave session fixture through WorldSession validators", () => {
      const session = loadExampleSessionFixture("world-session-stonepass-cave-active.example.json");
      assertValidSession(session, "cave-active fixture");
      expect(session.activeTemporaryInstanceId).toBe(STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
      expect(session.currentTemporaryRoomId).toBe("room_cave_entrance");
    });
  });

  describe("entry gates and session validation", () => {
    it("blocks cave entry without cave_exposed and validates session after failure", () => {
      const world = loadValidatedStonepassWorld();
      const session = initStonepassSession(world, "session_phase3_cave_blocked");

      expectCaveBlocked(world, session);
      assertValidSession(session, "after blocked cave load");
    });

    it("allows load and activation after fight_ogre with valid session before and after", () => {
      const world = loadValidatedStonepassWorld();
      let session = initStonepassSession(world, "session_phase3_cave_allowed");
      session = runFightPathToLandslide(world, session);

      const loaded = loadStonepassHiddenCave(world, session);
      expect(loaded.ok).toBe(true);

      session = activateHiddenCave(world, session);
      expect(session.ledger.unlockedGoals).toContain("goal_explore_cave");
    });

    it("never exposes the cave on peaceful ogre paths", () => {
      const world = loadValidatedStonepassWorld();

      for (const choiceId of ["trick_ogre", "feed_ogre", "talk_ogre", "sneak_ogre"]) {
        const session = initStonepassSession(world, `session_phase3_peaceful_${choiceId}`);
        const applied = applyPlayerChoice(world, session, choiceId);
        expect(applied.ok).toBe(true);
        assertValidSession(applied.session!, `after ${choiceId}`);
        expectCaveBlocked(world, applied.session!);
      }
    });
  });

  describe("failure paths", () => {
    it("rejects invalid room moves without leaving the entrance", () => {
      const world = loadValidatedStonepassWorld();
      let session = initStonepassSession(world, "session_phase3_bad_room");
      session = runFightPathToLandslide(world, session);
      session = activateHiddenCave(world, session);

      const moved = moveToTemporaryRoom(world, session, "room_missing");
      expect(moved.ok).toBe(false);
      expect(moved.session.currentTemporaryRoomId).toBe("room_cave_entrance");
      expect(moved.session.debugEvents.some((event) => event.type === "validation_failed")).toBe(
        true,
      );
      assertValidSession(moved.session, "after invalid room move");
    });

    it("rejects early instance completion from the cave mouth", () => {
      const world = loadValidatedStonepassWorld();
      let session = initStonepassSession(world, "session_phase3_early_complete");
      session = runFightPathToLandslide(world, session);
      session = activateHiddenCave(world, session);

      const completed = completeStonepassHiddenCave(world, session);
      expect(completed.ok).toBe(false);
      expect(completed.session.activeTemporaryInstanceId).toBe(STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
      expect(completed.session.ledger.activeFlags).not.toContain("dragon_awake");
      assertValidSession(completed.session, "after rejected early completion");
    });

    it("rejects unknown encounter and puzzle submissions without mutating instance progress", () => {
      const world = loadValidatedStonepassWorld();
      let session = initStonepassSession(world, "session_phase3_bad_instance_actions");
      session = runFightPathToLandslide(world, session);
      session = activateHiddenCave(world, session);
      session = moveToTemporaryRoom(world, session, "room_fallen_rocks").session;

      const badEncounter = applyInstanceEncounterChoice(world, session, "unknown_choice", {
        kind: "contentRoot",
        contentRoot: STONEPASS_CONTENT_ROOT,
      });
      expect(badEncounter.ok).toBe(false);
      assertValidSession(badEncounter.session, "after unknown encounter");

      session = moveToTemporaryRoom(world, session, "room_dragon_chamber").session;
      const badPuzzle = submitInstancePuzzleSolution(world, session, "unknown_solution", {
        kind: "contentRoot",
        contentRoot: STONEPASS_CONTENT_ROOT,
      });
      expect(badPuzzle.ok).toBe(false);
      expect(badPuzzle.session.ledger.activeFlags).not.toContain("dragon_runes_solved");
      assertValidSession(badPuzzle.session, "after unknown puzzle");
    });
  });

  describe("full cave flow", () => {
    it("runs ogre → landslide → cave → encounter → puzzle → completion → dragon return", () => {
      const world = loadValidatedStonepassWorld();
      const session = runFullStonepassCaveAcceptancePath(world, "session_phase3_full_cave");

      expect(session.ledger.activeFlags).toContain("dragon_awake");
      expect(session.ledger.activeFlags).toContain("cave_bats_cleared");
      expect(session.ledger.activeFlags).toContain("dragon_runes_solved");
      expect(session.ledger.activeFlags).not.toContain("cave_entered");
      expect(session.activeTemporaryInstanceId).toBeUndefined();
      expect(session.currentTemporaryRoomId).toBeUndefined();

      const view = listAvailableChoices(world, session);
      expect(view.beat?.id).toBe("beat_dragon_stirring");

      expect(
        session.debugEvents.some(
          (event) =>
            event.type === "choice_selected" && event.metadata?.source === "instance_cleanup",
        ),
      ).toBe(true);
      expect(session.debugEvents.some((event) => event.type === "consequence_applied")).toBe(true);
    });
  });
});
