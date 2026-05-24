import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.services import env_service
from app.routes.animations import router as animations_router
from app.routes.audits import router as audits_router
from app.routes.exports import router as exports_router
from app.routes.generation import router as generation_router
from app.routes.health import router as health_router
from app.routes.jobs import router as jobs_router
from app.routes.library import router as library_router
from app.routes.credits import router as credits_router
from app.routes.materials import router as materials_router
from app.routes.providers import router as providers_router
from app.routes.modules import router as modules_router
from app.routes.assets import router as assets_router
from app.routes.textures import router as textures_router
from app.routes.bakes import router as bakes_router
from app.routes.edits import router as edits_router
from app.routes.workers import router as workers_router
from app.routes.inspections import router as inspections_router
from app.routes.normalize import router as normalize_router
from app.routes.thumbnails import router as thumbnails_router
from app.routes.export_v2 import router as export_v2_router
from app.routes.asset_qa import router as asset_qa_router
from app.routes.repair import router as repair_router
from app.routes.projects import router as projects_router
from app.routes.rigs import router as rigs_router
from app.routes.uploads import router as uploads_router
from app.services.project_context import (
    PROJECT_ROOT,
    get_uploads_dir,
    get_textures_dir,
    ensure_project_dirs,
)

_PACKAGES_DIR = PROJECT_ROOT / "exports" / "packages"
_PACKAGES_DIR.mkdir(parents=True, exist_ok=True)

# Legacy flat dirs (still needed for legacy project)
(PROJECT_ROOT / "storage" / "uploads").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "jobs").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "rigs").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "exports" / "rigs").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "animations").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "exports" / "animations").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "modules").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "audits").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "projects").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "credits").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "credits" / "ledger").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "exports" / "projects").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "providers").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "assets").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "textures").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "bakes").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "exports" / "bakes").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "edits").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "exports" / "edits").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "workers").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "workers" / "tasks").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "inspections").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "normalize").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "exports" / "normalized").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "thumbnails").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "exports" / "thumbnails").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "export_packages_v2").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "exports" / "packages_v2").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "asset_qa").mkdir(parents=True, exist_ok=True)
(PROJECT_ROOT / "storage" / "repairs").mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    env_service.log_startup()
    yield


_app_env = os.environ.get("APP_ENV", "development")
_cors_origins = ["*"] if _app_env == "production" else [settings.FRONTEND_URL]

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered image-to-3D, sculpting, rigging, and animation pipeline studio.",
    version="2.8.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_app_env != "production",
    allow_methods=["*"],
    allow_headers=["*"],
)

# Export packages are project-agnostic in URL space; serve the whole exports tree
app.mount("/export-packages", StaticFiles(directory=str(PROJECT_ROOT / "exports")), name="export-packages")


@app.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Serve an image from the ACTIVE project's uploads directory."""
    path = get_uploads_dir() / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Upload not found.")
    return FileResponse(str(path))


app.include_router(health_router)
app.include_router(uploads_router)
app.include_router(projects_router)
app.include_router(generation_router)
app.include_router(jobs_router)
app.include_router(exports_router)
app.include_router(rigs_router)
app.include_router(animations_router)
app.include_router(modules_router)
app.include_router(audits_router)
app.include_router(library_router)
app.include_router(materials_router)
app.include_router(credits_router)
app.include_router(providers_router)
app.include_router(assets_router)
app.include_router(textures_router)
app.include_router(bakes_router)
app.include_router(edits_router)
app.include_router(workers_router)
app.include_router(inspections_router)
app.include_router(normalize_router)
app.include_router(thumbnails_router)
app.include_router(export_v2_router)
app.include_router(asset_qa_router)
app.include_router(repair_router)


@app.get("/textures/{filename}")
async def serve_texture(filename: str):
    """Serve a texture file from the ACTIVE project's textures directory."""
    path = get_textures_dir() / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Texture not found.")
    return FileResponse(str(path))


@app.get("/")
async def root():
    return {
        "app": "MiniMesh",
        "status": "running",
        "message": "AI-powered image-to-3D, sculpting, rigging, and animation pipeline studio.",
    }
