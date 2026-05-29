import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export const contentRoot = packageRoot;
export const worldsDir = join(contentRoot, "worlds");
export const examplesDir = join(contentRoot, "examples");

export const stonepassValleyWorldPath = join(worldsDir, "stonepass/stonepass-valley.world.json");

export const stonepassInvalidExamplePath = join(
  examplesDir,
  "world-definition-stonepass-invalid.example.json",
);
