
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({

  // Test Execution Configuration
  timeout: 30 * 1000, // 30 seconds
  testDir: "./tests",
  fullyParallel: true,

  // Retry and Worker Configuration
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporting Configuration
  reporter: [
    ["list"], // Detailed console output 
    //['line'], // One-line progress output 
    //['dot'], // Minimal console output 
    ["html", { open: "never", outputFolder: "reports" }], // HTML Report 
    //['json', { outputFile: 'reports/results.json' }], // JSON Report 
    ["junit", { outputFile: "reports/results.xml" }], // JUnit XML Report 
    ["./utils/CustomReporter.ts"], // Custom reporter 
    ["allure-playwright", { outputFolder: "allure-results" }], // Allure Report
  ],

  // Common Browser Configuration
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: false,
    viewport: { width: 1280, height: 720 }, // Set default viewport size for consistency
    ignoreHTTPSErrors: true, // Ignore SSL errors if necessary
    permissions: ["geolocation"] // Set necessary permissions for geolocation-based tests
  },

  // Execute Tests Having Specific Tags
  grep: /@master/,

  // Browser Projects Configuration
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    },

    /*
    {
        name: "firefox",
        use: {
            ...devices["Desktop Firefox"]
        }
    },

    {
        name: "webkit",
        use: {
            ...devices["Desktop Safari"]
        }
    }
    */
  ]

});
