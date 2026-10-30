import json
import os
import unittest
import uuid
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


BASE_URL = os.environ.get("ORCHESTRY_BASE_URL", "http://127.0.0.1:8765").rstrip("/")


def request_json(method, path, payload=None):
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        f"{BASE_URL}{path}",
        data=body,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with urlopen(request, timeout=10) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except HTTPError as error:
        raw = error.read()
        try:
            response_body = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            response_body = raw.decode("utf-8", errors="replace")
        return error.code, response_body


def app_spec(name):
    return {
        "apiVersion": "v1",
        "kind": "App",
        "metadata": {"name": name, "labels": {"test": "dashboard-integration"}},
        "spec": {
            "type": "http",
            "image": "nginx:alpine",
            "ports": [{"containerPort": 8080, "protocol": "HTTP"}],
            "resources": {"cpu": "100m", "memory": "128Mi"},
            "environment": [],
        },
        "scaling": {
            "mode": "manual",
            "minReplicas": 1,
            "maxReplicas": 2,
            "targetRPSPerReplica": 50,
        },
        "healthCheck": {"path": "/", "port": 8080},
    }


class DashboardApiIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.created_apps = []

    def tearDown(self):
        cleanup_failures = []
        for name in self.created_apps:
            status, _ = request_json("DELETE", f"/apps/{quote(name, safe='')}")
            if status not in (200, 404):
                cleanup_failures.append(f"DELETE /apps/{name} returned HTTP {status}")
        if cleanup_failures:
            self.fail("Test cleanup failed: " + "; ".join(cleanup_failures))

    def register(self, name):
        status, body = request_json("POST", "/apps/register", app_spec(name))
        self.assertEqual(status, 200, body)
        self.created_apps.append(name)
        self.assertEqual(body["app"], name)
        return body

    def test_registration_is_readable_from_app_list_and_raw_spec(self):
        name = f"dash-it-{uuid.uuid4().hex[:10]}"
        self.register(name)

        list_status, listing = request_json("GET", "/apps")
        self.assertEqual(list_status, 200, listing)
        record = next(item for item in listing["apps"] if item["name"] == name)
        self.assertEqual(record["status"], "stopped")

        raw_status, raw = request_json("GET", f"/apps/{quote(name, safe='')}/raw")
        self.assertEqual(raw_status, 200, raw)
        self.assertEqual(raw["name"], name)
        self.assertEqual(raw["raw"]["image"], "nginx:alpine")

    def test_invalid_registration_is_rejected_without_creating_an_app(self):
        name = f"dash-invalid-{uuid.uuid4().hex[:10]}"
        status, error = request_json(
            "POST",
            "/apps/register",
            {"apiVersion": "v1", "kind": "App", "metadata": {"name": name}},
        )
        self.assertEqual(status, 422, error)

        list_status, listing = request_json("GET", "/apps")
        self.assertEqual(list_status, 200, listing)
        self.assertNotIn(name, {item["name"] for item in listing["apps"]})

    def test_delete_removes_one_persisted_app_and_preserves_another(self):
        first = f"dash-del-{uuid.uuid4().hex[:10]}"
        second = f"dash-keep-{uuid.uuid4().hex[:10]}"
        self.register(first)
        self.register(second)

        delete_status, deleted = request_json("DELETE", f"/apps/{quote(first, safe='')}")
        self.assertEqual(delete_status, 200, deleted)
        self.created_apps.remove(first)

        list_status, listing = request_json("GET", "/apps")
        self.assertEqual(list_status, 200, listing)
        remaining_names = {item["name"] for item in listing["apps"]}
        self.assertNotIn(first, remaining_names)
        self.assertIn(second, remaining_names)


if __name__ == "__main__":
    unittest.main()
