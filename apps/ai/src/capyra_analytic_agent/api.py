"""Private FastAPI server for Cloudflare Container jobs."""

from __future__ import annotations

from fastapi import FastAPI

from .cloudflare_jobs import BindingObjectStorage
from .models import StrictModel

STORAGE_HEALTH_KEY = "development/container-storage-health.txt"


class HealthResponse(StrictModel):
    """Basic health payload for local service checks."""

    status: str = "ok"


class StorageHealthResponse(HealthResponse):
    storage: str = "ok"


def create_app() -> FastAPI:
    """Build the private Container app."""
    app = FastAPI(
        title="Capyra Analytic Agent API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    from .cloudflare_jobs import router as cloudflare_jobs_router

    app.include_router(cloudflare_jobs_router)

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse()

    @app.get("/health/storage", response_model=StorageHealthResponse)
    def storage_health() -> StorageHealthResponse:
        storage = BindingObjectStorage()
        storage.put_bytes(STORAGE_HEALTH_KEY, b"ok", "text/plain", "health")
        if storage.size(STORAGE_HEALTH_KEY) != 2:
            raise RuntimeError("Object storage health payload has an unexpected size.")
        return StorageHealthResponse()

    return app


app = create_app()
