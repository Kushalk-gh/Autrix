const { test, expect } = require("@playwright/test");

test("registers an application, reads it back, and sends a lifecycle action", async ({ page }) => {
  const apps = [];
  let submittedSpec;
  await page.route(/\/apps(?:\/|$)/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "POST" && url.pathname === "/apps/register") {
      submittedSpec = request.postDataJSON();
      apps.push({
        name: submittedSpec.metadata.name,
        status: "stopped",
        replicas: 0,
        ready_replicas: 0,
        spec: submittedSpec.spec
      });
      await route.fulfill({ json: { status: "registered", app: submittedSpec.metadata.name, message: "Application registered successfully" } });
      return;
    }
    if (request.method() === "GET" && url.pathname === "/apps") {
      await route.fulfill({ json: { apps } });
      return;
    }
    await route.fulfill({ json: { status: "ok", app: "demo-app" } });
  });
  await page.route("**/cluster/health", (route) => route.fulfill({ json: { status: "healthy", clustering: "disabled" } }));
  await page.route("**/cluster/status", (route) => route.fulfill({ status: 503, json: { detail: "Clustering not enabled" } }));
  await page.route("**/cluster/leader", (route) => route.fulfill({ status: 503, json: { detail: "Clustering not enabled" } }));
  await page.route("**/metrics", (route) => route.fulfill({ json: { apps: { total: apps.length, running: 0 }, instances: { total: 0, healthy: 0 } } }));

  await page.goto("/dashboard#/create");
  await page.locator("#wizard-name").fill("demo-app");
  await page.getByRole("button", { name: "Next step" }).click();
  await page.locator("#wizard-image").fill("nginx:alpine");
  await page.getByRole("button", { name: "Next step" }).click();
  await page.getByRole("button", { name: "Next step" }).click();
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByRole("heading", { name: "Review before registering" })).toBeVisible();
  await page.getByRole("button", { name: "Register application" }).click();

  await expect.poll(() => submittedSpec?.metadata?.name).toBe("demo-app");
  expect(submittedSpec).toMatchObject({
    apiVersion: "v1",
    kind: "App",
    metadata: { name: "demo-app" },
    spec: { image: "nginx:alpine", ports: [{ containerPort: 8080, protocol: "HTTP" }] }
  });
  await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
  await expect(page.getByRole("link", { name: "demo-app" })).toBeVisible();

  let started = false;
  await page.route(/\/apps\/demo-app\/up$/, async (route) => {
    started = true;
    await route.fulfill({ json: { status: "running", app: "demo-app" } });
  });
  await page.getByRole("button", { name: "Start" }).click();
  await expect.poll(() => started).toBe(true);
});
