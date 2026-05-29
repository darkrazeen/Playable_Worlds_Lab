/**
 * @vitest-environment happy-dom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  cleanup();
});

import { contentRoot } from "@playable-worlds/content";
import { loadWorld } from "@playable-worlds/core";

import { STONEPASS_WORLD_ID } from "../features/world-play/constants";
import { WorldPlayScreen } from "../features/world-play/WorldPlayScreen";
import {
  applyPlayChoice,
  createInitialPlayState,
} from "../features/world-play/worldPlayRuntime";

function loadStonepassWorldForTest() {
  const worldResult = loadWorld(STONEPASS_WORLD_ID, contentRoot);
  expect(worldResult.ok).toBe(true);
  return worldResult.world!;
}

describe("world-play smoke", () => {
  it("offers five ogre bridge choices on a fresh Stonepass session", () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world);

    expect(playState.ok).toBe(true);
    expect(playState.view?.beat?.id).toBe("beat_ogre_bridge");
    expect(playState.view?.choices.map((choice) => choice.id)).toEqual([
      "fight_ogre",
      "trick_ogre",
      "feed_ogre",
      "talk_ogre",
      "sneak_ogre",
    ]);
  });

  it("renders beat title and valid choice buttons", () => {
    const world = loadStonepassWorldForTest();
    render(<WorldPlayScreen world={world} />);

    expect(screen.getByRole("heading", { level: 1, name: "The Blocked Bridge" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getByRole("button", { name: /Fight the ogre/i })).toBeTruthy();
  });

  it("applies a choice through the runtime without direct ledger mutation", () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_smoke_apply");

    const result = applyPlayChoice(world, playState.session!, "fight_ogre");
    expect(result.ok).toBe(true);
    expect(result.session?.ledger.activeFlags).toContain("ogre_defeated");
    expect(result.session?.turnNumber).toBe(1);
  });
});
