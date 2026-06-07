import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./tests/visual/output",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3002",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Do not start dev server automatically — run `npm run dev` first
  webServer: undefined,
});
