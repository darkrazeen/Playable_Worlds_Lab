import { defineConfig } from "vitest/config";

export default defineConfig({
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
  },
});
