const { defineConfig } = require("@playwright/test");

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
  }
});
