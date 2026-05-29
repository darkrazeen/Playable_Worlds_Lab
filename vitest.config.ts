import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(repoRoot, "apps/web"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: [
      "tests/**/*.test.ts",
      "packages/*/tests/**/*.test.ts",
      "apps/web/tests/**/*.test.ts",
      "apps/web/tests/**/*.test.tsx",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: [
        "packages/core/src/**/*.ts",
        "packages/ai/src/**/*.ts",
        "apps/web/features/**/*.ts",
        "apps/web/features/**/*.tsx",
      ],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/index.ts"],
    },
  },
});
