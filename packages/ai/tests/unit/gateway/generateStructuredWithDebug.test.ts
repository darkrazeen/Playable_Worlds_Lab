import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { DirectorDecisionSchema, initializeWorldSession, loadWorld } from "@playable-worlds/core";

import { createAIGateway } from "../../../src/gateway/aiGateway.js";
import { generateStructuredWithDebug } from "../../../src/gateway/generateStructuredWithDebug.js";
import { FakeProvider } from "../../../src/providers/fakeProvider.js";
import { STONEPASS_DIRECTOR_LANDSLIDE } from "../../../src/providers/fakeProviderScenarios.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");

describe("generateStructuredWithDebug", () => {
  it("records ai_suggestion on successful gateway calls", async () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_generate_with_debug_ok",
    });
    const session = sessionResult.session!;
    const gateway = createAIGateway(new FakeProvider({ scenario: STONEPASS_DIRECTOR_LANDSLIDE }));

    const { result, session: tracked } = await generateStructuredWithDebug(gateway, {
      session,
      debug: { agent: "director", task: "director_select_next_beat" },
      request: {
        task: "director_select_next_beat",
        prompt: "Suggest next beat.",
        generationSeed: "seed_debug_ok",
      },
      schema: DirectorDecisionSchema,
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(tracked.debugEvents.some((e) => e.type === "ai_suggestion")).toBe(true);
    expect(tracked.ledger).toEqual(session.ledger);
  });

  it("records fallback_used when the gateway applies a fallback", async () => {
    const worldResult = loadWorld("world_stonepass_valley", contentRoot);
    const sessionResult = initializeWorldSession(worldResult.world!, {
      sessionId: "session_generate_with_debug_fallback",
    });
    const session = sessionResult.session!;
    const gateway = createAIGateway(
      new FakeProvider({
        scenario: { kind: "error", message: "gateway outage" },
      }),
    );

    const fallbackValue = {
      action: "select_next_beat" as const,
      targetId: session.currentBeatId,
      reason: "Fallback beat.",
      confidence: 0.5,
    };

    const { result, session: tracked } = await generateStructuredWithDebug(gateway, {
      session,
      debug: { agent: "director", task: "director_select_next_beat" },
      request: {
        task: "director_select_next_beat",
        prompt: "Suggest next beat.",
      },
      schema: DirectorDecisionSchema,
      fallbackValue,
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(tracked.debugEvents.some((e) => e.type === "fallback_used")).toBe(true);
    expect(tracked.currentBeatId).toBe(session.currentBeatId);
  });
});
