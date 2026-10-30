# Existing Technology Stack

## Languages and runtimes

- Python project; `pyproject.toml` declares `requires-python = ">=3.8"` and classifiers for Python 3.9 through 3.13.
- The selected local virtual environment reports Python 3.13.13 (`.venv/pyvenv.cfg`); this is an observed workspace environment, not a repository-wide runtime pin.
- `controller/utils/models.py:24` uses `int | None`, syntax requiring Python 3.10 or newer without postponed annotations. This conflicts with the declared Python 3.8 floor.
- `controller/main.py` starts the server through Uvicorn. `pyproject.toml` does not declare a Uvicorn server script; `requirements.txt` pins Uvicorn 0.32.1.

## Frameworks and key libraries

- FastAPI 0.115.5 for HTTP routes and generated OpenAPI/Swagger/ReDoc documentation.
- Starlette 0.41.3 and Pydantic 2.10.3 / pydantic-core 2.27.1 in `requirements.txt`.
- Typer 0.17.4 for the CLI; installed command is `orchestry`, entrypoint `cli.main:app`.
- Docker SDK for Python 7.1.0 for container operations.
- psycopg2 2.9.10 for PostgreSQL connectivity and threaded connection pools.
- PostgreSQL 15 Alpine image and Nginx Alpine images are specified in `docker-compose.yml`; Nginx is used for controller/application load balancing.
- PyYAML 6.0.2, python-dotenv 1.1.1, requests 2.32.5, and platformdirs 4.4.0 are declared as project dependencies.

## Dependency/build metadata

- `pyproject.toml`: setuptools build backend (`setuptools>=64`, `wheel`), project version 1.0.1, five direct package dependencies pinned exactly, and the Typer console-script entrypoint.
- `requirements.txt`: pinned environment set, including FastAPI, Uvicorn, Docker SDK, psycopg2, Pydantic, CLI, and documentation/build packages. The server-specific packages FastAPI, Uvicorn, Docker SDK, and psycopg2 appear here but not in `[project].dependencies`.
- Docker controller build instructions are in `configs/Dockerfile.controller`; orchestration services and environment interpolation are in `docker-compose.yml`.
- No JavaScript/TypeScript package manifest, browser build system, or frontend dependency stack was found.

## API wiring and browser-relevant facts

- The FastAPI application is created at `controller/api.py:48`, titled `Orchestry Controller API`, version `1.0.0`; routes are declared at root-relative paths without an API prefix.
- No custom FastAPI documentation URLs are supplied, so the framework defaults are `/docs`, `/redoc`, and `/openapi.json` (static inference from the constructor and pinned FastAPI dependency).
- CORS middleware is configured with wildcard origins, credentials enabled, wildcard methods, and wildcard headers (`controller/api.py:59-65`).
- No authentication dependency or API-key enforcement is wired on the inspected FastAPI routes. The `leader_required` decorator restricts selected write operations by controller leadership, not user identity.
- Runtime API host/port are configured by `ORCHESTRY_HOST` and `ORCHESTRY_PORT` in `controller/main.py`; cluster/load-balancer environment variables are documented in `.env.example` and supplied in Compose.

## Evidence limits

The local probes for `http://127.0.0.1:8000/docs` and `/openapi.json` could not connect. Generated schema contents, live response examples, and runtime deployment values were not observed. This document records existing facts only; it does not select a dashboard target stack.
