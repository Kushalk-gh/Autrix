import unittest
from pathlib import Path

from controller.api import app
from controller.utils.models import AppSpec, ScaleRequest, SimulatedMetricsRequest


ROOT = Path(__file__).resolve().parents[1]
JAVASCRIPT = ROOT / "controller" / "dashboard" / "app.js"


class DashboardOperationTests(unittest.TestCase):
    def test_dashboard_operation_contract_matches_api_schema(self):
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
        }
        paths = app.openapi()["paths"]
        operations = {
            (method.upper(), path)
            for path, methods in paths.items()
            for method in methods
        }
        self.assertTrue(expected.issubset(operations))

    def test_registration_wizard_uses_app_spec_fields_and_shape(self):
        payload = {
            "apiVersion": "v1",
            "kind": "App",
            "metadata": {"name": "test-app"},
            "spec": {
                "type": "http",
                "image": "nginx:alpine",
                "ports": [{"containerPort": 8080, "protocol": "HTTP"}],
                "resources": {"cpu": "100m", "memory": "128Mi"},
                "environment": [],
            },
            "scaling": {"minReplicas": 1, "maxReplicas": 3},
            "healthCheck": {"path": "/health", "port": 8080},
        }
        parsed = AppSpec(**payload)
        self.assertEqual(parsed.metadata["name"], "test-app")
        self.assertEqual(parsed.spec["ports"][0]["containerPort"], 8080)
        self.assertEqual(parsed.scaling["maxReplicas"], 3)
        javascript = JAVASCRIPT.read_text(encoding="utf-8")
        for field in ("apiVersion", "metadata:", "spec:", "scaling:", "healthCheck:"):
            with self.subTest(field=field):
                self.assertIn(field, javascript)

    def test_scale_and_simulation_use_server_model_field_names(self):
        self.assertEqual(ScaleRequest(replicas=0).replicas, 0)
        with self.assertRaises(ValueError):
            ScaleRequest(replicas=101)
        simulated = SimulatedMetricsRequest(
            rps=12,
            p95LatencyMs=150,
            activeConnections=4,
            cpuPercent=65,
            memoryPercent=40,
            healthyReplicas=2,
            evaluate=False,
        )
        self.assertEqual(simulated.p95LatencyMs, 150)
        self.assertFalse(simulated.evaluate)
        javascript = JAVASCRIPT.read_text(encoding="utf-8")
        for field in ("p95LatencyMs", "activeConnections", "cpuPercent", "memoryPercent", "healthyReplicas", "evaluate"):
            with self.subTest(field=field):
                self.assertIn(field, javascript)

    def test_api_client_encodes_path_values_and_displays_server_errors(self):
        javascript = JAVASCRIPT.read_text(encoding="utf-8")
        self.assertIn("encodeURIComponent(name)", javascript)
        self.assertIn("response.ok", javascript)
        self.assertIn("response.statusText", javascript)
        self.assertIn("detail || data.error || data.message", javascript)

if __name__ == "__main__":
    unittest.main()
