const { test, expect } = require("@playwright/test");

test("registers, reads back, and deletes an app through the real API and database", async ({ page }) => {
  const appName = `dash-live-${Date.now().toString(36)}`;

  await page.goto("/dashboard#/create");
  await page.locator("#wizard-name").fill(appName);
  await page.getByRole("button", { name: "Next step" }).click();
  await page.locator("#wizard-image").fill("nginx:alpine");
  await page.getByRole("button", { name: "Next step" }).click();
  await page.getByRole("button", { name: "Next step" }).click();
  await page.getByRole("button", { name: "Next step" }).click();
  await page.getByRole("button", { name: "Register application" }).click();

  await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
  await expect(page.getByRole("link", { name: appName })).toBeVisible();
  await page.getByRole("link", { name: appName }).click();
  await expect(page.getByRole("heading", { name: appName })).toBeVisible();
  await page.getByRole("link", { name: "Configuration" }).click();
  await expect(page.getByText(appName).first()).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
  await expect(page.getByRole("link", { name: appName })).toHaveCount(0);
});
