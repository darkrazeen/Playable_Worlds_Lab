import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  AIResultSchema,
  createAIResultSchema,
  DirectorDecisionSchema,
  parseAIResult,
  parseTypedAIResult,
  safeParseAIResult,
  safeParseTypedAIResult,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const directorValue = {
  action: "select_next_beat",
  targetId: "beat_landslide_aftermath",
  reason: "Player defeated the ogre; advance to landslide aftermath.",
  confidence: 0.82,
};

const validSuccess = {
  ok: true,
  value: directorValue,
  provider: "fake",
  fallbackUsed: false,
  latencyMs: 12,
  generationSeed: "seed_director_001",
};

const validFailure = {
  ok: false,
  raw: { action: "bad_action", confidence: 2 },
  provider: "fake",
  fallbackUsed: true,
  validationErrors: ["action: Invalid enum value", "confidence: Number must be less than or equal to 1"],
};

describe("AIResultSchema", () => {
  it("accepts a valid success result", () => {
    expect(AIResultSchema.safeParse(validSuccess).success).toBe(true);
  });

  it("accepts a valid failure result with validationErrors and raw output", () => {
    expect(AIResultSchema.safeParse(validFailure).success).toBe(true);
  });

  it("accepts minimal required fields only", () => {
    expect(
      AIResultSchema.safeParse({ ok: false, provider: "fake", fallbackUsed: false }).success,
    ).toBe(true);
  });

  it("parses via parseAIResult helper", () => {
    const result = parseAIResult(validSuccess);
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("fake");
  });

  it("rejects missing required fields", () => {
    const { ok: _ok, ...noOk } = validSuccess;
    const { provider: _provider, ...noProvider } = validSuccess;
    const { fallbackUsed: _fallback, ...noFallback } = validSuccess;
    expect(AIResultSchema.safeParse(noOk).success).toBe(false);
    expect(AIResultSchema.safeParse(noProvider).success).toBe(false);
    expect(AIResultSchema.safeParse(noFallback).success).toBe(false);
  });

  it("rejects empty provider and malformed fallbackUsed", () => {
    expect(AIResultSchema.safeParse({ ...validSuccess, provider: "" }).success).toBe(false);
    expect(AIResultSchema.safeParse({ ...validSuccess, fallbackUsed: "false" }).success).toBe(
      false,
    );
    expect(safeParseAIResult({ ...validSuccess, fallbackUsed: 0 }).success).toBe(false);
  });

  it("rejects negative latencyMs and empty validation error strings", () => {
    expect(AIResultSchema.safeParse({ ...validSuccess, latencyMs: -1 }).success).toBe(false);
    expect(
      AIResultSchema.safeParse({ ...validFailure, validationErrors: [""] }).success,
    ).toBe(false);
  });

  it("validates JSON examples from packages/content/examples", () => {
    const success = JSON.parse(
      readFileSync(join(examplesDir, "ai-result-success-director.example.json"), "utf8"),
    );
    const failure = JSON.parse(
      readFileSync(join(examplesDir, "ai-result-validation-failure.example.json"), "utf8"),
    );
    expect(AIResultSchema.safeParse(success).success).toBe(true);
    expect(AIResultSchema.safeParse(failure).success).toBe(true);
  });
});

describe("createAIResultSchema (typed value)", () => {
  const DirectorAIResultSchema = createAIResultSchema(DirectorDecisionSchema);

  it("accepts success when value matches DirectorDecisionSchema", () => {
    expect(DirectorAIResultSchema.safeParse(validSuccess).success).toBe(true);
  });

  it("rejects success when value fails DirectorDecisionSchema", () => {
    const badValue = {
      ...validSuccess,
      value: { ...directorValue, confidence: 1.5 },
    };
    expect(DirectorAIResultSchema.safeParse(badValue).success).toBe(false);
  });

  it("parses via parseTypedAIResult helper", () => {
    const result = parseTypedAIResult(DirectorDecisionSchema, validSuccess);
    expect(result.value?.action).toBe("select_next_beat");
  });

  it("allows failure results without validating value shape", () => {
    expect(DirectorAIResultSchema.safeParse(validFailure).success).toBe(true);
  });

  it("rejects invalid value on typed safeParse when value is present", () => {
    const bad = {
      ok: true,
      provider: "fake",
      fallbackUsed: false,
      value: { action: "nope", targetId: "x", reason: "x", confidence: 0.5 },
    };
    expect(safeParseTypedAIResult(DirectorDecisionSchema, bad).success).toBe(false);
  });
});
