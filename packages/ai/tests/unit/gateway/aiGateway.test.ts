import { describe, expect, it } from "vitest";

import { DirectorDecisionSchema } from "@playable-worlds/core";

import type { AIProvider } from "../../../src/contracts/aiProvider.js";
import type { AIRequest } from "../../../src/contracts/aiRequest.js";
import { AIGateway, createAIGateway } from "../../../src/gateway/aiGateway.js";
import { FakeProvider } from "../../../src/providers/fakeProvider.js";

const directorRequest: AIRequest = {
  task: "director_select_next_beat",
  prompt: "Suggest the next story beat after the ogre fight.",
  generationSeed: "seed_gateway_001",
};

const validDirectorDecision = {
  action: "select_next_beat" as const,
  targetId: "beat_landslide_aftermath",
  reason: "Player defeated the ogre; advance to the landslide aftermath beat.",
  confidence: 0.8,
};

const fallbackDirectorDecision = {
  action: "select_next_beat" as const,
  targetId: "beat_valley_square",
  reason: "Fallback beat when model output is unavailable.",
  confidence: 0.5,
};

function createThrowingProvider(): AIProvider {
  return {
    name: "throws-on-call",
    async generateStructured() {
      throw new Error("provider should not be called");
    },
  };
}

describe("AIGateway", () => {
  it("returns success when the provider returns valid structured output", async () => {
    const gateway = createAIGateway(
      new FakeProvider({
        scenario: { kind: "success", value: validDirectorDecision, latencyMs: 5 },
      }),
    );

    const result = await gateway.generateStructured({
      request: directorRequest,
      schema: DirectorDecisionSchema,
    });

    expect(result.ok).toBe(true);
    expect(result.provider).toBe("fake");
    expect(result.fallbackUsed).toBe(false);
    expect(result.value?.targetId).toBe("beat_landslide_aftermath");
  });

  it("returns validation failure when provider output fails schema parse", async () => {
    const gateway = createAIGateway(
      new FakeProvider({
        scenario: {
          kind: "invalid",
          raw: { action: "bad_action", targetId: "x", reason: "x", confidence: 2 },
        },
      }),
    );

    const result = await gateway.generateStructured({
      request: directorRequest,
      schema: DirectorDecisionSchema,
    });

    expect(result.ok).toBe(false);
    expect(result.fallbackUsed).toBe(true);
    expect(result.validationErrors?.length).toBeGreaterThan(0);
    expect(result.value).toBeUndefined();
  });

  it("applies a configured fallback value after validation failure", async () => {
    const gateway = createAIGateway(
      new FakeProvider({
        scenario: { kind: "invalid", raw: { action: "nope" } },
      }),
    );

    const result = await gateway.generateStructured({
      request: directorRequest,
      schema: DirectorDecisionSchema,
      fallbackValue: fallbackDirectorDecision,
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.value?.targetId).toBe("beat_valley_square");
    expect(result.validationErrors?.length).toBeGreaterThan(0);
  });

  it("converts provider throws into AIResult and can apply fallback", async () => {
    const gateway = createAIGateway(
      new FakeProvider({
        scenario: { kind: "error", message: "Simulated outage" },
      }),
    );

    const result = await gateway.generateStructured({
      request: directorRequest,
      schema: DirectorDecisionSchema,
      fallbackValue: fallbackDirectorDecision,
    });

    expect(result.ok).toBe(true);
    expect(result.fallbackUsed).toBe(true);
    expect(result.validationErrors?.some((e) => e.includes("Simulated outage"))).toBe(true);
    expect(result.value?.targetId).toBe("beat_valley_square");
  });

  it("rejects invalid AIRequest without calling the provider", async () => {
    const gateway = new AIGateway({ provider: createThrowingProvider() });

    const result = await gateway.generateStructured({
      request: { task: "", prompt: "bad request" },
      schema: DirectorDecisionSchema,
    });

    expect(result.ok).toBe(false);
    expect(result.validationErrors?.some((e) => e.startsWith("request:"))).toBe(true);
  });
});
