/**
 * @vitest-environment happy-dom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { contentRoot } from "@playable-worlds/content";
import { loadWorld, parseAndValidateWorldDefinition } from "@playable-worlds/core";

import { STONEPASS_WORLD_ID } from "../features/world-play/constants";
import { WorldPlayScreen } from "../features/world-play/WorldPlayScreen";
import {
  applyPlayChoice,
  createInitialPlayState,
} from "../features/world-play/worldPlayRuntime";

afterEach(() => {
  cleanup();
});

function loadStonepassWorldForTest() {
  const worldResult = loadWorld(STONEPASS_WORLD_ID, contentRoot);
  expect(worldResult.ok).toBe(true);
  const validation = parseAndValidateWorldDefinition(worldResult.world!);
  expect(validation.ok).toBe(true);
  return worldResult.world!;
}

describe("Phase 1 acceptance — browser play path", () => {
  it("starts Stonepass with five choices and valid initial play state", () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_web_phase1_start");

    expect(playState.ok).toBe(true);
    expect(playState.view?.beat?.id).toBe("beat_ogre_bridge");
    expect(playState.view?.choices).toHaveLength(5);
    expect(playState.session?.debugEvents[0]?.type).toBe("session_loaded");
  });

  it("updates ledger and debug panels after a valid choice on /play", () => {
    const world = loadStonepassWorldForTest();
    render(<WorldPlayScreen world={world} />);

    const ledgerPanel = screen.getByRole("complementary", { name: "World ledger" });
    const debugPanel = screen.getByRole("complementary", { name: "Debug trace" });

    expect(ledgerPanel.textContent).not.toMatch(/ogre_defeated/);
    expect(debugPanel.textContent).toMatch(/World session started/i);

    fireEvent.click(screen.getByRole("button", { name: /Fight the ogre/i }));

    expect(ledgerPanel.textContent).toMatch(/ogre_defeated/);
    expect(debugPanel.textContent).toMatch(/choice: fight_ogre/i);
    expect(debugPanel.textContent).toMatch(/consequence: consequence_fight_ogre/i);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("returns traced session on applyPlayChoice failure for invalid choice id", () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_web_phase1_invalid");

    const result = applyPlayChoice(world, playState.session!, "choice_does_not_exist");
    expect(result.ok).toBe(false);
    expect(result.session?.turnNumber).toBe(0);
    expect(result.session?.debugEvents.at(-1)?.type).toBe("validation_failed");
  });
});
