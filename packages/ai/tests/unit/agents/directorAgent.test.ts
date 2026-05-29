import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { initializeWorldSession, loadWorld, type WorldSession } from "@playable-worlds/core";

import { createAIGateway } from "../../../src/gateway/aiGateway.js";
import {
  DirectorAgent,
  buildDefaultDirectorFallback,
  createDirectorAgent,
} from "../../../src/agents/directorAgent.js";
import { FakeProvider } from "../../../src/providers/fakeProvider.js";
import {
  STONEPASS_DIRECTOR_LANDSLIDE,
  STONEPASS_DIRECTOR_VALLEY,
} from "../../../src/providers/fakeProviderScenarios.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");

const fallbackDecision = {
  action: "select_next_beat" as const,
  targetId: "beat_valley_square",
  reason: "Fallback beat when director output is unavailable.",
  confidence: 0.5,
};

function loadStonepassSession(): { session: WorldSession; agent: DirectorAgent } {
  const worldResult = loadWorld("world_stonepass_valley", contentRoot);
  expect(worldResult.ok).toBe(true);

  const sessionResult = initializeWorldSession(worldResult.world!, {
    sessionId: "session_director_agent_test",
  });
  expect(sessionResult.ok).toBe(true);

  const gateway = createAIGateway(
    new FakeProvider({
      scenario: STONEPASS_DIRECTOR_LANDSLIDE,
    }),
  );

  return {
    session: sessionResult.session!,
    agent: createDirectorAgent(gateway),
  };
}

function snapshotSession(session: WorldSession): string {
  return JSON.stringify(session);
}

describe("DirectorAgent", () => {
  it("returns a valid select_next_beat suggestion via the gateway", async () => {
    const { session, agent } = loadStonepassSession();
    const before = snapshotSession(session);

    const { result, session: trackedSession } = await agent.suggestNextBeat({
      session,
      generationSeed: "seed_director_ok",
    });

    expect(result.ok).toBe(true);
    expect(trackedSession.debugEvents.some((e) => e.type === "ai_suggestion")).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(result.value?.action).toBe("select_next_beat");
    expect(result.value?.targetId).toBe("beat_landslide_aftermath");
    expect(snapshotSession(session)).toBe(before);
  });

  it("applies fallback when provider output is invalid", async () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_director_invalid",
    });
    const session = sessionResult.session!;
    const before = snapshotSession(session);

    const agent = createDirectorAgent(
      createAIGateway(
        new FakeProvider({
          scenario: {
            kind: "invalid",
            raw: { action: "bad_action", targetId: "x", reason: "x", confidence: 2 },
          },
        }),
      ),
    );

    const { result, session: trackedSession } = await agent.suggestNextBeat({
      session,
      fallback: fallbackDecision,
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.value?.targetId).toBe("beat_valley_square");
    expect(trackedSession.debugEvents.some((e) => e.type === "fallback_used")).toBe(true);
    expect(snapshotSession(session)).toBe(before);
  });

  it("applies default fallback on provider error without mutating session", async () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_director_error",
    });
    const session = sessionResult.session!;
    const before = snapshotSession(session);

    const agent = createDirectorAgent(
      createAIGateway(
        new FakeProvider({
          scenario: { kind: "error", message: "director outage" },
        }),
      ),
    );

    const { result, session: trackedSession } = await agent.suggestNextBeat({ session });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.value?.targetId).toBe(session.currentBeatId);
    expect(result.validationErrors?.some((e) => e.includes("director outage"))).toBe(true);
    expect(trackedSession.debugEvents.some((e) => e.type === "fallback_used")).toBe(true);
    expect(snapshotSession(session)).toBe(before);
  });

  it("builds deterministic default fallbacks per action", () => {
    const { session } = loadStonepassSession();

    expect(buildDefaultDirectorFallback("select_next_beat", session).targetId).toBe(
      session.currentBeatId,
    );
    expect(buildDefaultDirectorFallback("summarize_world", session).action).toBe("summarize_world");
    expect(buildDefaultDirectorFallback("suggest_session_wrapup", session).action).toBe(
      "suggest_session_wrapup",
    );
    expect(buildDefaultDirectorFallback("generate_instance", session).action).toBe(
      "generate_instance",
    );
    expect(buildDefaultDirectorFallback("adjust_difficulty", session).action).toBe(
      "adjust_difficulty",
    );
    expect(buildDefaultDirectorFallback("adjust_difficulty", session).targetId).toMatch(
      /^difficulty_tier_\d+$/,
    );
  });

  it("supports recap and session wrap-up tasks", async () => {
    const { session } = loadStonepassSession();

    const agent = createDirectorAgent(
      createAIGateway(
        new FakeProvider({
          responsesByTask: {
            director_summarize_world: {
              kind: "success",
              value: {
                action: "summarize_world",
                targetId: session.worldId,
                reason: "Recap of the ogre bridge moment.",
                confidence: 0.7,
              },
            },
            director_suggest_session_wrapup: {
              kind: "success",
              value: {
                action: "suggest_session_wrapup",
                targetId: session.currentBeatId,
                reason: "Good stopping point after the bridge.",
                confidence: 0.6,
              },
            },
          },
        }),
      ),
    );

    const { result: recap } = await agent.suggestRecap({ session });
    expect(recap.ok).toBe(true);
    expect(recap.value?.action).toBe("summarize_world");

    const { result: wrapup } = await agent.suggestSessionWrapup({ session });
    expect(wrapup.ok).toBe(true);
    expect(wrapup.value?.action).toBe("suggest_session_wrapup");
  });

  it("uses seed catalog for reproducible next-beat suggestions", async () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_director_seed",
    });
    const session = sessionResult.session!;

    const agent = createDirectorAgent(
      createAIGateway(
        new FakeProvider({
          scenarioCatalog: [STONEPASS_DIRECTOR_LANDSLIDE, STONEPASS_DIRECTOR_VALLEY],
        }),
      ),
    );

    const { result } = await agent.suggestNextBeat({
      session,
      generationSeed: "replay_seed_42",
    });

    expect(result.ok).toBe(true);
    expect(["beat_landslide_aftermath", "beat_valley_square"]).toContain(result.value?.targetId);
  });

  it("suggestDifficultyAdjust returns in-bounds adjust_difficulty decision", async () => {
    const { session } = loadStonepassSession();
    const before = snapshotSession(session);

    const agent = createDirectorAgent(
      createAIGateway(
        new FakeProvider({
          responsesByTask: {
            director_adjust_difficulty: {
              kind: "success",
              value: {
                action: "adjust_difficulty",
                targetId: "difficulty_tier_2",
                reason: "Moderate struggle on bridge check.",
                confidence: 0.72,
              },
            },
          },
        }),
      ),
    );

    const { result, session: trackedSession } = await agent.suggestDifficultyAdjust({ session });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(result.value?.action).toBe("adjust_difficulty");
    expect(result.value?.targetId).toBe("difficulty_tier_2");
    expect(trackedSession.debugEvents.some((e) => e.type === "ai_suggestion")).toBe(true);
    expect(snapshotSession(session)).toBe(before);
  });

  it("clamps out-of-bounds adjust_difficulty from provider", async () => {
    const { session } = loadStonepassSession();

    const agent = createDirectorAgent(
      createAIGateway(
        new FakeProvider({
          responsesByTask: {
            director_adjust_difficulty: {
              kind: "success",
              value: {
                action: "adjust_difficulty",
                targetId: "difficulty_tier_99",
                reason: "Spike difficulty.",
                confidence: 0.9,
              },
            },
          },
        }),
      ),
    );

    const { result } = await agent.suggestDifficultyAdjust({ session });

    expect(result.ok).toBe(true);
    expect(result.value?.targetId).toBe("difficulty_tier_3");
    expect(result.value?.reason).toContain("clamped");
  });

  it("falls back on invalid adjust_difficulty output without mutating session", async () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_director_difficulty_invalid",
    });
    const session = sessionResult.session!;
    const before = snapshotSession(session);

    const agent = createDirectorAgent(
      createAIGateway(
        new FakeProvider({
          scenario: {
            kind: "invalid",
            raw: {
              action: "adjust_difficulty",
              targetId: "invalid_tier",
              reason: "Bad target.",
              confidence: 0.5,
            },
          },
        }),
      ),
    );

    const { result, session: trackedSession } = await agent.suggestDifficultyAdjust({ session });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.value?.action).toBe("adjust_difficulty");
    expect(result.value?.targetId).toMatch(/^difficulty_tier_\d+$/);
    expect(trackedSession.debugEvents.some((e) => e.type === "fallback_used")).toBe(true);
    expect(snapshotSession(session)).toBe(before);
  });
});
