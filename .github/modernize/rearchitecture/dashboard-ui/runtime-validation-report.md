# Runtime Validation Report

**Generated**: 2026-10-04T23:53:38+05:30  
**Target**: `D:\MAJOR PROJECT\Orchestry`

## Summary

| Step | Status | Exit Code | Details |
|---|---|---:|---|
| Startup and route probes | PASS | 0 | Controller started with its normal FastAPI lifespan against isolated PostgreSQL and a dedicated nginx test container; `/health` returned 200. A separate route-only probe returned 200 for `/`, `/dashboard`, `/classic-api-docs`, both assets, `/docs`, and `/openapi.json`. |
| Python contract tests | PASS | 0 | `python -m unittest tests.test_dashboard_routes tests.test_dashboard_operations -v`: 10 passed, 0 failed. |
| Python API/database integration | PASS | 0 | `python -m unittest tests.test_dashboard_api_integration -v`: 3 passed, 0 failed; registration persisted/read back, invalid input was rejected, and deletion preserved other records. |
| Browser E2E | PASS | 0 | `npm test` in `e2e/`: 3 passed, 0 failed. |
| Live browser/API/database integration | PASS | 0 | `npm run test:integration` in `e2e/`: 1 passed, 0 failed; the dashboard registered, read, and deleted an app using the live controller and isolated database. |
| Docker-backed infrastructure | PASS | 0 | Dedicated PostgreSQL and nginx services became healthy under Compose project `orchestry-dashboard-e2e`. |

**Overall**: PASS for tested scope — dashboard/API persistence, reads, validation, deletion, and the browser interface were verified against isolated services. App start and scaling side effects were intentionally excluded to avoid launching app workloads as part of a dashboard UI test.

## Existing Compose deployment verification

The dashboard was subsequently deployed to the existing three-controller Compose stack after explicit approval to rebuild and recreate the controllers. Controllers were updated sequentially, with health and dashboard availability checked after each replacement.

| Check | Result |
|---|---|
| Controllers | All three controllers healthy after rollout. |
| Dashboard and static assets | HTTP 200 via controller ports 8000–8002 and load balancer port 8003. |
| Classic API Docs wrapper | HTTP 200; browser check confirmed the embedded Swagger UI renders and the dashboard return link is present. |
| Existing API documentation | `/docs` and `/openapi.json` return HTTP 200; 19 OpenAPI operations verified on each controller. |
| Data safety | Existing PostgreSQL services and data volumes were left in place; the temporary test Compose project was removed. |

The deployed dashboard is available at `/dashboard` (also `/`); Classic API Docs is available at `/classic-api-docs`. Direct `/docs` access remains available. Live start and scaling operations were not invoked.

## Environment and capability evidence

- Docker: AVAILABLE — Docker Engine 29.8.1; `docker info` succeeded.
- Node.js: AVAILABLE — `v22.20.0`.
- Playwright: AVAILABLE — `@playwright/test` 1.55.0 installed under `e2e/`; Chromium installation succeeded.
- Infra tier: Docker-based primary tier executed using the isolated test PostgreSQL and dedicated nginx services.
- Browser tier: Playwright primary tier executed, including a separate live-backend integration flow.

## Browser journeys

1. Dashboard -> Classic API Docs -> dashboard; confirmed Swagger UI renders inside the wrapper.
2. Mocked dashboard journey: registration payload -> app-list read-back -> lifecycle request.
3. App diagnostics -> logs/metrics/events -> server-error state -> keyboard navigation -> 390px viewport.
4. Live database-backed UI flow: guided registration -> app list -> raw configuration -> confirmed deletion -> verify the app is absent.

## Coverage boundaries

- Integration tests used a fresh, isolated database and dedicated nginx container. The pre-existing Orchestry Compose services and their data were not used.
- The existing Compose deployment was separately verified after rollout; its API data volumes were preserved.
- The single-node test cluster reported degraded/not-ready cluster status while identifying its controller as leader; app registration and write operations succeeded. Production cluster-health behavior was not evaluated.
- The current API does not declare authentication, so invalid request validation (HTTP 422) was tested rather than assuming an authentication failure contract.
- App start and scaling were not invoked against the live Docker daemon because these operations can create or change running workloads. Their UI request behavior is covered by mocked browser tests.
- The Python API integration suite does not use an application-level auth check because none is implemented by the current controller.
