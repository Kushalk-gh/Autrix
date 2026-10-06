import asyncio
import unittest
from pathlib import Path

from fastapi.routing import APIRoute
from starlette.routing import Mount

from controller.api import app, classic_api_docs, dashboard_home


ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "controller" / "dashboard"


class DashboardRouteTests(unittest.TestCase):
    def test_dashboard_pages_are_registered_outside_openapi(self):
        routes = {
            route.path: route
            for route in app.routes
            if isinstance(route, APIRoute)
        }
        self.assertIn("/", routes)
        self.assertIn("/dashboard", routes)
        self.assertIn("/classic-api-docs", routes)
        schema_paths = app.openapi()["paths"]
        self.assertNotIn("/", schema_paths)
        self.assertNotIn("/dashboard", schema_paths)
        self.assertNotIn("/classic-api-docs", schema_paths)

    def test_static_assets_are_mounted(self):
        mounts = {
            route.path: route
            for route in app.routes
            if isinstance(route, Mount)
        }
        self.assertIn("/dashboard-assets", mounts)
        for filename in ("index.html", "classic-api-docs.html", "styles.css", "app.js"):
            with self.subTest(filename=filename):
                self.assertTrue((DASHBOARD / filename).is_file())

    def test_page_handlers_return_existing_dashboard_files(self):
        home = asyncio.run(dashboard_home())
        classic = asyncio.run(classic_api_docs())
        self.assertEqual(Path(home.path), DASHBOARD / "index.html")
        self.assertEqual(Path(classic.path), DASHBOARD / "classic-api-docs.html")

    def test_openapi_keeps_all_nineteen_current_operations(self):
        expected = {
            ("POST", "/apps/register"),
            ("POST", "/apps/{name}/up"),
            ("POST", "/apps/{name}/down"),
            ("DELETE", "/apps/{name}"),
            ("GET", "/apps/{name}/status"),
            ("POST", "/apps/{name}/scale"),
            ("POST", "/apps/{name}/policy"),
            ("GET", "/apps"),
            ("GET", "/apps/{name}/raw"),
            ("GET", "/apps/{name}/logs"),
            ("GET", "/apps/{name}/metrics"),
            ("POST", "/apps/{name}/simulateMetrics"),
            ("GET", "/metrics"),
            ("GET", "/events"),
            ("GET", "/cluster/status"),
            ("GET", "/cluster/leader"),
            ("GET", "/cluster/health"),
            ("GET", "/lb-health"),
            ("GET", "/health"),
        }
        operations = {
            (method.upper(), path)
            for path, methods in app.openapi()["paths"].items()
            for method in methods
        }
        self.assertEqual(operations, expected)

    def test_classic_wrapper_keeps_the_original_swagger_page(self):
        wrapper = (DASHBOARD / "classic-api-docs.html").read_text(encoding="utf-8")
        self.assertIn('src="/docs"', wrapper)
        self.assertIn('href="/dashboard"', wrapper)

    def test_dashboard_maps_all_seventeen_user_facing_api_paths(self):
        javascript = (DASHBOARD / "app.js").read_text(encoding="utf-8")
        expected_fragments = (
            'api("/apps")',
            'appUrl(name, "/up")',
            'appUrl(name, "/down")',
            'api(appUrl(name), { method: "DELETE" })',
            'appUrl(name, "/status")',
            'appUrl(name, "/scale")',
            'appUrl(values.app, "/policy")',
            'appUrl(name, "/raw")',
            'appUrl(name, "/logs")',
            'appUrl(name, "/metrics")',
            'appUrl(values.app, "/simulateMetrics")',
            'api("/metrics")',
            'api(`/events?',
            'api("/cluster/status")',
            'api("/cluster/leader")',
            'api("/cluster/health")',
            'api("/apps/register"',
        )
        for fragment in expected_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, javascript)


if __name__ == "__main__":
    unittest.main()
