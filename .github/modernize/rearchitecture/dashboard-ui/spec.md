# Feature Specification: Switchable Orchestry Dashboard and Classic API Docs

**Feature Branch**: `dashboard-ui`  
**Created**: 2026-10-04  
**Status**: Draft  
**Input**: User request: create a user-friendly dashboard with a switch to the existing Classic API Docs, preserving all 17 current API options in both experiences.

## Scope Baseline

- **Discovery method**: Review of the existing FastAPI route declarations and the user-provided UI reference image.
- **Total items discovered**: 19 API route declarations in the current source, including two technical health probes.
- **Items in scope**: All 17 application, monitoring, and cluster operations presented as user-facing API options, plus the two existing technical health probes must remain available in Classic API Docs.
- **Parity rule**: Before implementation, compare the running OpenAPI document at the configured docs URL with the source route inventory. The dashboard must expose every one of the 17 user-facing operations currently documented; do not silently omit an operation if the live count differs.

### Source-backed user-facing operation inventory

| # | Existing operation | Method and path | Dashboard destination |
|---|---|---|---|
| 1 | Register application | `POST /apps/register` | Guided Create Application flow |
| 2 | Start application | `POST /apps/{name}/up` | Application actions |
| 3 | Stop application | `POST /apps/{name}/down` | Application actions |
| 4 | Delete application | `DELETE /apps/{name}` | Application actions |
| 5 | Get application status | `GET /apps/{name}/status` | Application details and refresh |
| 6 | Scale application | `POST /apps/{name}/scale` | Application scaling controls |
| 7 | Set scaling policy | `POST /apps/{name}/policy` | Application scaling settings |
| 8 | List applications | `GET /apps` | Applications page and dashboard summary |
| 9 | Get raw application specification | `GET /apps/{name}/raw` | Advanced configuration |
| 10 | Get application logs | `GET /apps/{name}/logs` | Application logs |
| 11 | Get application metrics | `GET /apps/{name}/metrics` | Application metrics and scaling history |
| 12 | Simulate application metrics | `POST /apps/{name}/simulateMetrics` | Advanced testing tools |
| 13 | Get system metrics | `GET /metrics` | Dashboard and cluster resource summary |
| 14 | Get recent events | `GET /events` | Events and activity history |
| 15 | Get cluster status | `GET /cluster/status` | Cluster overview |
| 16 | Get cluster leader | `GET /cluster/leader` | Cluster overview |
| 17 | Cluster health | `GET /cluster/health` | Dashboard health indicator |

The separate `GET /lb-health` and `GET /health` probes are technical health checks, not part of the 17 user-facing operations; they must remain present in Classic API Docs.

## User Scenarios & Testing

### User Story 1 - Switch between the friendly dashboard and classic docs (Priority: P1)

As an Orchestry user, I want to switch between a plain-language dashboard and the existing technical API documentation so I can choose the interface that suits the task.

**Why this priority**: The switch is the central request and must preserve the existing developer workflow while adding a beginner-friendly entry point.

**Independent Test**: Open the dashboard, navigate to Classic API Docs, verify the current Swagger operations remain available, then return to the dashboard without changing application data.

**Acceptance Scenarios**:

1. **Given** the Orchestry web service is available, **When** a user opens its main page, **Then** the New Dashboard is presented with a visible link to Classic API Docs.
2. **Given** the user is on the dashboard, **When** they select Classic API Docs, **Then** the existing Swagger UI opens and retains all currently documented operations.
3. **Given** the user is on Classic API Docs, **When** they select New Dashboard, **Then** the dashboard opens without changing the current API behavior or stored application data.

### User Story 2 - Understand cluster and application health (Priority: P1)

As a non-technical operator, I want to see the health of the cluster and its applications in plain language so I can tell whether the system is operating normally.

**Why this priority**: A clear operational overview is the safest starting point for users who do not understand raw API responses.

**Independent Test**: With the service running, open the dashboard and compare displayed application and cluster state with the corresponding API responses; verify readable loading, empty, and failure states.

**Acceptance Scenarios**:

1. **Given** the cluster is healthy, **When** the dashboard loads, **Then** it shows a clear healthy state and available controller, leader, and application summary information supported by the API.
2. **Given** the API is unavailable or reports an error, **When** the dashboard requests operational data, **Then** it shows a comprehensible error and a retry action rather than presenting stale or success-shaped data.
3. **Given** there are no registered applications, **When** the application list is shown, **Then** it explains that no apps are registered and provides a path to register one.

### User Story 3 - Manage applications using all current operations (Priority: P1)

As an operator, I want to perform every currently documented application, monitoring, and cluster operation from clear dashboard pages and actions, so I do not lose capability when using the new interface.

**Why this priority**: The user explicitly requires the new experience to retain the existing 17 options.

**Independent Test**: For each of the 17 documented operations, identify and exercise its dashboard control or view against the same API endpoint and verify the expected result or error is displayed.

**Acceptance Scenarios**:

1. **Given** an app exists, **When** an operator opens Applications, **Then** they can list apps and access app status, start, stop, delete, scale, scaling policy, raw specification, logs, metrics, and simulated-metrics operations.
2. **Given** an operator opens monitoring or cluster views, **When** they inspect global metrics, events, cluster status, leader, or health, **Then** the dashboard presents the corresponding information in a readable format.
3. **Given** an operation changes app state, **When** the user submits it, **Then** the dashboard confirms the intended action where appropriate and reports the actual API outcome, including validation and leader-unavailable errors.
4. **Given** an operation is primarily for testing or advanced users, **When** a non-technical user opens the relevant section, **Then** the dashboard labels it as advanced and explains its effect rather than silently omitting it.

### User Story 4 - Register an application without authoring JSON (Priority: P2)

As a user unfamiliar with JSON, I want a guided application-registration form that explains each required setting and reviews my choices before submission.

**Why this priority**: App registration is a complex raw-JSON workflow in Swagger and is a key opportunity to improve usability.

**Independent Test**: Complete the guided registration form with a valid app specification, review it, submit it, and verify the application appears in the app list; test invalid and incomplete inputs.

**Acceptance Scenarios**:

1. **Given** the user starts registration, **When** they complete the basic, container, scaling, and health-check details, **Then** each field has a plain-language label and a concise explanation.
2. **Given** required values are missing or invalid, **When** the user proceeds, **Then** the form identifies the fields and explains how to correct them.
3. **Given** the user has entered valid details, **When** they reach review, **Then** the dashboard summarizes the choices and optionally shows the generated JSON before registration.
4. **Given** registration succeeds or fails, **When** the API responds, **Then** the dashboard clearly reports the result without inventing success.

### User Story 5 - Inspect application details, logs, and metrics (Priority: P2)

As an operator, I want application details and diagnostic information grouped into understandable sections so I can monitor an app without reading raw JSON or log protocols.

**Why this priority**: These views retain existing visibility while making operational data easier to interpret.

**Independent Test**: Open an app detail view and verify its status, replica counts, logs, and metrics against the respective API responses, including an error or stopped-app case.

**Acceptance Scenarios**:

1. **Given** an app is registered, **When** its details page opens, **Then** status, desired/ready replicas, configuration, events, logs, and metrics are available when supported by the API.
2. **Given** logs or metric data are unavailable, **When** the user opens that section, **Then** the page explains what is unavailable and provides a retry or relevant next action.
3. **Given** raw technical data is useful for troubleshooting, **When** the user selects an advanced details option, **Then** raw specification/API data remains accessible.

## Edge Cases

- The documented OpenAPI operation count does not match 17; implementation must reconcile the count with source and preserve all actually documented user-facing operations.
- API returns validation errors, a not-found response, or a non-leader/service-unavailable response.
- Cluster or one of its controllers is unavailable while other dashboard data remains available.
- App state changes between loading the list and submitting an action.
- Long app names, missing optional fields, zero replicas, or empty logs/metrics are returned.
- Browser refresh or direct navigation opens a dashboard subsection or Classic API Docs.
- Small screens or keyboard-only use must still provide access to navigation, forms, and destructive-action confirmations.

## Requirements

### Functional Requirements

- **REQ-001**: The service MUST provide a New Dashboard and a visible navigation option to the existing Classic API Docs.
- **REQ-002**: Classic API Docs MUST remain available at its existing docs URL with its current OpenAPI operations and request/response behavior intact.
- **REQ-003**: Users MUST be able to return from Classic API Docs to the New Dashboard using a visible navigation option.
- **REQ-004**: The New Dashboard MUST provide access to all 17 currently documented user-facing API operations, mapped to clear pages, views, or actions; verification MUST be based on the running OpenAPI definition and source routes before implementation is considered complete.
- **REQ-005**: The dashboard MUST show application list and status information using the existing API and explain empty, loading, success, and error states in plain language.
- **REQ-006**: The dashboard MUST let users register applications through a guided form that submits a specification accepted by the existing registration API.
- **REQ-007**: The dashboard MUST provide application start, stop, delete, status, scale, scaling-policy, raw-specification, logs, per-application metrics, and simulated-metrics capabilities corresponding to the existing API operations.
- **REQ-008**: The dashboard MUST provide global metrics, events, cluster status, leader, and health information corresponding to the existing API operations.
- **REQ-009**: The dashboard MUST preserve request and response semantics of the existing API and report validation and service errors honestly; it MUST NOT claim an operation succeeded unless the API confirms success.
- **REQ-010**: Destructive or disruptive actions MUST have understandable labels and a confirmation step before submission.
- **REQ-011**: Technical or testing-oriented options MUST remain reachable and be labeled with plain-language explanations; they MUST NOT be dropped to simplify the dashboard.
- **REQ-012**: The interface MUST be responsive and keyboard accessible, with clear focus states, readable contrast, and labels associated with form controls.
- **REQ-013**: The dashboard MUST use only information actually returned by the existing API; unsupported image mockup values (such as particular usage gauges or restart operations) MUST NOT be fabricated.
- **REQ-014**: Existing Classic API Docs MUST preserve access to technical health probes and any additional endpoints present in the running OpenAPI document, even if they are not among the 17 user-facing options.

### Key Entities

- **Application**: A registered app and its submitted specification, runtime status, replica counts, scaling policy, logs, metrics, and events.
- **Cluster**: The controller cluster and its health, leader, membership, and aggregate operational status.
- **API operation**: One of the currently documented actions or information views, paired with the existing HTTP method/path and its request, response, and error behavior.
- **Dashboard navigation choice**: The user's current interface selection between New Dashboard and Classic API Docs; it does not alter application or cluster state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of the 17 documented user-facing operations have a reachable dashboard view/action mapped to the existing API.
- **SC-002**: 100% of operations currently present in Classic API Docs remain available after the dashboard is introduced.
- **SC-003**: Users can move from dashboard to Classic API Docs and back in no more than two visible navigation actions from either interface.
- **SC-004**: A first-time user can complete valid app registration without manually editing JSON; invalid fields are identified before submission.
- **SC-005**: In validation, all dashboard operation flows display the real API success or failure outcome, with no false success state.
- **SC-006**: Dashboard navigation and registration remain usable at desktop and mobile viewport sizes and by keyboard alone.

## Assumptions

- The dashboard and Classic API Docs use the same Orchestry service and API; this feature does not duplicate or replace backend business logic.
- The existing Classic API Docs location remains unchanged; New Dashboard becomes the default landing experience only if that can be done without breaking existing routes.
- The requested 17 options refer to the currently documented application, monitoring, and cluster operations. Technical health probes remain in Classic API Docs.
- Authentication and authorization changes are outside the feature scope. The dashboard must not imply stronger access control than the current API provides.
- Metrics, logs, restart controls, and resource gauges are displayed only when the existing API actually supports them; gaps are documented rather than simulated.
