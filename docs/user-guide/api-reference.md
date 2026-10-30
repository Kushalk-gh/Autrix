# REST API Reference

Orchestry provides a REST API for managing applications and viewing controller
and cluster information. The controller also serves a guided [New Dashboard](http://localhost:8000/dashboard)
and the developer-facing [Classic API Docs](http://localhost:8000/classic-api-docs).

## Base URL

By default, the controller listens at:

```text
http://localhost:8000
```

Use the host and port configured for your controller if they differ.

## Interactive API documentation

The live OpenAPI schema is available at `/openapi.json`. FastAPI's Swagger UI
at `/docs` is the authoritative, current reference for each operation's
parameters, request schema, response schema, and validation details. The
Classic API Docs page at `/classic-api-docs` embeds that same Swagger UI and
provides a link back to the beginner-friendly dashboard. The original `/docs`
URL remains directly available.

## Application operations

| Purpose | Method and path | What it does |
|---|---|---|
| Register an application | `POST /apps/register` | Saves an application specification. |
| Start an application | `POST /apps/{name}/up` | Starts the named application. |
| Stop an application | `POST /apps/{name}/down` | Stops the named application's instances. |
| Delete an application | `DELETE /apps/{name}` | Removes the named application. |
| Check application status | `GET /apps/{name}/status` | Returns the application's status and instance information. |
| Change instance count | `POST /apps/{name}/scale` | Sets a manual replica count; send `{"replicas": 2}` as JSON. The allowed count is 0–100. |
| Update scaling policy | `POST /apps/{name}/policy` | Sets automatic-scaling policy values in a `policy` JSON object. |
| List applications | `GET /apps` | Returns the registered applications and their current status. |
| Read application specification | `GET /apps/{name}/raw` | Returns submitted and parsed specification data. |
| Read application logs | `GET /apps/{name}/logs` | Returns logs for a running application. Optional query parameter: `lines` (defaults to 100). |
| Read application metrics | `GET /apps/{name}/metrics` | Returns metrics summary and recent scaling history. |
| Submit simulated metrics | `POST /apps/{name}/simulateMetrics` | Submits test metrics and can trigger immediate scaling evaluation. |

### Register an application

Send a JSON application specification to `POST /apps/register`. The request
must include `metadata` and `spec`; `metadata.name` identifies the application.
The server's `AppSpec` also supports optional `scaling` and `healthCheck`
objects.

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "my-web-app",
    "labels": {
      "app": "my-web-app",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [
      {
        "containerPort": 8080,
        "protocol": "HTTP"
      }
    ],
    "resources": {
      "cpu": "100m",
      "memory": "128Mi"
    },
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 5,
    "targetRPSPerReplica": 50
  },
  "healthCheck": {
    "path": "/health",
    "port": 8080
  }
}
```

The registration response uses the shape `status`, `app`, and `message`.
Use the interactive documentation for the exact response schema and any
validation requirements.

### Scale an application

Send a JSON object with the desired count:

```json
{
  "replicas": 2
}
```

### Update automatic scaling

`POST /apps/{name}/policy` accepts a `policy` object. The policy supports
`minReplicas`, `maxReplicas`, `targetRPSPerReplica`, `maxP95LatencyMs`,
`scaleOutThresholdPct`, `scaleInThresholdPct`, `windowSeconds`, and
`cooldownSeconds`. Fields not supplied use controller defaults. Refer to
`/docs` for the exact request and response schemas.

### Submit simulated metrics

This endpoint injects test values; these are not measurements from real
traffic. It may immediately trigger a scaling action when `evaluate` is true.
The request fields are `rps`, `p95LatencyMs`, `activeConnections`,
`cpuPercent`, `memoryPercent`, optional `healthyReplicas`, and `evaluate`.
Use it carefully, preferably in a test environment.

## Monitoring and cluster operations

| Purpose | Method and path | What it does |
|---|---|---|
| Read system metrics | `GET /metrics` | Returns system-wide application, instance, nginx, and health-check information. |
| Read recent events | `GET /events` | Returns events; optional query parameters are `app` and `limit` (default 100). |
| Read cluster status | `GET /cluster/status` | Returns cluster membership and status when clustering is enabled. |
| Read the current leader | `GET /cluster/leader` | Returns the elected leader when clustering is enabled. |
| Check cluster health | `GET /cluster/health` | Returns cluster-aware health, or single-node health when clustering is disabled. |

## Health probes

These controller probes are also present in OpenAPI, but are not application
management actions:

| Purpose | Method and path |
|---|---|
| Load-balancer health | `GET /lb-health` |
| Controller-node health | `GET /health` |

The current controller schema therefore contains 19 operations: 17
user-facing application, monitoring, and cluster operations, plus these two
health probes. The dashboard provides a guided experience for the 17
user-facing operations; use Classic API Docs for the full technical schema,
including both probes.

## Errors and validation

Errors are returned with the HTTP status and FastAPI response body. Request
validation failures use HTTP `422` and include a `detail` list identifying the
invalid location and reason. Application errors may use other status codes
depending on the operation. Check the response in `/docs` or the actual HTTP
response; this reference does not assume a single error object for every route.

## Choosing an interface

- **New Dashboard** (`/dashboard`): guided forms and readable status panels for
  day-to-day use.
- **Classic API Docs** (`/classic-api-docs`, or `/docs` directly): technical
  request/response schemas and interactive endpoint calls.

Both interfaces use the same controller API and application data.
