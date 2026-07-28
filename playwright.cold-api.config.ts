import { defineConfig, devices } from "@playwright/test";

/** Used only for the dead-API Alert check against an already-running Vite. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "cold-api.spec.ts",
  fullyParallel: false,
  timeout: 30_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5173",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
