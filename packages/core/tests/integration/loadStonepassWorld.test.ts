import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { loadWorld, loadWorldFromFile } from "../../src/world/loadWorld.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(__dirname, "../../../content");
const stonepassValleyWorldPath = join(
  contentRoot,
  "worlds/stonepass/stonepass-valley.world.json",
);
const stonepassInvalidExamplePath = join(
  contentRoot,
  "examples/world-definition-stonepass-invalid.example.json",
);

describe("world loader integration", () => {
  it("loads stonepass-valley.world.json via loadWorldFromFile", () => {
    const result = loadWorldFromFile(stonepassValleyWorldPath);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.world?.id).toBe("world_stonepass_valley");
    expect(result.world?.schemaVersion).toBe("0.2.0");
  });

  it("loads Stonepass via loadWorld(id, contentRoot)", () => {
    const result = loadWorld("world_stonepass_valley", contentRoot);

    expect(result.ok).toBe(true);
    expect(result.world?.title).toBe("Stonepass Spire — Floor 1");
  });

  it("rejects the broken Stonepass invalid fixture", () => {
    const result = loadWorldFromFile(stonepassInvalidExamplePath);

    expect(result.ok).toBe(false);
    expect(result.world).toBeUndefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
