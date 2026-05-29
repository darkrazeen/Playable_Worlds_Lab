import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { DirectorDecisionSchema } from "@playable-worlds/core";

import { FakeProvider, type AIRequest } from "../../../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const directorRequest: AIRequest = {
  task: "director_select_next_beat",
  prompt: "Suggest the next story beat after the ogre fight.",
  generationSeed: "seed_director_001",
};

const validDirectorDecision = {
  action: "select_next_beat",
  targetId: "beat_landslide_aftermath",
  reason:
    "Player defeated the ogre and triggered the landslide; the aftermath beat fits current flags.",
  confidence: 0.82,
  safetyNotes: ["teen-safe combat resolution"],
};

describe("FakeProvider", () => {
  it("returns a valid DirectorDecision wrapped in AIResult on success", async () => {
    const provider = new FakeProvider({
      scenario: { kind: "success", value: validDirectorDecision, latencyMs: 12 },
    });

    const result = await provider.generateStructured(directorRequest, DirectorDecisionSchema);

    expect(result.ok).toBe(true);
    expect(result.provider).toBe("fake");
    expect(result.fallbackUsed).toBe(false);
    expect(result.value?.action).toBe("select_next_beat");
    expect(result.value?.targetId).toBe("beat_landslide_aftermath");
    expect(result.latencyMs).toBe(12);
    expect(result.generationSeed).toBe("seed_director_001");
  });

  it("returns validation failure AIResult when canned output is invalid", async () => {
    const provider = new FakeProvider({
      scenario: {
        kind: "invalid",
        raw: { action: "bad_action", targetId: "x", reason: "x", confidence: 2 },
      },
    });

    const result = await provider.generateStructured(directorRequest, DirectorDecisionSchema);

    expect(result.ok).toBe(false);
    expect(result.provider).toBe("fake");
    expect(result.fallbackUsed).toBe(true);
    expect(result.raw).toEqual({
      action: "bad_action",
      targetId: "x",
      reason: "x",
      confidence: 2,
    });
    expect(result.validationErrors?.length).toBeGreaterThan(0);
    expect(result.value).toBeUndefined();
  });

  it("throws when configured for provider error", async () => {
    const provider = new FakeProvider({
      scenario: { kind: "error", message: "Simulated provider outage" },
    });

    await expect(
      provider.generateStructured(directorRequest, DirectorDecisionSchema),
    ).rejects.toThrow("Simulated provider outage");
  });

  it("supports task-specific canned responses", async () => {
    const provider = new FakeProvider({
      responsesByTask: {
        director_select_next_beat: { kind: "success", value: validDirectorDecision },
      },
    });

    const result = await provider.generateStructured(directorRequest, DirectorDecisionSchema);
    expect(result.ok).toBe(true);
    expect(result.value?.targetId).toBe("beat_landslide_aftermath");
  });

  it("matches ai-result-success-director.example.json shape via FakeProvider", async () => {
    const example = JSON.parse(
      readFileSync(join(examplesDir, "ai-result-success-director.example.json"), "utf8"),
    );

    const provider = new FakeProvider({
      scenario: { kind: "success", value: example.value, latencyMs: example.latencyMs },
    });

    const result = await provider.generateStructured(
      { task: "director_select_next_beat", prompt: "Suggest next beat." },
      DirectorDecisionSchema,
    );

    expect(result.ok).toBe(example.ok);
    expect(result.provider).toBe(example.provider);
    expect(result.fallbackUsed).toBe(example.fallbackUsed);
    expect(result.value).toEqual(example.value);
  });
});
