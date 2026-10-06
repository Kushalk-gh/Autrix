const config = require("./playwright.config");

module.exports = {
  ...config,
  testMatch: "**/*.integration.spec.js"
};
