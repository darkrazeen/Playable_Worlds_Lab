import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  SafetyModeSchema,
  WorldDNASchema,
  parseWorldDNA,
  safeParseWorldDNA,
} from "../../../src/schemas/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, "../../../../content/examples");

const validTeen = {
  genre: "fantasy" as const,
  tone: "heroic" as const,
  sessionLengthMinutes: 15 as const,
  coreLoop: ["reach obstacle", "make choice", "face consequence"],
  consequenceIntensity: "medium" as const,
  aiCreativity: "balanced" as const,
  safetyMode: "teen" as const,
};

const validAdult = {
  genre: "mystery" as const,
  tone: "dark" as const,
  sessionLengthMinutes: 30 as const,
  coreLoop: ["investigate", "choose", "consequence"],
  consequenceIntensity: "major" as const,
  aiCreativity: "conservative" as const,
  safetyMode: "adult" as const,
};

describe("SafetyModeSchema", () => {
  it("accepts teen and adult", () => {
    expect(SafetyModeSchema.parse("teen")).toBe("teen");
    expect(SafetyModeSchema.parse("adult")).toBe("adult");
  });

  it("rejects unsupported safety modes", () => {
    expect(SafetyModeSchema.safeParse("child").success).toBe(false);
    expect(SafetyModeSchema.safeParse("").success).toBe(false);
  });
});

describe("WorldDNASchema", () => {
  it("accepts valid teen WorldDNA", () => {
    const result = WorldDNASchema.safeParse(validTeen);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.safetyMode).toBe("teen");
    }
  });

  it("accepts valid adult WorldDNA", () => {
    const result = WorldDNASchema.safeParse(validAdult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.safetyMode).toBe("adult");
    }
  });

  it("parses via parseWorldDNA helper", () => {
    const dna = parseWorldDNA(validTeen);
    expect(dna.genre).toBe("fantasy");
  });

  it("rejects invalid safetyMode", () => {
    const invalid = { ...validTeen, safetyMode: "child" as string };
    expect(WorldDNASchema.safeParse(invalid).success).toBe(false);
    expect(safeParseWorldDNA(invalid).success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const missingGenre = {
      tone: "heroic",
      sessionLengthMinutes: 15,
      coreLoop: ["reach obstacle"],
      consequenceIntensity: "medium",
      aiCreativity: "balanced",
      safetyMode: "teen",
    };
    expect(WorldDNASchema.safeParse(missingGenre).success).toBe(false);
  });

  it("rejects unsupported genre enum", () => {
    const invalid = { ...validTeen, genre: "horror" as string };
    expect(WorldDNASchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects invalid sessionLengthMinutes", () => {
    const invalid = { ...validTeen, sessionLengthMinutes: 7 as number };
    expect(WorldDNASchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects empty coreLoop", () => {
    const invalid = { ...validTeen, coreLoop: [] };
    expect(WorldDNASchema.safeParse(invalid).success).toBe(false);
  });

  it("validates JSON examples from packages/content/examples", () => {
    const teen = JSON.parse(
      readFileSync(join(examplesDir, "world-dna-teen.example.json"), "utf8"),
    );
    const adult = JSON.parse(
      readFileSync(join(examplesDir, "world-dna-adult.example.json"), "utf8"),
    );
    expect(WorldDNASchema.safeParse(teen).success).toBe(true);
    expect(WorldDNASchema.safeParse(adult).success).toBe(true);
  });
});
