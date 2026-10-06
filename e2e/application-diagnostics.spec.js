const { test, expect } = require("@playwright/test");

test("shows diagnostics, API errors, and remains usable on a narrow screen", async ({ page }) => {
  const app = { name: "demo-app", status: "running", replicas: 1, ready_replicas: 1, spec: { image: "nginx:alpine" } };
  await page.route(/\/apps(?:\/|$)/, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/apps") return route.fulfill({ json: { apps: [app] } });
    if (url.pathname.endsWith("/status")) return route.fulfill({ json: { ...app, instances: [], mode: "auto" } });
    if (url.pathname.endsWith("/raw")) return route.fulfill({ json: { name: "demo-app", raw: { metadata: { name: "demo-app" } }, parsed: app } });
    if (url.pathname.endsWith("/logs")) return route.fulfill({ json: { app: "demo-app", logs: [{ message: "service ready" }] } });
    if (url.pathname.endsWith("/metrics")) return route.fulfill({ json: { app: "demo-app", metrics: { rps: 2 }, scaling_history: [] } });
    return route.fulfill({ status: 404, json: { detail: "Application not found" } });
  });
  await page.route("**/events**", (route) => route.fulfill({ json: { events: [{ app_name: "demo-app", event_type: "started", message: "service ready" }] } }));
  await page.route("**/cluster/health", (route) => route.fulfill({ json: { status: "healthy", clustering: "disabled" } }));
  await page.route("**/cluster/status", (route) => route.fulfill({ status: 503, json: { detail: "Clustering not enabled" } }));
  await page.route("**/cluster/leader", (route) => route.fulfill({ status: 503, json: { detail: "Clustering not enabled" } }));
  await page.route("**/metrics", (route) => route.fulfill({ json: { apps: { total: 1, running: 1 }, instances: { total: 1, healthy: 1 } } }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard#/app/demo-app/status");
  await expect(page.getByRole("heading", { name: "demo-app" })).toBeVisible();
  await page.getByRole("link", { name: "Logs" }).click();
  await expect(page.getByText("service ready")).toBeVisible();
  await page.getByRole("link", { name: "Metrics" }).last().click();
  await expect(page.getByText(/scaling history/i)).toBeVisible();

  await page.goto("/dashboard#/events");
  await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
  await expect(page.getByText("started")).toBeVisible();

  await page.route(/\/apps\/demo-app\/logs(?:\?.*)?$/, (route) => route.fulfill({ status: 500, json: { detail: "Log service unavailable" } }));
  await page.goto("/dashboard#/app/demo-app/logs");
  await expect(page.getByText(/Log service unavailable/)).toBeVisible();
  await page.goto("/dashboard#/dashboard");
  await page.getByRole("link", { name: "Applications" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});
