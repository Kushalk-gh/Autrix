const { test, expect } = require("@playwright/test");

test("switches between the guided dashboard and the existing Swagger docs", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome to Autrix" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Classic API Docs" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Classic API Docs" }).first().click();
  await expect(page).toHaveURL(/\/classic-api-docs$/);
  await expect(page.getByRole("link", { name: "← New Dashboard" })).toBeVisible();
  await expect(page.locator("iframe")).toHaveAttribute("src", "/docs");
  await expect(page.frameLocator("iframe").locator(".swagger-ui")).toBeVisible();

  await page.getByRole("link", { name: "← New Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("complementary", { name: "Main navigation" })).toBeVisible();
});
