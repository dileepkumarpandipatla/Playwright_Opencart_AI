
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

// ==================================================
// 1. GENERAL TEST CONFIGURATION
// ==================================================

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  timeout: 30 * 1000,

  expect: {
    timeout: 10 * 1000,
  },

  // ==================================================
  // 2. TEST EXECUTION CONFIGURATION
  // ==================================================

  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  // ==================================================
  // 3. TEST ARTIFACTS OUTPUT DIRECTORY
  // ==================================================

  outputDir: "./test-results/execution",

  // ==================================================
  // 4. REPORTER CONFIGURATION
  // ==================================================

  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "junit-report/results.xml" }],
    ["allure-playwright", { resultsDir: "allure-results" }]
  ],

  // ==================================================
  // 5. COMMON BROWSER CONFIGURATION
  // ==================================================

  use: {
    baseURL: process.env.WEB_APP_URL,

    headless: isCI,

    trace: "on",
    screenshot: "on",
    video: "retain-on-failure",

    viewport: {
      width: 1280,
      height: 720,
    },

    ignoreHTTPSErrors: true,
    permissions: ["geolocation"],
  },

  // ==================================================
  // 6. BROWSER PROJECT CONFIGURATION
  // ==================================================

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
  ],
});
