import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { isKnownWorldId, loadWorld, loadWorldFromFile } from "../../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../../content");

describe("loadWorldFromFile", () => {
  it("returns structured errors for a missing file", () => {
    const result = loadWorldFromFile(join(contentRoot, "worlds/missing.world.json"));

    expect(result.ok).toBe(false);
    expect(result.world).toBeUndefined();
    expect(result.errors.some((error) => error.includes("failed to read"))).toBe(true);
  });

  it("returns schema errors for invalid JSON shape", () => {
    const result = loadWorldFromFile(join(contentRoot, "examples/world-dna-teen.example.json"));

    expect(result.ok).toBe(false);
    expect(result.world).toBeUndefined();
    expect(result.errors.some((error) => error.startsWith("schema:"))).toBe(true);
  });

  it("returns graph validation errors for broken Stonepass fixture", () => {
    const result = loadWorldFromFile(
      join(contentRoot, "examples/world-definition-stonepass-invalid.example.json"),
    );

    expect(result.ok).toBe(false);
    expect(result.world).toBeUndefined();
    expect(result.errors.some((error) => error.includes("unknown consequence"))).toBe(true);
  });
});

describe("loadWorld", () => {
  it("loads canonical Stonepass by world id", () => {
    const result = loadWorld("world_stonepass_valley", contentRoot);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.world?.id).toBe("world_stonepass_valley");
    expect(result.world?.startingBeatId).toBe("beat_ogre_bridge");
  });

  it("returns structured errors for unknown world ids", () => {
    const result = loadWorld("world_does_not_exist", contentRoot);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['loader: unknown world id "world_does_not_exist"']);
  });
});

describe("isKnownWorldId", () => {
  it("recognizes canonical Stonepass", () => {
    expect(isKnownWorldId("world_stonepass_valley")).toBe(true);
    expect(isKnownWorldId("world_unknown")).toBe(false);
  });
});
