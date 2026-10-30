# Implementation Plan: Switchable Orchestry Dashboard and Classic API Docs

**Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

## Summary

Add a plain-language Orchestry dashboard alongside the existing FastAPI-generated Swagger UI. The dashboard will be served by the existing controller process, call the same root-relative REST API, and expose all 17 source-backed user-facing operations. A separate Classic API Docs wrapper will embed the unchanged `/docs` page and provide a return link to the dashboard; direct access to `/docs` remains unchanged. No backend business logic or stored data model is to be duplicated or redesigned.

## Technical Context

**Language/Version**: Existing controller is Python; `pyproject.toml` declares Python >=3.8, while the controller Dockerfile uses Python 3.13. The current runtime environment and declared floor have a known syntax mismatch documented in architecture research; this feature must not broaden that compatibility issue.
**Primary Dependencies**: FastAPI 0.115.5, Starlette 0.41.3, Pydantic 2.10.3, Uvicorn 0.32.1 (versions from `requirements.txt`). No frontend build/package manifest exists. Use static HTML, CSS, and browser JavaScript served by FastAPI for this additive UI; avoid a second application server or production-time Node dependency.
**Storage**: Existing PostgreSQL-backed state remains authoritative for applications, instances, events, scaling history, and cluster information. Dashboard state is read/written through existing API routes; no new persistence schema is planned.
**Testing**: Python FastAPI API/integration tests for static routes and API contract mapping, plus Playwright browser E2E against the running application. No existing unit/E2E test suite was found; only `test/load_test.sh` and two manual-server configuration files were found. Docker daemon and Node.js are available in the analysis environment; Playwright installation/browser cache still requires an explicit validation attempt.
**Target Platform**: Existing controller process and deployment (Docker Compose/controller Dockerfile); same origin as REST API and Swagger.
**Performance Goals**: Dashboard shell/static assets should load without waiting for all API calls; independent status panels should render as their own requests resolve. No numerical production performance target is specified.
**Constraints**:
- Preserve the exact method/path/payload/response contracts for existing API routes and keep `/docs`, `/redoc`, and `/openapi.json` available.
- Source declares 19 API operations: 17 user-facing operations plus `GET /lb-health` and `GET /health`. The live OpenAPI schema could not be inspected because the local API was unreachable; implementation starts by reconciling the current source mapping with the live `/openapi.json`.
- No browser client exists in source. Static assets must be included in the existing Docker image (`configs/Dockerfile.controller` currently copies the repository) and served without mounting a catch-all path over API/docs routes.
- The working tree already contains uncommitted changes in `controller/api.py` (OpenAPI tags, an event-query keyword adjustment, cluster-health tag, and health probe metadata) and other files. Preserve and integrate those user changes; do not overwrite or revert them.
- API routes do not declare user authentication. The dashboard must not imply user identity/access control or add an auth bypass. Existing leader checks and actual HTTP/API errors must be respected.
- The existing app specification documentation is the source for field explanations; only present form fields supported by the registration contract.

## Constitution Check

No project `constitution.md` was found during preparation.

| Principle / constraint | Result | Evidence |
|---|---|---|
| Preserve existing API behavior and developer workflow | PASS | Existing routes are frozen in `artifacts/wire_contracts.yaml`; `/docs` remains directly accessible. |
| Add the smallest runtime-reachable implementation | PASS | New static UI assets and minimal FastAPI page/static wiring; no replacement backend or duplicate business logic. |
| Do not invent data or unsupported features | PASS | Each panel maps to observed fields and the 17 known operations; no mock-only CPU gauges or unsupported restart action. |
| Be explicit about unavailable evidence | PASS | Live OpenAPI is unavailable in preparation; startup parity verification is a blocking first step. |
| Project constitution | NOT AVAILABLE | No constitution file exists in the workspace. |

## Applied Guidelines

- No applicable language/framework conversion guideline exists for this additive FastAPI + static-browser UI work. The available guidelines cover Struts-to-Spring and Spring Boot scaffolding and do not apply.
- Follow the existing FastAPI route and response patterns. Avoid changing route contracts or business logic as part of UI work.
- Follow accessible web-form conventions: persistent labels, keyboard operation, focus visibility, readable contrast, action confirmation, and explicit loading/error/empty states.

## Operation-to-UI Parity

The New Dashboard exposes all 17 user-facing operations in `spec.md` as readable page views or actions. They need not become 17 top-level navigation tabs; they must each remain discoverable and usable. The Classic API Docs wrapper embeds the existing `/docs` UI, preserving its complete operation list and raw request/response schemas.

| # | API operation | Method/path | Dashboard view/action |
|---|---|---|---|
| 1 | Register application | `POST /apps/register` | Guided creation wizard |
| 2 | Start application | `POST /apps/{name}/up` | App row/details action |
| 3 | Stop application | `POST /apps/{name}/down` | App row/details action with confirmation |
| 4 | Delete application | `DELETE /apps/{name}` | App details action with confirmation |
| 5 | Get application status | `GET /apps/{name}/status` | Details/status refresh |
| 6 | Scale application | `POST /apps/{name}/scale` | Replica control |
| 7 | Set scaling policy | `POST /apps/{name}/policy` | Scaling configuration |
| 8 | List applications | `GET /apps` | App list and overview counts |
| 9 | Get raw application specification | `GET /apps/{name}/raw` | Advanced configuration panel |
| 10 | Get application logs | `GET /apps/{name}/logs` | Logs view with line-count selection |
| 11 | Get application metrics | `GET /apps/{name}/metrics` | Metrics and scaling-history view |
| 12 | Simulate application metrics | `POST /apps/{name}/simulateMetrics` | Advanced testing form |
| 13 | Get system metrics | `GET /metrics` | System/cluster overview |
| 14 | Get recent events | `GET /events` | Event/activity view with filters |
| 15 | Get cluster status | `GET /cluster/status` | Cluster status panel |
| 16 | Get cluster leader | `GET /cluster/leader` | Leader panel |
| 17 | Cluster health | `GET /cluster/health` | Health banner and cluster page |

## Implementation Steps

### Phase 1: Foundational parity and serving boundary

#### Step 1.1: Confirm the documented operation baseline
- **Requirements**: REQ-002, REQ-004, REQ-014
- **Design inputs**: `spec.md` operation inventory; `artifacts/wire_contracts.yaml`; `artifacts/units/controller-api-surface/bindings.yaml`
- **Description**: Start the existing controller using the project workflow, fetch `/openapi.json`, and compare method/path operations to the source-backed 17+2 inventory. Record any difference and update the mapping before dashboard wiring. Preserve existing uncommitted changes in `controller/api.py`; do not normalize or undo unrelated diffs.

#### Step 1.2: Add explicit same-origin dashboard and Classic Docs entry routes
- **Requirements**: REQ-001, REQ-002, REQ-003, REQ-014
- **Design inputs**: `artifacts/migration_boundary.yaml`; `artifacts/seams.yaml`; `artifacts/wire_contracts.yaml`
- **Description**: Add narrow explicit routes for `/`, `/dashboard`, `/classic-api-docs`, and a dashboard-assets prefix in `controller/api.py`. Serve dashboard HTML and assets without mounting a catch-all at `/` that could shadow API routes. The Classic API Docs page supplies a top navigation bar and embeds the unchanged `/docs` UI; do not replace the generated OpenAPI schema or change existing REST operations.

### Phase 2: Switchable navigation and shared UI shell

#### Step 2.1: Create the responsive New Dashboard shell and navigation
- **Requirements**: REQ-001, REQ-003, REQ-012
- **Design inputs**: User-provided Orchestry dashboard reference image; `artifacts/project-structure.md` (no existing frontend); `artifacts/tech-stack.md`
- **Description**: Create `controller/dashboard/index.html`, `controller/dashboard/styles.css`, and `controller/dashboard/app.js`. Implement an Orchestry-branded, responsive sidebar/top navigation with Dashboard, Applications, Cluster, Metrics, Settings/advanced operations, and API Docs entry points. Include a visible Classic API Docs switch and clear keyboard/focus behavior. Do not imply that navigation tabs alone correspond to the 17 API operations.

#### Step 2.2: Create the Classic API Docs wrapper with return navigation
- **Requirements**: REQ-002, REQ-003, REQ-004, REQ-014
- **Design inputs**: `artifacts/wire_contracts.yaml` Swagger UI contract; `artifacts/seams.yaml` frozen docs-side rule
- **Description**: Create `controller/dashboard/classic-api-docs.html` and any required wrapper styles. Provide a visible New Dashboard link and an iframe or equivalent same-origin presentation of `/docs`; preserve a direct route to the unwrapped `/docs` page and verify all OpenAPI operations remain visible in the embedded API explorer.

#### Step 2.3: Implement a centralized browser API client and reusable UI states
- **Requirements**: REQ-004, REQ-005, REQ-009, REQ-011, REQ-013
- **Design inputs**: `artifacts/wire_contracts.yaml`; `artifacts/units/controller-api-surface/behavior.yaml`
- **Description**: In `controller/dashboard/app.js`, centralize same-origin fetch calls, URL-encode app names and query values, send JSON only where required, parse FastAPI error bodies without discarding status/headers, and expose loading, empty, success, and error states. Do not display stale responses as current success; preserve leader-unavailable information and field-level validation where available.

### Phase 3: P1 operational dashboard and operation parity

#### Step 3.1: Build application list and dashboard summary
- **Requirements**: REQ-005, REQ-007
- **Design inputs**: `artifacts/wire_contracts.yaml` (`GET /apps`, `GET /metrics`); `artifacts/data-model.md`
- **Description**: Render app name, image/spec summary only when returned, status, replicas/ready replicas, and system/application counts from `GET /apps` and `GET /metrics`. Include empty/loading/failure states and navigation from each row to the app detail view.

#### Step 3.2: Build cluster overview and event views
- **Requirements**: REQ-005, REQ-008, REQ-009
- **Design inputs**: `artifacts/wire_contracts.yaml` (`/cluster/status`, `/cluster/leader`, `/cluster/health`, `/metrics`, `/events`); `artifacts/units/controller-api-surface/behavior.yaml`
- **Description**: Add a cluster overview that separately loads health, status, leader, and system metrics so a failed cluster-only call does not falsely mark unrelated panels as healthy or unavailable. Add event list/filter controls backed by `GET /events?app=&limit=`. Render documented disabled-clustering, not-leader, and unavailable states in understandable wording without changing status semantics.

#### Step 3.3: Implement application lifecycle and scaling controls
- **Requirements**: REQ-007, REQ-009, REQ-010
- **Design inputs**: `artifacts/wire_contracts.yaml` for register, start, stop, delete, status, scale, and policy; `artifacts/units/controller-api-surface/behavior.yaml` side effects and error branches
- **Description**: Wire start, stop, delete, status refresh, replica scaling, and policy updates to their exact existing paths and request bodies in `controller/dashboard/app.js`. Provide clear scale/policy forms, confirm stop/delete, prevent accidental double submission, and display actual operation results and API errors. Refresh app state from the API after successful mutations.

### Phase 4: P2 guided registration and app diagnostics

#### Step 4.1: Build a guided application registration wizard
- **Requirements**: REQ-006, REQ-009, REQ-012, REQ-013
- **Design inputs**: `docs/user-guide/app-spec.md`; `controller/utils/models.py`; `artifacts/wire_contracts.yaml` registration contract
- **Description**: Implement Basic Info, Container, Scaling, Health Check, and Review steps in `controller/dashboard/index.html` and `controller/dashboard/app.js`. Validate required values and numeric boundaries in the UI without claiming this replaces server validation; submit the exact `AppSpec` JSON accepted at `POST /apps/register`. Display a review summary and optional generated JSON before submit; refresh app list following confirmed success.

#### Step 4.2: Build app details, raw configuration, logs, and metrics
- **Requirements**: REQ-007, REQ-009, REQ-011, REQ-013
- **Design inputs**: `artifacts/wire_contracts.yaml` for status/raw/logs/metrics; `artifacts/data-model.md`
- **Description**: Add app detail sections for status/replicas, raw configuration, logs (`lines` parameter), and metrics/scaling history. Format values as readable text/tables while preserving a raw JSON option. Handle empty logs, stopped apps, missing apps, and failed metric retrieval according to actual API outcomes.

#### Step 4.3: Expose advanced simulated-metrics operation
- **Requirements**: REQ-004, REQ-007, REQ-009, REQ-011, REQ-013
- **Design inputs**: `artifacts/wire_contracts.yaml` `POST /apps/{name}/simulateMetrics`; `controller/utils/models.py`
- **Description**: Add an explicitly labeled advanced/testing section with fields from `SimulatedMetricsRequest` and clear explanations that submitted values are simulated. Send camel-case request keys, preserve `evaluate` behavior, and show the response's evaluation/action (including no-action and error outcomes) without confusing simulated measurements with observed metrics.

### Phase 5: Verification, accessibility, and user documentation

#### Step 5.1: Add API contract and static-serving tests
- **Requirements**: REQ-001, REQ-002, REQ-004, REQ-007, REQ-008, REQ-009, REQ-014
- **Design inputs**: `artifacts/wire_contracts.yaml`; operation inventory in this plan/spec
- **Description**: Add tests under `tests/` for all UI routes/assets, dashboard request method/path/body/query parity for the 17 operations, and Classic docs route availability. Use mocked manager/state boundaries for deterministic route behavior; do not claim independent HTTP operations exist where the route is a dashboard view or grouped action. Test 503/422/error display handling against actual API response shapes.

#### Step 5.2: Add Playwright browser journeys and responsive/accessibility checks
- **Requirements**: REQ-001, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014
- **Design inputs**: `spec.md` acceptance scenarios and runtime-validation strategy below
- **Description**: Add Playwright tests in `e2e/` covering interface switching (including return link), dashboard load/list/cluster overview, guided register and verify via list, lifecycle/scale operations and confirmation, and advanced/logs/metrics views. Use a disposable unique test app/image and guaranteed cleanup for full-stack runs; use controlled API responses only for isolated UI error/edge cases. Run keyboard and narrow viewport checks; capture test exit codes and outcomes.

#### Step 5.3: Document dashboard navigation and operation coverage
- **Requirements**: REQ-001, REQ-002, REQ-004, REQ-006, REQ-011, REQ-014
- **Design inputs**: `spec.md` and final verified operation inventory
- **Description**: Update `docs/index.md`, `docs/user-guide/quick-start.md`, and `docs/user-guide/api-reference.md` with dashboard and Classic API Docs URLs, switch behavior, registration guidance, advanced-operation location, and an accurate API path inventory. Do not change incorrect API examples unless verified against the live OpenAPI/source during Step 1.1.

## Project Structure

```text
controller/
  api.py                         # Add explicit page and dashboard-asset serving routes; keep REST handlers/docs intact
  dashboard/
    index.html                   # New Dashboard and guided application wizard shell
    classic-api-docs.html        # Switchable wrapper for the unchanged /docs explorer
    styles.css                   # Responsive accessible dashboard and wrapper styling
    app.js                       # Same-origin API client, routing, views, forms, and states
tests/
  test_dashboard_routes.py       # Static page and API contract wiring tests
  test_dashboard_operations.py   # Mapping and API error/result behavior tests
e2e/
  dashboard-navigation.spec.js   # Dashboard/classic-doc switching and cluster overview
  application-management.spec.js # Registration, list, lifecycle, scale, and cleanup
  application-diagnostics.spec.js# Raw spec, logs, metrics, events, and simulation views
docs/
  index.md                       # Entry point guidance
  user-guide/
    quick-start.md               # UI routes and beginner setup
    api-reference.md             # Verified operation/path reference
.github/modernize/rearchitecture/dashboard-ui/
  spec.md
  requirements-checklist.md
  plan.md
  checkpoints/
    spec-to-plan.yaml
    plan-to-tasks.yaml
```

## Testing Strategy

- **appType**: Mixed (FastAPI REST API plus browser-rendered static dashboard).
- **Critical user journeys**:
  1. Open New Dashboard → switch to Classic API Docs → inspect API operations → return to dashboard.
  2. Register a uniquely named app in the wizard → verify it in the app list/details → remove test app during cleanup.
  3. Read cluster health/status/leader and system metrics/events with independently rendered request/error states.
  4. Start/stop/scale an app and observe refreshed API-backed status, including confirmation and leader/error paths.
  5. Read raw spec/logs/app metrics and use simulated metrics with the advanced labeling clearly distinguished.
- **primaryValidationStack**: FastAPI integration tests using the project Python test runner and real response/request contracts; Playwright with headless Chromium against a running controller/Compose environment for UI journeys and all 17 API mappings. Keep a separate deterministic browser suite with API routing only for unavailable/error edge states, not as a replacement for live integration.
- **fallbackMatrix**:
  - `infra-tier`: Docker Compose with PostgreSQL, Nginx, controller cluster, and isolated disposable app image → if Docker specifically becomes unavailable, FastAPI `TestClient` with mocked manager/state-store boundaries for API integration only. Prerequisite: functional Docker daemon. Gap: no full cluster/container lifecycle or PostgreSQL persistence validation.
  - `browser-tier`: Playwright headless Chromium against the running local app → if Node/browser installation specifically fails after a recorded attempt, use Python integration tests for route and response behavior. Prerequisite: Node.js and Playwright Chromium. Gap: browser rendering, real navigation, responsiveness, keyboard focus, and iframe interaction remain unverified; escalate rather than represent as complete.
- **Environment requirements**: Python environment and project requirements; functional Docker daemon for Compose/full lifecycle tests; Node.js plus pinned Playwright test package and Chromium for browser E2E. Docker and browser tiers are independent. Node.js is available and Docker was available during planning; Playwright installation has not yet been verified.
- **knownGaps**: live `/openapi.json` could not be fetched during planning; verify at implementation start. No existing automated unit or E2E test suite/canonical test command was found. The API has no user-authentication contract; no authentication-failure scenario will be invented. API error branches, including HTTP 503 leader behavior and FastAPI validation behavior, are tested instead.
- **Test data strategy**: Use a unique UUID suffix for every test application, and a known lightweight disposable image for lifecycle tests. Run full-stack validation under a dedicated Compose project with isolated ports, network, volumes, and container names; never use or clean up a developer's existing Orchestry stack or data. Delete created test apps and containers in `finally`/fixture teardown, even on assertion failure. Do not assume pre-existing app or cluster records.
- **Acceptance criteria**:
  - All 17 operation paths/methods are each mapped to an actionable or readable dashboard view and verified against API calls.
  - `/docs`, `/redoc`, `/openapi.json`, `/health`, and `/lb-health` remain available; Classic API Docs wrapper can switch back.
  - Registration produces a valid exact AppSpec request; the API confirms success and list readback shows the app.
  - State-changing operations display only the API-confirmed outcome and refresh relevant state.
  - Playwright journeys pass with exit code 0; all resources created by tests are cleaned.
  - Keyboard access, focus visibility, readable labels, confirmation steps, and narrow viewport layout are checked in a real browser.
- **Validation review expectations**: Confirm direct `/docs` behavior and OpenAPI method/path parity before and after; verify no API business behavior changed; review each dashboard mapping to the 17-operation inventory; report Docker, Node, Playwright installation/browser availability independently; verify browser tests ran if browser prerequisites succeed; inspect test exit codes, failures, cleanup, and any deviations.
- **Unit/integration test infrastructure**:
  - External dependencies: use a dedicated Compose project with PostgreSQL and controller/Nginx services for full flow tests; use an isolated disposable container image for app lifecycle flows. Use in-process controlled dependencies for focused API error handling, and Playwright API routing only for UI error-state cases. Ensure project-specific names, ports, network, and volumes prevent collision with the developer's running Orchestry services.
  - Test base: add shared Python fixtures to start/configure FastAPI test app and replace lifecycle manager/state adapters safely; add a shared Playwright fixture to launch page, wait for dashboard readiness, and clean UUID test apps.
  - Per-module startup skeletons: add one Python test that verifies startup/page routes and one browser smoke test that verifies dashboard entry and Classic Docs navigation; feature tests complete them in implementation.
  - Test execution rule: every implementation task runs the smallest relevant Python/browser checks and reports pass/fail/skip counts. Browser task must attempt Playwright install when Node is available; Docker unavailability never justifies skipping browser E2E.
- **Legacy Test Assets**:
  - `legacyTestAssets`: `test/load_test.sh`, `test/my-server.yml`, and `test/my-manual-server.yml`; these are load/manual-server assets, not browser E2E coverage.
  - `source`: discovered.
  - `migrationDecision`: reuse for existing load/manual server purpose; add new API and Playwright suites for dashboard journeys.
  - `migrationRationale`: no legacy automated browser tests or canonical test command were discovered.

## Complexity Tracking

No constitution violations or nonessential architectural layers are proposed.

## Implementation Tasks

### Phase 1: Foundation and contract parity

- [x] T001 [Plan:1.1] Start the existing controller and compare live `/openapi.json` method/path inventory with the 17 user-facing operations plus `/lb-health` and `/health`; record any observed mismatch in the plan/spec before dashboard wiring. Live schema returned 19 operations and matched the source inventory.
- [x] T002 [Plan:1.2] Add explicit FastAPI handlers and static asset serving for `/`, `/dashboard`, `/classic-api-docs`, and `/dashboard-assets` in `controller/api.py`, preserving the existing uncommitted edits and all current API/docs routes.

### Phase 2: Switch navigation and UI foundation

- [x] T003 [P] [US1] [Plan:2.1] Create responsive accessible dashboard shell and navigation in `controller/dashboard/index.html` and `controller/dashboard/styles.css`, including the Dashboard, Applications, Cluster, Monitoring/Advanced, and API Docs destinations.
- [x] T004 [US1] [Plan:2.2] Create the Classic API Docs wrapper in `controller/dashboard/classic-api-docs.html` with a visible return link and same-origin embedding of `/docs`.
- [x] T005 [US1] [Plan:2.3] Implement centralized same-origin API request helpers, route/query encoding, JSON handling, status/error translation, loading/empty/success states in `controller/dashboard/app.js`.

### Phase 3: Core dashboard and all standard operations

- [x] T006 [US2] [US3] [Plan:3.1,3.2] Build application list, app status summary, system metrics, cluster health/status/leader panels, and recent events view in `controller/dashboard/app.js` using their existing API paths.
- [x] T007 [US3] [Plan:3.3] Wire application start, stop, delete, status refresh, scaling, and scaling-policy controls to exact paths/payloads in `controller/dashboard/app.js`, including confirmation and post-action refresh behavior.

### Phase 4: Guided creation and diagnostics

- [x] T008 [US4] [Plan:4.1] Implement the Basic Info, Container, Scaling, Health Check, and Review registration wizard in `controller/dashboard/index.html` and `controller/dashboard/app.js`, matching `AppSpec` and server validation.
- [x] T009 [US5] [Plan:4.2] Add application detail, raw specification, log, and metrics/scaling-history sections in `controller/dashboard/app.js`, preserving raw payload access and actual API outcomes.
- [x] T010 [US3] [Plan:4.3] Add clearly labeled advanced simulated-metrics form and response view for `POST /apps/{name}/simulateMetrics` in `controller/dashboard/index.html` and `controller/dashboard/app.js`.

### Phase 5: Test, accessibility, and docs

- [x] T011 [P] [Plan:5.1] Add Python tests for dashboard page/assets and verified API route/payload mappings in `tests/test_dashboard_routes.py` and `tests/test_dashboard_operations.py`. 10 tests pass.
- [x] T012 [P] [Plan:5.2] Add an isolated Compose test override in `test/dashboard-compose.override.yml` and Playwright navigation, application management, diagnostics, failure-state, keyboard, and responsive journeys in `e2e/dashboard-navigation.spec.js`, `e2e/application-management.spec.js`, and `e2e/application-diagnostics.spec.js`; use a unique Compose project and never target the developer's active data. Added separate live-backend Playwright coverage in `e2e/application-live-backend.integration.spec.js`.
- [x] T013 [Plan:5.1,5.2] Run Python integration tests and the independent Playwright/browser and Docker-backed validation tiers; verify cleanup and document exact exit codes and gaps. The isolated PostgreSQL-backed API tests and live-browser journey passed; the primary project stack was not modified.
- [x] T014 [Plan:5.3] Update `docs/index.md`, `docs/user-guide/quick-start.md`, and `docs/user-guide/api-reference.md` with the two UI routes, switching behavior, and verified operation inventory.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|--------|-------------|------------|------------------------|
| REQ-001 | Provide New Dashboard and visible Classic API Docs switch | 1.2, 2.1, 2.2 | `controller/api.py`, `controller/dashboard/index.html`, `controller/dashboard/classic-api-docs.html`, `e2e/dashboard-navigation.spec.js` |
| REQ-002 | Preserve Classic API Docs and existing API routes/contracts | 1.1, 1.2, 2.2, 5.1 | `controller/api.py`, `tests/test_dashboard_routes.py`, `e2e/dashboard-navigation.spec.js` |
| REQ-003 | Provide visible return navigation from Classic Docs | 1.2, 2.1, 2.2 | `controller/dashboard/classic-api-docs.html`, `e2e/dashboard-navigation.spec.js` |
| REQ-004 | Expose all 17 documented operations in dashboard and reconcile live schema | 1.1, 2.3, 3.3, 4.3, 5.1, 5.2 | `controller/dashboard/app.js`, `tests/test_dashboard_operations.py`, `e2e/application-management.spec.js`, `e2e/application-diagnostics.spec.js` |
| REQ-005 | Show app list/status with readable data states | 2.3, 3.1, 3.2 | `controller/dashboard/app.js`, `e2e/dashboard-navigation.spec.js` |
| REQ-006 | Guided app registration with review and validation | 4.1 | `controller/dashboard/index.html`, `controller/dashboard/app.js`, `e2e/application-management.spec.js` |
| REQ-007 | Provide app lifecycle, scaling, details, diagnostics, and simulation operations | 3.1, 3.3, 4.2, 4.3 | `controller/dashboard/app.js`, `e2e/application-management.spec.js`, `e2e/application-diagnostics.spec.js` |
| REQ-008 | Provide global metrics, events, cluster state/leader/health | 3.2 | `controller/dashboard/app.js`, `e2e/dashboard-navigation.spec.js` |
| REQ-009 | Preserve exact request behavior and display true API outcomes | 2.3, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2 | `controller/dashboard/app.js`, Python API mapping tests, Playwright error-state tests |
| REQ-010 | Confirm disruptive actions and label them clearly | 3.3 | `controller/dashboard/app.js`, `e2e/application-management.spec.js` |
| REQ-011 | Keep technical/testing functions reachable with explanations | 2.1, 2.3, 4.2, 4.3, 5.3 | `controller/dashboard/index.html`, `controller/dashboard/app.js`, `docs/user-guide/quick-start.md` |
| REQ-012 | Responsive and keyboard-accessible UI | 2.1, 4.1, 5.2 | `controller/dashboard/index.html`, `controller/dashboard/styles.css`, Playwright keyboard/viewport journeys |
| REQ-013 | Display only API-supported information | 2.3, 4.1, 4.2, 4.3 | `controller/dashboard/app.js`, API contract tests |
| REQ-014 | Keep technical probes and any additional live OpenAPI endpoints in Classic Docs | 1.1, 1.2, 2.2, 5.1, 5.3 | `/docs`, `/openapi.json`, `controller/dashboard/classic-api-docs.html`, parity test |
