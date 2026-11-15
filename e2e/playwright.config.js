const { defineConfig } = require("@playwright/test");

const useExternalServer = Boolean(process.env.ORCHESTRY_BASE_URL);

module.exports = defineConfig({
  testDir: ".",
  testMatch: [
    "**/dashboard-navigation.spec.js",
    "**/application-management.spec.js",
    "**/application-diagnostics.spec.js"
  ],
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.ORCHESTRY_BASE_URL || "http://127.0.0.1:8765",
    headless: true
  },
  ...(useExternalServer ? {} : {
    webServer: {
      command: "python ../tests/e2e_test_server.py",
      url: "http://127.0.0.1:8765/dashboard",
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    }
  })
});
