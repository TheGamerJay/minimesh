from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


# ── Liveness ─────────────────────────────────────────────────────────────────

@router.get("/health")
@router.get("/health/live")
async def health_live():
    return {"status": "alive"}


# ── Readiness ─────────────────────────────────────────────────────────────────

class _Checks(BaseModel):
    storage_writable: bool = False
    frontend_dist: bool = False
    provider_registry: bool = False
    blender_available: bool = False
    auth_storage: bool = False


class ReadinessReport(BaseModel):
    ready: bool
    version: str
    checks: _Checks
    env: dict
    warnings: list[str]


@router.get("/health/ready", response_model=ReadinessReport)
async def health_ready():
    from app.services.env_service import validate
    from app.services.project_context import PROJECT_ROOT

    env = validate()
    checks = _Checks()

    # Storage writable
    try:
        probe = PROJECT_ROOT / "storage" / ".health_probe"
        probe.write_text("ok")
        probe.unlink()
        checks.storage_writable = True
    except Exception:
        pass

    # Frontend dist (Docker path: /app/frontend/dist; dev path: ../frontend/dist)
    for candidate in [
        PROJECT_ROOT / "frontend" / "dist" / "index.html",
        PROJECT_ROOT / "static" / "dist" / "index.html",
    ]:
        if candidate.exists():
            checks.frontend_dist = True
            break

    # Provider registry loads without error
    try:
        from app.services import provider_registry  # noqa: F401
        checks.provider_registry = True
    except Exception:
        pass

    # Blender available
    try:
        from app.services.blender_bridge import detect
        info = detect()
        checks.blender_available = bool(info.get("found", False))
    except Exception:
        checks.blender_available = False

    # Auth storage
    try:
        from app.services.auth_service import auth_storage_ready
        checks.auth_storage = auth_storage_ready()
    except Exception:
        checks.auth_storage = False

    ready = checks.storage_writable and checks.provider_registry

    return ReadinessReport(
        ready=ready,
        version="2.9.0",
        checks=checks,
        env=env.model_dump(),
        warnings=env.warnings,
    )
