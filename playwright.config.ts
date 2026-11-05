
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
    ["list"], // Console reporter
    //['line'], // One-line progress output
    //['dot'],  // Minimal console output
    //['json', { outputFile: 'reports/results.json' }], // JSON Report
    ["html", { open: "never", outputFolder: "test-results/playwright" }], // Playwright HTML report
    ["junit", { outputFile: "test-results/junit/results.xml" }],  // JUnit XML report
    // ["./utils/CustomReporter.ts"],  // Custom reporter
    ["allure-playwright", { resultsDir: "test-results/allure/results", }] // Allure report results
  ],

  // ==================================================
  // 5. COMMON BROWSER CONFIGURATION
  // ==================================================

  use: {
    // Application URL
    baseURL: process.env.WEB_APP_URL,

    // Browser execution mode
    headless: isCI,

    // Failure debugging options
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Browser window settings
    viewport: {
      width: 1280,
      height: 720,
    },

    // Browser permissions and security
    ignoreHTTPSErrors: true,
    permissions: ["geolocation"],
  },

  // ==================================================
  // 6. BROWSER PROJECT CONFIGURATION
  // ==================================================

  projects: [
    // Chromium
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    // Firefox
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },

    // WebKit
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
  ],
});
