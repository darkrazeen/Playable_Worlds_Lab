/**
 * @vitest-environment happy-dom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createAIGateway, FakeProvider } from "@playable-worlds/ai";
import { contentRoot } from "@playable-worlds/content";
import { loadWorld } from "@playable-worlds/core";
import { buildDirectorReasoningEntry } from "../features/world-debug/buildDirectorReasoningEntry";
import { DirectorReasoningPanel } from "../features/world-debug/DirectorReasoningPanel";
import { fetchDirectorReasoning } from "../features/world-debug/fetchDirectorReasoning";
import { STONEPASS_WORLD_ID } from "../features/world-play/constants";
import { createInitialPlayState } from "../features/world-play/worldPlayRuntime";
import { WorldPlayScreen } from "../features/world-play/WorldPlayScreen";

function loadStonepassWorldForTest() {
  const worldResult = loadWorld(STONEPASS_WORLD_ID, contentRoot);
  expect(worldResult.ok).toBe(true);
  return worldResult.world!;
}

afterEach(() => {
  cleanup();
});

const validDecision = {
  action: "select_next_beat" as const,
  targetId: "beat_landslide_aftermath",
  reason: "Player cleared the ogre; advance to the landslide aftermath.",
  confidence: 0.82,
};

describe("DirectorReasoningPanel", () => {
  it("renders a valid suggestion with action, reason, and confidence", () => {
    render(
      <DirectorReasoningPanel
        entry={buildDirectorReasoningEntry({
          ok: true,
          provider: "fake",
          fallbackUsed: false,
          value: validDecision,
        })}
      />,
    );

    expect(screen.getByRole("complementary", { name: "Director reasoning" })).toBeTruthy();
    expect(screen.getByText("Suggested")).toBeTruthy();
    expect(screen.getByText("select_next_beat")).toBeTruthy();
    expect(screen.getByText("beat_landslide_aftermath")).toBeTruthy();
    expect(screen.getByText(/landslide aftermath/i)).toBeTruthy();
    expect(screen.getByText("82%")).toBeTruthy();
  });

  it("renders fallback state and validation errors", () => {
    render(
      <DirectorReasoningPanel
        entry={buildDirectorReasoningEntry({
          ok: true,
          provider: "fake",
          fallbackUsed: true,
          value: {
            action: "select_next_beat",
            targetId: "beat_valley_square",
            reason: "Deterministic fallback beat.",
            confidence: 0.5,
          },
          validationErrors: ["schema: invalid action enum"],
        })}
      />,
    );

    expect(screen.getByText("Fallback")).toBeTruthy();
    expect(screen.getByText(/invalid action enum/i)).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
  });
});

describe("fetchDirectorReasoning", () => {
  it("returns a structured suggestion from FakeProvider success", async () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_director_fetch_ok");
    const gateway = createAIGateway(
      new FakeProvider({
        scenario: { kind: "success", value: validDecision },
      }),
    );

    const entry = await fetchDirectorReasoning(playState.session!, world, { gateway });

    expect(entry.ok).toBe(true);
    expect(entry.fallbackUsed).toBe(false);
    expect(entry.decision?.targetId).toBe("beat_landslide_aftermath");
  });

  it("returns fallbackUsed with validation errors from invalid provider output", async () => {
    const world = loadStonepassWorldForTest();
    const playState = createInitialPlayState(world, "session_director_fetch_fallback");
    const gateway = createAIGateway(
      new FakeProvider({
        scenario: {
          kind: "invalid",
          raw: { action: "bad_action", targetId: "x", reason: "x", confidence: 2 },
        },
      }),
    );

    const entry = await fetchDirectorReasoning(playState.session!, world, { gateway });

    expect(entry.ok).toBe(true);
    expect(entry.fallbackUsed).toBe(true);
    expect(entry.validationErrors?.length).toBeGreaterThan(0);
    expect(entry.decision?.targetId).toBe(playState.session!.currentBeatId);
  });
});

describe("WorldPlayScreen director reasoning integration", () => {
  it("shows the director reasoning panel with a loaded suggestion", async () => {
    const world = loadStonepassWorldForTest();
    render(<WorldPlayScreen world={world} />);

    expect(screen.getByRole("complementary", { name: "Director reasoning" })).toBeTruthy();

    await waitFor(() => {
      const panel = screen.getByRole("complementary", { name: "Director reasoning" });
      expect(panel.textContent).toMatch(/Suggested|Fallback/i);
      expect(panel.textContent).toMatch(/select_next_beat/);
    });
  });
});
