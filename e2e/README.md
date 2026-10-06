# Dashboard browser tests

These Playwright tests exercise the real dashboard HTML, its navigation and
forms in a browser. API responses are intercepted in the browser tests so the
tests do not create, start, or delete applications in any controller or
database. The dashboard and Classic API Docs pages themselves are served by
the running controller.

Start the controller using the project's normal development setup, then run
the tests from this directory:

```powershell
$env:ORCHESTRY_BASE_URL = "http://127.0.0.1:8000"
npm install
npx playwright install chromium
npm test
```

If `ORCHESTRY_BASE_URL` is not set, the test configuration uses
`http://127.0.0.1:8765`. Browser tests cover dashboard/docs switching,
registration request construction, app list read-back and lifecycle requests,
diagnostic views, readable API errors, keyboard navigation, and a narrow
viewport. Because the APIs are intercepted, actual database persistence and
controller business-operation integration must be validated separately.

## Live API and database integration

The separate live integration tests use a disposable PostgreSQL database and
nginx service from `test/dashboard-compose.override.yml`; they do not connect
to the regular `orchestry` database or its containers. Start the isolated
services using the dedicated project name:

```powershell
docker compose -p orchestry-dashboard-e2e -f .\test\dashboard-compose.override.yml up -d --wait
```

Start the controller from the repository root with the test-only connection
settings, and set `ORCHESTRY_NGINX_CONF_DIR` to a new temporary directory:

```powershell
$env:ORCHESTRY_HOST = "127.0.0.1"
$env:ORCHESTRY_PORT = "8765"
$env:POSTGRES_PRIMARY_HOST = "127.0.0.1"
$env:POSTGRES_PRIMARY_PORT = "55432"
$env:POSTGRES_REPLICA_HOST = "127.0.0.1"
$env:POSTGRES_REPLICA_PORT = "55432"
$env:POSTGRES_DB = "orchestry_dashboard_test"
$env:POSTGRES_USER = "orchestry_dashboard_test"
$env:POSTGRES_PASSWORD = "dashboard_test_only"
$env:CLUSTER_NODE_ID = "dashboard-e2e-controller"
$env:CLUSTER_HOSTNAME = "127.0.0.1"
$env:ORCHESTRY_NGINX_CONTAINER = "orchestry-dashboard-e2e-nginx"
$env:ORCHESTRY_NGINX_CONF_DIR = "$env:TEMP\Orchestry-dashboard-e2e\nginx"
New-Item -ItemType Directory -Force -Path $env:ORCHESTRY_NGINX_CONF_DIR
& .\.venv\Scripts\python.exe -m uvicorn controller.api:app --host 127.0.0.1 --port 8765
```

In another terminal, run real HTTP/database tests and the live dashboard
browser journey:

```powershell
$env:ORCHESTRY_BASE_URL = "http://127.0.0.1:8765"
.\.venv\Scripts\python.exe -m unittest tests.test_dashboard_api_integration -v
Set-Location .\e2e
npm run test:integration
```

The integration tests use uniquely named records and delete them during
cleanup. Stop the controller, then remove only the isolated test project and
its disposable database volume:

```powershell
docker compose -p orchestry-dashboard-e2e -f .\test\dashboard-compose.override.yml down -v --remove-orphans
```
