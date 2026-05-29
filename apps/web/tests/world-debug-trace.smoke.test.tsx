/**
 * @vitest-environment happy-dom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { contentRoot } from "@playable-worlds/content";
import { loadWorld } from "@playable-worlds/core";

import { DebugTracePanel } from "../features/world-debug/DebugTracePanel";
import { STONEPASS_WORLD_ID } from "../features/world-play/constants";
import { WorldPlayScreen } from "../features/world-play/WorldPlayScreen";
import { applyPlayChoice, createInitialPlayState } from "../features/world-play/worldPlayRuntime";

function loadStonepassWorldForTest() {
  const worldResult = loadWorld(STONEPASS_WORLD_ID, contentRoot);
  expect(worldResult.ok).toBe(true);
  return worldResult.world!;
}

afterEach(() => {
  cleanup();
});

describe("DebugTracePanel", () => {
  it("renders session_loaded on a fresh initialized session", () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_debug_empty");

    render(<DebugTracePanel debugEvents={playState.session!.debugEvents} turnNumber={0} />);

    expect(screen.getByRole("complementary", { name: "Debug trace" })).toBeTruthy();
    expect(screen.getByText("Session")).toBeTruthy();
    expect(screen.getByText(/World session started/i)).toBeTruthy();
  });

  it("renders choice, consequence, flags, and goal events after fight_ogre", () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_debug_fight");
    const result = applyPlayChoice(world, playState.session!, "fight_ogre");

    expect(result.ok).toBe(true);
    render(<DebugTracePanel debugEvents={result.session!.debugEvents} turnNumber={1} />);

    expect(screen.getByText("Choice")).toBeTruthy();
    expect(screen.getByText("Consequence")).toBeTruthy();
    expect(screen.getByText("Flags")).toBeTruthy();
    expect(screen.getAllByText("Goal")).toHaveLength(2);
    expect(screen.getAllByText(/choice: fight_ogre/i).length).toBeGreaterThan(0);
  });
});

describe("WorldPlayScreen debug trace integration", () => {
  it("updates the debug trace panel after a choice", () => {
    const world = loadStonepassWorldForTest();
    render(<WorldPlayScreen world={world} />);

    expect(screen.getByRole("heading", { name: "Why it changed" })).toBeTruthy();
    expect(screen.getByText(/World session started/i)).toBeTruthy();
    expect(screen.queryByText(/choice: fight_ogre/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Fight the ogre/i }));

    const debugPanel = screen.getByRole("complementary", { name: "Debug trace" });
    expect(debugPanel.textContent).toMatch(/choice: fight_ogre/i);
    expect(debugPanel.textContent).toMatch(/consequence: consequence_fight_ogre/i);
  });

  it("renders validation_failed when apply returns a traced failure session", () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_debug_invalid");
    const result = applyPlayChoice(world, playState.session!, "choice_does_not_exist");

    expect(result.ok).toBe(false);
    render(<DebugTracePanel debugEvents={result.session!.debugEvents} />);

    expect(screen.getByText("Validation")).toBeTruthy();
    expect(screen.getAllByText(/choice_does_not_exist/i).length).toBeGreaterThan(0);
  });
});
