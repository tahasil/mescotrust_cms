const { defineConfig, devices } = require("@playwright/test");
require("dotenv").config({ path: ".env" });

module.exports = defineConfig({
  testDir: "./e2e",
  outputDir: "playwright-artifacts/payment-gateway",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/payment-gateway", open: "never" }],
    ["json", { outputFile: "playwright-artifacts/payment-results.json" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    ignoreHTTPSErrors: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "chromium-payment",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
