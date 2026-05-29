/**
 * @vitest-environment happy-dom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  cleanup();
});

import { contentRoot } from "@playable-worlds/content";
import { loadWorld } from "@playable-worlds/core";

import { WorldLedgerPanel } from "../features/world-debug/WorldLedgerPanel";
import { STONEPASS_WORLD_ID } from "../features/world-play/constants";
import { WorldPlayScreen } from "../features/world-play/WorldPlayScreen";
import { applyPlayChoice, createInitialPlayState } from "../features/world-play/worldPlayRuntime";

function loadStonepassWorldForTest() {
  const worldResult = loadWorld(STONEPASS_WORLD_ID, contentRoot);
  expect(worldResult.ok).toBe(true);
  return worldResult.world!;
}

describe("WorldLedgerPanel", () => {
  it("renders empty ledger sections on a fresh session", () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_ledger_empty");

    render(<WorldLedgerPanel ledger={playState.session!.ledger} turnNumber={0} />);

    expect(screen.getByRole("complementary", { name: "World ledger" })).toBeTruthy();
    expect(screen.getByText("Active flags")).toBeTruthy();
    expect(screen.getAllByText("None yet").length).toBeGreaterThan(0);
  });

  it("renders ledger entries after fight_ogre", () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_ledger_fight");
    const result = applyPlayChoice(world, playState.session!, "fight_ogre");

    expect(result.ok).toBe(true);
    render(<WorldLedgerPanel ledger={result.session!.ledger} turnNumber={1} />);

    expect(screen.getByText("ogre_defeated")).toBeTruthy();
    expect(screen.getByText("landslide_triggered")).toBeTruthy();
    expect(screen.getByText("ogre_blocks_bridge")).toBeTruthy();
    expect(screen.getByText("goal_reach_valley")).toBeTruthy();
    expect(screen.getByText("location_hidden_cave")).toBeTruthy();
    expect(screen.getByText(/defeat the ogre/i)).toBeTruthy();
  });
});

describe("WorldPlayScreen ledger integration", () => {
  it("updates the ledger panel after a choice", () => {
    const world = loadStonepassWorldForTest();
    render(<WorldPlayScreen world={world} />);

    expect(screen.getByRole("heading", { name: "World remembers" })).toBeTruthy();
    expect(screen.queryByText("ogre_defeated")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Fight the ogre/i }));

    expect(screen.getByText("ogre_defeated")).toBeTruthy();
    expect(screen.getByText("goal_explore_cave")).toBeTruthy();
    const ledgerPanel = screen.getByRole("complementary", { name: "World ledger" });
    expect(ledgerPanel.textContent).toMatch(/Session turn 1/);
  });
});
