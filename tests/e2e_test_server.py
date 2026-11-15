from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

DASHBOARD_DIR = Path(__file__).resolve().parents[1] / "controller" / "dashboard"

app = FastAPI(
    title="Autrix Isolated E2E Test Server",
    docs_url="/docs",
    redoc_url=None,
)

app.mount(
    "/dashboard-assets",
    StaticFiles(directory=DASHBOARD_DIR),
    name="dashboard-assets",
)


@app.get("/", include_in_schema=False)
@app.get("/dashboard", include_in_schema=False)
async def dashboard():
    return FileResponse(DASHBOARD_DIR / "index.html")


@app.get("/classic-api-docs", include_in_schema=False)
async def classic_api_docs():
    return FileResponse(DASHBOARD_DIR / "classic-api-docs.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)
