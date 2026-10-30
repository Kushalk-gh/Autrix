# Existing Data Model

## Persistence technology

`state/db.py` uses psycopg2 and PostgreSQL SQL directly; persistence is not implemented through an ORM. Compose specifies PostgreSQL 15 Alpine with primary/replica services. Schema creation is performed by `PostgreSQLManager._init_database` and `DistributedController._init_cluster_tables`.

## Persistent tables

| Table | Fields evidenced by schema | Keys and relationships |
|---|---|---|
| `apps` (`state/db.py:148`) | `name VARCHAR(255)`, `spec JSONB`, `status VARCHAR(50)`, `created_at DOUBLE PRECISION`, `updated_at DOUBLE PRECISION`, `replicas INTEGER`, `last_scaled_at DOUBLE PRECISION`, `mode VARCHAR(10)` | `name` primary key; defaults include status `registered`, replicas `0`, mode `auto` |
| `instances` (`state/db.py:162`) | `container_id VARCHAR(255)`, `app_name VARCHAR(255)`, `ip VARCHAR(45)`, `port INTEGER`, `status VARCHAR(50)`, `created_at`, `updated_at`, `failure_count INTEGER`, `last_health_check` | `container_id` primary key; `app_name` references `apps.name ON DELETE CASCADE` |
| `events` (`state/db.py:178`) | `id SERIAL`, `app_name VARCHAR(255)`, `event_type VARCHAR(100)`, `message TEXT`, `timestamp DOUBLE PRECISION`, `details JSONB` | `id` primary key; no foreign key declared |
| `scaling_history` (`state/db.py:190`) | `id SERIAL`, `app_name VARCHAR(255)`, `from_replicas INTEGER`, `to_replicas INTEGER`, `trigger_reason TEXT`, `metrics_snapshot JSONB`, `timestamp DOUBLE PRECISION` | `id` primary key; no foreign key declared |
| `cluster_nodes` (`controller/cluster.py:178`) | `node_id`, `hostname`, `port`, `api_url`, `state`, `term`, `last_heartbeat`, `is_healthy`, `created_at`, `updated_at` | `node_id` primary key |
| `leader_lease` (`controller/cluster.py:194`) | `id`, `leader_id`, `term`, `acquired_at`, `expires_at`, `renewed_at`, `hostname`, `api_url` | `id` primary key; `single_lease` check constrains `id = 1` |
| `cluster_events` (`controller/cluster.py:209`) | `id SERIAL`, `node_id`, `event_type`, `event_data JSONB`, `term`, `timestamp` | `id` primary key; no foreign key declared |

`instances.app_name → apps.name` is the only declared foreign-key relationship in these table definitions. Indexes are created for app status/mode, instance app/status, event app/type plus time, scaling app plus time, and cluster node/event lookup fields.

## Python record and API models

- `state/db.py:19` `AppRecord`: name, spec, status, created/updated timestamps, replicas, last-scaled timestamp, mode.
- `state/db.py:31` `InstanceRecord`: app name, container ID, IP, port, status, timestamps, failure count, last health check.
- `state/db.py:44` `EventRecord`: optional ID, app name, event type, message, timestamp, optional details.
- `controller/utils/models.py`: `AppSpec` (apiVersion, kind, metadata, spec, optional scaling/healthCheck), `ScaleRequest` (replicas constrained 0–100), `PolicyRequest` (policy map), `SimulatedMetricsRequest` (RPS, latency, connections, CPU/memory, optional healthy replicas, evaluate flag), `AppRegistrationResponse`, and `AppStatusResponse`.
- Cluster value objects in `controller/cluster.py`: `ClusterNode` and `LeaderLease`. Cluster SQL fields and state are listed above.

## Transactions

Database schema initialization commits after table/index creation. Database methods use the PostgreSQL manager's connection context and perform individual persistence operations; the FastAPI handlers sequence manager actions and separate event/scaling-history writes without an enclosing request-wide transaction. A dashboard must treat action response and subsequent readback as separate operations unless runtime behavior proves otherwise.

## Key entities

1. **App** — registered application specification and desired/runtime metadata.
2. **Instance** — a Docker container instance associated with an app.
3. **Event** — timestamped app event with JSONB details.
4. **Scaling history** — replica changes, trigger reason, and optional metrics snapshot.
5. **Cluster node** — controller node address, term, heartbeat, and health.
6. **Leader lease** — singleton lease for controller leader identity and expiry.
7. **Cluster event** — timestamped coordination event associated with a node and term.

No schema redesign or frontend-specific model is inferred.
