# Architecture Index

Source-grounded prerequisites for planning an additive browser dashboard alongside the existing Orchestry API and Swagger UI.

**This index is not the full contract. Do not implement from this file alone; follow the artifact paths below.**

## Scope and evidence limits

- The source declares **19 HTTP operations** in `controller/api.py` (counted from the `@app.get`, `@app.post`, and `@app.delete` route decorators; see `unit_graph.yaml` and `wire_contracts.yaml`).
- `FastAPI()` is constructed without custom docs URLs, so its default `/docs`, `/redoc`, and `/openapi.json` routes are statically expected. This adds three framework-generated paths, not three source-declared route decorators.
- There is no browser-application source tree or dashboard implementation in the repository. The source-grounded UI surface is FastAPI's generated documentation UI, not a custom application. Do not infer dashboard pages, widgets, navigation, or frontend framework from these artifacts.
- Live `http://127.0.0.1:8000/docs` and `/openapi.json` probes were inaccessible (connection refused). Runtime-generated OpenAPI content, server availability, and live response examples therefore remain unverified.
- CLI commands exist but are outside this dashboard/API unit inventory; the unit artifacts cover the browser-facing FastAPI surface only.

## Implementation Guide

### Global artifacts

- `unit_graph.yaml`
  - who reads: all plan and implementation workers
  - use for: source-backed API/UI unit boundary, entrypoint, and existing source anchors
  - how to consume: filter `units` by the assigned `name`; `source_anchors` identify evidence, not rewrite targets
- `migration_boundary.yaml`
  - who reads: all plan and implementation workers
  - use for: additive scope and the existing API/docs code intended to remain untouched
  - how to consume: follow `must_rewrite`, `copy_as_is`, and `implementation_rule`; the new dashboard's concrete paths are intentionally not invented here
- `wire_contracts.yaml`
  - who reads: dashboard/API integration workers
  - use for: current HTTP methods, paths, request/response summaries, errors, and generated docs paths
  - how to consume: filter rows where `unit` matches the assigned unit; preserve the existing API and documentation surface unless design explicitly changes acceptance
- `shared_modules.yaml`
  - who reads: workers changing source shared by multiple analyzed units
  - use for: cross-unit shared code inventory
  - how to consume: filter `modules` by `used_by_units`; it is empty because the dashboard does not yet exist and the current API source is represented as one surface unit
- `cross_unit_state.yaml`
  - who reads: workers changing state shared across analyzed units
  - use for: implicit cross-unit state transfers and required runtime confirmation
  - how to consume: filter flows by `writer.unit` or `reader.unit`; no source-backed cross-unit UI/API flow was found
- `seams.yaml`
  - who reads: dashboard/API integration workers
  - use for: the user-declared additive boundary and frozen existing API/docs side
  - how to consume: filter `cut_between` for the assigned side; the dashboard side is a planned addition, not a source-discovered frontend
- `data-model.md`
  - who reads: workers displaying persisted application, instance, event, scaling, or cluster state
  - use for: existing PostgreSQL tables, fields, relationships, and API value objects
  - how to consume: treat as an inventory only; it does not authorize schema changes
- `project-structure.md`
  - who reads: planning workers
  - use for: existing project type, module/layer structure, source counts, and the absence of a browser client
- `tech-stack.md`
  - who reads: planning workers
  - use for: existing framework/runtime/dependency facts and implementation constraints; it makes no target-stack recommendation

### Unit: `controller-api-surface`

- external trigger: HTTP requests to the FastAPI application; includes the 19 source-declared operations and framework-generated documentation routes
- must read:
  - `units/controller-api-surface/behavior.yaml` — runtime-visible branches, side effects, error handling, and concurrency
  - `units/controller-api-surface/bindings.yaml` — FastAPI route/docs wiring, CORS middleware, and the absence of dashboard runtime configuration in source
  - `units/controller-api-surface/unit_decomposition.yaml` — advisory split candidates only; `commit: false`
- relevant global rows:
  - `wire_contracts.yaml` rows with `unit: controller-api-surface`
  - `shared_modules.yaml` rows whose `used_by_units` includes `controller-api-surface`
  - `cross_unit_state.yaml` flows whose writer or reader is `controller-api-surface`
  - `seams.yaml` cuts that include `controller-api-surface`
- before DONE report: artifact paths read, existing contracts and behaviors preserved, unresolved/deferred runtime details, and build/test/browser-runtime evidence
