import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";

import {
  activateStonepassHiddenCave,
  applyInstanceEncounterChoice,
  completeStonepassHiddenCave,
  loadStonepassHiddenCave,
  moveToTemporaryRoom,
  STONEPASS_HIDDEN_CAVE_INSTANCE_ID,
  submitInstancePuzzleSolution,
} from "../../../src/instances/index.js";
import { validateLedgerFlags } from "../../../src/ledger/flagLifecycle.js";
import { applyPlayerChoice } from "../../../src/runtime/applyConsequence.js";
import { safeParseWorldSession, type WorldSession } from "../../../src/schemas/worldSession.js";
import type { WorldDefinition } from "../../../src/schemas/worldDefinition.js";
import { initializeWorldSession } from "../../../src/session/initializeWorldSession.js";
import { parseAndValidateWorldDefinition } from "../../../src/validators/validateWorldDefinition.js";
import { loadWorld } from "../../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const STONEPASS_CONTENT_ROOT = join(__dirname, "../../../../content");
export const STONEPASS_WORLD_ID = "world_stonepass_valley";

export function loadValidatedStonepassWorld(): WorldDefinition {
  const worldResult = loadWorld(STONEPASS_WORLD_ID, STONEPASS_CONTENT_ROOT);
  expect(worldResult.ok).toBe(true);
  expect(worldResult.world).toBeDefined();

  const validation = parseAndValidateWorldDefinition(worldResult.world!);
  expect(validation.ok).toBe(true);

  return worldResult.world!;
}

export function assertValidSession(session: WorldSession, label: string): void {
  const parsed = safeParseWorldSession(session);
  expect(parsed.success, `${label}: WorldSession schema`).toBe(true);

  const flagValidation = validateLedgerFlags(
    session.ledger.activeFlags,
    session.ledger.resolvedFlags,
  );
  expect(flagValidation.ok, `${label}: ledger flags`).toBe(true);
}

export function initStonepassSession(world: WorldDefinition, sessionId: string): WorldSession {
  const initResult = initializeWorldSession(world, { sessionId });
  expect(initResult.ok).toBe(true);
  assertValidSession(initResult.session!, `${sessionId}: after init`);
  return initResult.session!;
}

/** Fight ogre and land on the landslide aftermath beat with cave exposed. */
export function runFightPathToLandslide(
  world: WorldDefinition,
  session: WorldSession,
): WorldSession {
  const applied = applyPlayerChoice(world, session, "fight_ogre");
  expect(applied.ok).toBe(true);
  assertValidSession(applied.session!, "after fight_ogre");
  expect(applied.session!.currentBeatId).toBe("beat_landslide_aftermath");
  expect(applied.session!.ledger.activeFlags).toContain("cave_exposed");
  return applied.session!;
}

export function activateHiddenCave(world: WorldDefinition, session: WorldSession): WorldSession {
  assertValidSession(session, "before cave activation");
  const activated = activateStonepassHiddenCave(world, session);
  expect(activated.ok).toBe(true);
  assertValidSession(activated.session, "after cave activation");
  expect(activated.session.activeTemporaryInstanceId).toBe(STONEPASS_HIDDEN_CAVE_INSTANCE_ID);
  expect(activated.session.currentTemporaryRoomId).toBe("room_cave_entrance");
  return activated.session;
}

export function navigateCaveToDragonChamber(
  world: WorldDefinition,
  session: WorldSession,
): WorldSession {
  let next = moveToTemporaryRoom(world, session, "room_fallen_rocks");
  expect(next.ok).toBe(true);
  assertValidSession(next.session, "after move to fallen rocks");

  next = moveToTemporaryRoom(world, next.session, "room_dragon_chamber");
  expect(next.ok).toBe(true);
  assertValidSession(next.session, "after move to dragon chamber");
  return next.session;
}

export function resolveBatEncounter(world: WorldDefinition, session: WorldSession): WorldSession {
  const applied = applyInstanceEncounterChoice(world, session, "fight_bats", {
    kind: "contentRoot",
    contentRoot: STONEPASS_CONTENT_ROOT,
  });
  expect(applied.ok).toBe(true);
  assertValidSession(applied.session, "after bat encounter");
  return applied.session;
}

export function solveDragonRunes(world: WorldDefinition, session: WorldSession): WorldSession {
  const submitted = submitInstancePuzzleSolution(world, session, "align_awakening_sequence", {
    kind: "contentRoot",
    contentRoot: STONEPASS_CONTENT_ROOT,
  });
  expect(submitted.ok).toBe(true);
  assertValidSession(submitted.session, "after dragon runes puzzle");
  return submitted.session;
}

export function completeHiddenCave(world: WorldDefinition, session: WorldSession): WorldSession {
  assertValidSession(session, "before cave completion");
  const completed = completeStonepassHiddenCave(world, session);
  expect(completed.ok).toBe(true);
  assertValidSession(completed.session, "after cave completion");
  expect(completed.session.activeTemporaryInstanceId).toBeUndefined();
  expect(completed.session.currentTemporaryRoomId).toBeUndefined();
  return completed.session;
}

/** Full fight-path instance run including encounter, puzzle, completion, and valley warning. */
export function runFullStonepassCaveAcceptancePath(
  world: WorldDefinition,
  sessionId: string,
): WorldSession {
  let session = initStonepassSession(world, sessionId);
  session = runFightPathToLandslide(world, session);

  const enterCave = applyPlayerChoice(world, session, "enter_hidden_cave");
  expect(enterCave.ok).toBe(true);
  assertValidSession(enterCave.session!, "after enter_hidden_cave");
  session = enterCave.session!;

  session = activateHiddenCave(world, session);
  session = moveToTemporaryRoom(world, session, "room_fallen_rocks").session;
  session = resolveBatEncounter(world, session);
  session = navigateCaveToDragonChamber(world, session);
  session = solveDragonRunes(world, session);
  session = completeHiddenCave(world, session);

  expect(session.ledger.activeFlags).toContain("dragon_awake");
  expect(session.ledger.unlockedGoals).toContain("goal_face_dragon");
  expect(session.currentBeatId).toBe("beat_dragon_stirring");

  const warned = applyPlayerChoice(world, session, "warn_the_valley");
  expect(warned.ok).toBe(true);
  assertValidSession(warned.session!, "after warn_the_valley");
  expect(warned.session!.ledger.completedGoals).toContain("goal_face_dragon");
  expect(warned.session!.ledger.unlockedGoals).toContain("goal_protect_valley");

  return warned.session!;
}

export function loadExampleSessionFixture(relativePath: string): WorldSession {
  const fixturePath = join(STONEPASS_CONTENT_ROOT, "examples", relativePath);
  const raw = JSON.parse(readFileSync(fixturePath, "utf8")) as unknown;
  const parsed = safeParseWorldSession(raw);
  expect(parsed.success, `fixture ${relativePath}`).toBe(true);
  return parsed.data!;
}

export function expectCaveBlocked(world: WorldDefinition, session: WorldSession): void {
  const blocked = loadStonepassHiddenCave(world, session);
  expect(blocked.ok).toBe(false);
  expect(session.activeTemporaryInstanceId).toBeUndefined();
}
