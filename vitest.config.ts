import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "apps/web/src"),
      "@kerbside/shared": path.resolve(rootDir, "packages/shared/src/index.ts"),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    fileParallelism: false,
    testTimeout: 30_000,
    environmentMatchGlobs: [
      ["**/*.test.tsx", "jsdom"],
      ["**/useApi.test.ts", "jsdom"],
    ],
  },
});
