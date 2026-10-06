# Ten Application Examples for the Dashboard and Swagger

This guide provides **ten separate application registrations**, each with its
own copy-ready JSON and an operation procedure for that named application.
Use the Dashboard's guided forms or the same controller API through Swagger.
The examples use the API paths and request fields published by the running
controller.

## Open the two interfaces

These links assume the controller is available at `127.0.0.1:8003`:

- [New Dashboard](http://127.0.0.1:8003/dashboard#/dashboard)
- [Swagger API docs](http://127.0.0.1:8003/docs#/)

If your controller uses another address, substitute its host and port.

## Important before registering

- Each example has its own unique lowercase application name. Register each
  JSON body only once. If a name is already in use, either use the existing
  registration or change `metadata.name` and its `metadata.labels.app` value
  to a new unique name.
- All ten examples use `nginx:alpine`, which listens on container port `80`.
  This keeps the app settings valid and consistent. The different names,
  labels, scaling settings, and health-check paths make each registration
  distinct.
- Registering saves the app specification; it does **not** start the app.
  The procedure for each app includes a separate start action.
- Starting/scaling apps creates Docker containers and consumes resources.
  Start only the examples you intend to try; you do not need to run all ten
  simultaneously.
- The simulated-metrics examples set `evaluate` to `false`. These are test
  values, not real measurements. Keeping evaluation false avoids asking the
  controller to scale based on the test values.
- Stop keeps an app registered. Delete removes its registration. Both are
  optional cleanup steps; delete only an app you no longer need.

## How to enter an operation in Swagger

For a route containing `{name}`, open that operation in Swagger, choose
**Try it out**, enter the example's application name in the `name` path
parameter, fill any JSON request body shown below, and choose **Execute**.
Operations without a body should be executed with the body field empty.

## Example 1 — `demo-storefront`

### Register this application

In the Dashboard, choose **Applications** → **Create application** and use
these values: name `demo-storefront`, version `v1`, HTTP web application,
image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`, automatic scaling
with minimum `1`, maximum `3`, requests per instance `50`, max latency `250`
ms, health-check path `/`, and health-check port `80`. Review and register.

In Swagger, use **POST `/apps/register`**, then paste:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-storefront",
    "labels": {
      "app": "demo-storefront",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 3,
    "targetRPSPerReplica": 50,
    "maxP95LatencyMs": 250,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-storefront`

Follow these steps after registering. For each Swagger route, substitute the
name `demo-storefront` for `{name}`.

1. **Start:** Dashboard → **Applications** → **Start** on this app.
   Swagger: `POST /apps/demo-storefront/up`, no body.
2. **Check status:** Dashboard → select the app → **Overview**.
   Swagger: `GET /apps/demo-storefront/status`, no body.
3. **Scale to two instances:** Dashboard → **Overview** → desired instances
   `2` → **Save replica count**. Swagger: `POST /apps/demo-storefront/scale`,
   body `{"replicas": 2}`.
4. **Set its scaling policy:** Dashboard → **Advanced tools** → select this app
   and enter minimum `1`, maximum `3`, requests/instance `50`, max latency
   `250`, scale-out `80`, scale-in `30`. Swagger:
   `POST /apps/demo-storefront/policy`, body
   `{"policy":{"minReplicas":1,"maxReplicas":3,"targetRPSPerReplica":50,"maxP95LatencyMs":250,"scaleOutThresholdPct":80,"scaleInThresholdPct":30}}`.
5. **Inspect configuration:** Dashboard → app **Details** → **Configuration**.
   Swagger: `GET /apps/demo-storefront/raw`, no body.
6. **Read logs:** Dashboard → app **Details** → **Logs**.
   Swagger: `GET /apps/demo-storefront/logs?lines=100`, no body.
7. **Read app metrics:** Dashboard → app **Details** → **Metrics**.
   Swagger: `GET /apps/demo-storefront/metrics`, no body.
8. **Submit safe test metrics:** Dashboard → **Advanced tools** → select this
   app; enter RPS `10`, latency `80`, connections `3`, CPU `20`, memory `35`;
   leave healthy instances blank and uncheck evaluation. Swagger:
   `POST /apps/demo-storefront/simulateMetrics`, body
   `{"rps":10,"p95LatencyMs":80,"activeConnections":3,"cpuPercent":20,"memoryPercent":35,"evaluate":false}`.
9. **Stop (optional):** Dashboard → **Stop** and confirm.
   Swagger: `POST /apps/demo-storefront/down`, no body.
10. **Delete (optional):** Dashboard → **Delete** and confirm.
    Swagger: `DELETE /apps/demo-storefront`, no body.

## Example 2 — `demo-blog`

### Register this application

Dashboard wizard values: name `demo-blog`, version `v1`, HTTP web application,
image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`, automatic
scaling, minimum `1`, maximum `4`, requests/instance `75`, max latency `300`
ms, health path `/`, health port `80`.

Swagger operation: **POST `/apps/register`**. Request body:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-blog",
    "labels": {
      "app": "demo-blog",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 4,
    "targetRPSPerReplica": 75,
    "maxP95LatencyMs": 300,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-blog`

Use the procedure in Example 1, substituting `demo-blog` in every operation
and selecting `demo-blog` in Dashboard dropdowns. For this app, scale to `2`
with `POST /apps/demo-blog/scale` and `{"replicas":2}`. Set the policy to
minimum `1`, maximum `4`, requests/instance `75`, max latency `300`, and
thresholds `80`/`30`. For test metrics, use RPS `15`, latency `100`,
connections `5`, CPU `25`, memory `40`, and `evaluate:false`.

App-specific Swagger routes: `POST /apps/demo-blog/up`,
`GET /apps/demo-blog/status`, `POST /apps/demo-blog/scale`,
`POST /apps/demo-blog/policy`, `GET /apps/demo-blog/raw`,
`GET /apps/demo-blog/logs?lines=100`, `GET /apps/demo-blog/metrics`,
`POST /apps/demo-blog/simulateMetrics`, `POST /apps/demo-blog/down`, and
`DELETE /apps/demo-blog`. The `up`, status, raw, logs, metrics, and down
operations have no body. The policy body follows Example 1's shape with this
app's values. The simulated body is
`{"rps":15,"p95LatencyMs":100,"activeConnections":5,"cpuPercent":25,"memoryPercent":40,"evaluate":false}`.

Dashboard: start/stop from **Applications**; use this app's **Details**
sections for Overview, Configuration, Logs, and Metrics; use **Advanced
tools** for its policy and safe simulated-metrics submission.

## Example 3 — `demo-help-center`

### Register this application

Dashboard wizard values: name `demo-help-center`, version `v1`, HTTP web
application, image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`,
automatic scaling, minimum `1`, maximum `2`, requests/instance `40`, max
latency `220` ms, health path `/`, health port `80`.

Swagger operation: **POST `/apps/register`**. Request body:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-help-center",
    "labels": {
      "app": "demo-help-center",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 2,
    "targetRPSPerReplica": 40,
    "maxP95LatencyMs": 220,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-help-center`

Use Example 1's ten-step procedure, substituting `demo-help-center` for the
app name in the Dashboard and in every `{name}` path parameter. Scale to `2`
with `POST /apps/demo-help-center/scale`, body `{"replicas":2}`. Set its
policy to minimum `1`, maximum `2`, requests/instance `40`, max latency `220`,
scale thresholds `80` and `30`. Use safe simulated values RPS `8`, latency
`70`, connections `2`, CPU `15`, memory `30`, `evaluate:false`.

The app-specific Swagger operations are:

| Purpose | Method and path | Body |
|---|---|---|
| Start | `POST /apps/demo-help-center/up` | None |
| Status | `GET /apps/demo-help-center/status` | None |
| Manual scale | `POST /apps/demo-help-center/scale` | `{"replicas":2}` |
| Scaling policy | `POST /apps/demo-help-center/policy` | `{"policy":{"minReplicas":1,"maxReplicas":2,"targetRPSPerReplica":40,"maxP95LatencyMs":220,"scaleOutThresholdPct":80,"scaleInThresholdPct":30}}` |
| Configuration | `GET /apps/demo-help-center/raw` | None |
| Logs | `GET /apps/demo-help-center/logs?lines=100` | None |
| App metrics | `GET /apps/demo-help-center/metrics` | None |
| Safe simulated metrics | `POST /apps/demo-help-center/simulateMetrics` | `{"rps":8,"p95LatencyMs":70,"activeConnections":2,"cpuPercent":15,"memoryPercent":30,"evaluate":false}` |
| Stop | `POST /apps/demo-help-center/down` | None |
| Delete (optional) | `DELETE /apps/demo-help-center` | None |

Dashboard actions are available from **Applications**, this app's **Details**
tabs, and **Advanced tools** as in Example 1.

## Example 4 — `demo-campaign`

### Register this application

Dashboard wizard values: name `demo-campaign`, version `v1`, HTTP web
application, image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`,
automatic scaling, minimum `1`, maximum `5`, requests/instance `100`, max
latency `350` ms, health path `/`, health port `80`.

Swagger operation: **POST `/apps/register`**. Request body:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-campaign",
    "labels": {
      "app": "demo-campaign",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 5,
    "targetRPSPerReplica": 100,
    "maxP95LatencyMs": 350,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-campaign`

Use Example 1's procedure with `demo-campaign` as the app name. Start using
`POST /apps/demo-campaign/up`; inspect with
`GET /apps/demo-campaign/status`, `/raw`, `/logs?lines=100`, and `/metrics`
(each full path begins `/apps/demo-campaign`). Scale to `3` using
`POST /apps/demo-campaign/scale` with `{"replicas":3}`. Set policy minimum
`1`, maximum `5`, requests/instance `100`, max latency `350`, thresholds
`80`/`30`, using the Example 1 policy shape. Submit safe test metrics with
RPS `25`, latency `120`, connections `8`, CPU `30`, memory `45`, and
`evaluate:false`.

For Swagger, send the policy to `POST /apps/demo-campaign/policy` and the
test metrics to `POST /apps/demo-campaign/simulateMetrics`. Use the JSON
shapes in Example 1 with the values above.

Stop with `POST /apps/demo-campaign/down`; delete only if wanted with
`DELETE /apps/demo-campaign`. Both take no body. Dashboard: use **Start** or
**Stop** on its application row, the app's **Details** tabs, and select this
app in **Advanced tools** for scaling policy and simulated metrics.

## Example 5 — `demo-inventory`

### Register this application

Dashboard wizard values: name `demo-inventory`, version `v1`, HTTP web
application, image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`,
automatic scaling, minimum `1`, maximum `3`, requests/instance `60`, max
latency `280` ms, health path `/`, health port `80`.

Swagger operation: **POST `/apps/register`**. Request body:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-inventory",
    "labels": {
      "app": "demo-inventory",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 3,
    "targetRPSPerReplica": 60,
    "maxP95LatencyMs": 280,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-inventory`

Use Example 1's procedure with `demo-inventory` as the name for every
Dashboard selection and Swagger `name` parameter. Scale to `2` with
`POST /apps/demo-inventory/scale`, body `{"replicas":2}`. Set policy values
minimum `1`, maximum `3`, requests/instance `60`, max latency `280`,
thresholds `80`/`30`. For safe simulated values use RPS `12`, latency `90`,
connections `4`, CPU `22`, memory `38`, and `evaluate:false`.

Swagger routes for this app: `POST /apps/demo-inventory/up`,
`GET /apps/demo-inventory/status`, `POST /apps/demo-inventory/scale`,
`POST /apps/demo-inventory/policy`, `GET /apps/demo-inventory/raw`,
`GET /apps/demo-inventory/logs?lines=100`,
`GET /apps/demo-inventory/metrics`,
`POST /apps/demo-inventory/simulateMetrics`,
`POST /apps/demo-inventory/down`, and `DELETE /apps/demo-inventory`.
Use no body for start, status, reads, stop, and delete. Use the scale,
policy, and simulated-metrics values stated above for their respective bodies.
In the Dashboard use this app's **Details** tabs and select it in
**Advanced tools**.

## Example 6 — `demo-checkout`

### Register this application

Dashboard wizard values: name `demo-checkout`, version `v1`, HTTP web
application, image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`,
automatic scaling, minimum `1`, maximum `4`, requests/instance `45`, max
latency `200` ms, health path `/`, health port `80`.

Swagger operation: **POST `/apps/register`**. Request body:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-checkout",
    "labels": {
      "app": "demo-checkout",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 4,
    "targetRPSPerReplica": 45,
    "maxP95LatencyMs": 200,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-checkout`

Use Example 1's procedure, substituting `demo-checkout` throughout. Start:
`POST /apps/demo-checkout/up`. Check:
`GET /apps/demo-checkout/status`. Scale to `2`:
`POST /apps/demo-checkout/scale` with `{"replicas":2}`. Set policy minimum
`1`, maximum `4`, target RPS `45`, max latency `200`, thresholds `80`/`30`
using the policy body shape from Example 1. Use safe simulated metrics RPS `6`,
latency `60`, connections `2`, CPU `12`, memory `25`, `evaluate:false`.
Inspect `/apps/demo-checkout/raw`, `/logs?lines=100`, and `/metrics` using
GET requests with no bodies. Stop with
`POST /apps/demo-checkout/down`; optional delete:
`DELETE /apps/demo-checkout`. Both have no body.

Send policy values to `POST /apps/demo-checkout/policy` and safe sample
values to `POST /apps/demo-checkout/simulateMetrics`. Use the JSON shapes in
Example 1 with this app's values.

Dashboard: start and stop from **Applications**, inspect this app's
**Overview**, **Configuration**, **Logs**, and **Metrics**, and choose
`demo-checkout` in **Advanced tools** for scaling and simulated metrics.

## Example 7 — `demo-news`

### Register this application

Dashboard wizard values: name `demo-news`, version `v1`, HTTP web application,
image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`, automatic
scaling, minimum `1`, maximum `3`, requests/instance `80`, max latency `320`
ms, health path `/`, health port `80`.

Swagger operation: **POST `/apps/register`**. Request body:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-news",
    "labels": {
      "app": "demo-news",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 3,
    "targetRPSPerReplica": 80,
    "maxP95LatencyMs": 320,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-news`

Use Example 1's procedure with `demo-news`. Start with
`POST /apps/demo-news/up`; inspect status with
`GET /apps/demo-news/status`. Scale to `2` using
`POST /apps/demo-news/scale` and `{"replicas":2}`. Set policy minimum `1`,
maximum `3`, target RPS `80`, max latency `320`, thresholds `80`/`30`.
Simulated values: RPS `18`, latency `110`, connections `6`, CPU `27`,
memory `42`, and `evaluate:false`.

Use GET `/apps/demo-news/raw`, `/apps/demo-news/logs?lines=100`, and
`/apps/demo-news/metrics` for configuration, logs, and metrics. GET requests
need no body. Stop with `POST /apps/demo-news/down`; optionally remove it
with `DELETE /apps/demo-news`. Both need no body. The Dashboard equivalents
are the app row's **Start/Stop**, its **Details** tabs, and its selection in
**Advanced tools**.

In Swagger, send the policy to `POST /apps/demo-news/policy` and simulated
values to `POST /apps/demo-news/simulateMetrics`, using the JSON shapes in
Example 1 with the values above.

## Example 8 — `demo-status-page`

### Register this application

Dashboard wizard values: name `demo-status-page`, version `v1`, HTTP web
application, image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`,
automatic scaling, minimum `1`, maximum `2`, requests/instance `30`, max
latency `180` ms, health path `/`, health port `80`.

Swagger operation: **POST `/apps/register`**. Request body:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-status-page",
    "labels": {
      "app": "demo-status-page",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 2,
    "targetRPSPerReplica": 30,
    "maxP95LatencyMs": 180,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-status-page`

Use Example 1's ten-step procedure with `demo-status-page` in every name and
dropdown. Start it via `POST /apps/demo-status-page/up`; check
`GET /apps/demo-status-page/status`. Scale to `2` using
`POST /apps/demo-status-page/scale` with `{"replicas":2}`. Set policy
minimum `1`, maximum `2`, target RPS `30`, max latency `180`, thresholds
`80`/`30`. Safe test metrics: RPS `5`, latency `50`, connections `1`,
CPU `10`, memory `20`, `evaluate:false`.

Inspect the app using `GET /apps/demo-status-page/raw`,
`GET /apps/demo-status-page/logs?lines=100`, and
`GET /apps/demo-status-page/metrics` (no body). Stop with
`POST /apps/demo-status-page/down`. Optional permanent cleanup is
`DELETE /apps/demo-status-page`. Dashboard: use **Start/Stop** in
**Applications**, app **Details** tabs, and this app's entry in **Advanced
tools**.

In Swagger, send policy values to
`POST /apps/demo-status-page/policy` and test values to
`POST /apps/demo-status-page/simulateMetrics`, using the JSON shapes in
Example 1 with this app's values.

## Example 9 — `demo-landing`

### Register this application

Dashboard wizard values: name `demo-landing`, version `v1`, HTTP web
application, image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`,
automatic scaling, minimum `1`, maximum `4`, requests/instance `90`, max
latency `300` ms, health path `/`, health port `80`.

Swagger operation: **POST `/apps/register`**. Request body:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-landing",
    "labels": {
      "app": "demo-landing",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 4,
    "targetRPSPerReplica": 90,
    "maxP95LatencyMs": 300,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-landing`

Use Example 1's procedure with `demo-landing`. Start with
`POST /apps/demo-landing/up`, check status with
`GET /apps/demo-landing/status`, and scale to `2` using
`POST /apps/demo-landing/scale` with `{"replicas":2}`. Policy settings:
minimum `1`, maximum `4`, target RPS `90`, max latency `300`, thresholds
`80`/`30`. Simulate RPS `20`, latency `100`, connections `7`, CPU `24`,
memory `40`, with `evaluate:false`.

Read configuration, logs, and app metrics with
`GET /apps/demo-landing/raw`, `GET /apps/demo-landing/logs?lines=100`, and
`GET /apps/demo-landing/metrics`. Submit policy to
`POST /apps/demo-landing/policy` using the policy JSON shape in Example 1
with the values above. Submit simulated metrics to
`POST /apps/demo-landing/simulateMetrics` with the values above. Stop with
`POST /apps/demo-landing/down`; optionally delete with
`DELETE /apps/demo-landing`. GET/stop/delete requests have no body.

Dashboard: use this app's row **Start/Stop**, **Details** tabs, and
**Advanced tools** policy/metrics forms.

## Example 10 — `demo-docs`

### Register this application

Dashboard wizard values: name `demo-docs`, version `v1`, HTTP web application,
image `nginx:alpine`, port `80`, CPU `100m`, memory `128Mi`, automatic
scaling, minimum `1`, maximum `3`, requests/instance `55`, max latency `260`
ms, health path `/`, health port `80`.

Swagger operation: **POST `/apps/register`**. Request body:

```json
{
  "apiVersion": "v1",
  "kind": "App",
  "metadata": {
    "name": "demo-docs",
    "labels": {
      "app": "demo-docs",
      "version": "v1"
    }
  },
  "spec": {
    "type": "http",
    "image": "nginx:alpine",
    "ports": [{"containerPort": 80, "protocol": "HTTP"}],
    "resources": {"cpu": "100m", "memory": "128Mi"},
    "environment": []
  },
  "scaling": {
    "mode": "auto",
    "minReplicas": 1,
    "maxReplicas": 3,
    "targetRPSPerReplica": 55,
    "maxP95LatencyMs": 260,
    "scaleOutThresholdPct": 80,
    "scaleInThresholdPct": 30,
    "windowSeconds": 60,
    "cooldownSeconds": 300
  },
  "healthCheck": {"path": "/", "port": 80}
}
```

### Operate `demo-docs`

Use Example 1's procedure, substituting `demo-docs`. Start with
`POST /apps/demo-docs/up`; check `GET /apps/demo-docs/status`. Scale to `2`
using `POST /apps/demo-docs/scale` with `{"replicas":2}`. Set policy minimum
`1`, maximum `3`, target RPS `55`, max latency `260`, thresholds `80`/`30`.
Submit safe test values RPS `9`, latency `75`, connections `3`, CPU `18`,
memory `32`, with `evaluate:false`.

Inspect with `GET /apps/demo-docs/raw`, `GET /apps/demo-docs/logs?lines=100`,
and `GET /apps/demo-docs/metrics`. Update policy using
`POST /apps/demo-docs/policy` and the policy JSON shape from Example 1 with
the values above. Submit test metrics using
`POST /apps/demo-docs/simulateMetrics` with the values above. Stop using
`POST /apps/demo-docs/down`; optionally delete using
`DELETE /apps/demo-docs`. Reads, stop, and delete have no request body.
Dashboard: use this app's row controls, **Details** tabs, and select it in
**Advanced tools**.

## Operations shared by all ten applications

These routes are not tied to a single app and are useful before or after
trying any of the ten:

| Operation | Dashboard | Swagger |
|---|---|---|
| List apps | **Applications** | `GET /apps` |
| System-wide metrics | **Metrics** | `GET /metrics` |
| Recent events for one sample | **Events**, filter by its exact app name | `GET /events?app=APP_NAME&limit=25` (replace `APP_NAME`) |
| Cluster status | **Cluster** page | `GET /cluster/status` |
| Cluster leader | **Cluster** page | `GET /cluster/leader` |
| Cluster health | Dashboard health panel or **Cluster** page | `GET /cluster/health` |

The read-only routes above do not need request bodies. Cluster status/leader
responses depend on cluster configuration; an unavailable leader or disabled
clustering may be reported by the API.

## Does the same JSON and procedure work in `/docs`?

**Yes.** The Dashboard and Swagger send requests to the same Orchestry API.
For registration, paste the chosen application's complete JSON into
**POST `/apps/register`** in Swagger. For the other operations, follow that
application's named paths and bodies above. In the Dashboard, use the guided
registration wizard, app row actions, **Details** tabs, and **Advanced tools**.
Responses reflect live controller and Docker state, so the exact values can
differ from the examples.

## Operation coverage

For any one of the ten apps, the procedure covers register, start, status,
manual scale, scaling policy, raw configuration, logs, app metrics, simulated
metrics, stop, and optional delete. The shared section covers list apps,
system metrics, events, cluster status, leader, and health. Together these
are the 17 user-facing operations. The controller also exposes `/health` and
`/lb-health` technical probes in Swagger; they are not app-management actions.
