from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.models.admin import AdminUserSummary, StorageUsage, ProviderUsage, SystemAuditLog
from app.models.auth import SessionUser
from app.services import admin_service
from app.services.auth_middleware import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def require_admin(user: SessionUser = Depends(get_current_user)) -> SessionUser:
    if not getattr(user, "is_admin", False):
        from fastapi import HTTPException
        raise HTTPException(403, "Admin access required")
    return user


@router.get("/users", response_model=list[AdminUserSummary])
async def list_users(_: SessionUser = Depends(require_admin)):
    return admin_service.get_all_users()


@router.get("/storage", response_model=StorageUsage)
async def storage_usage(_: SessionUser = Depends(require_admin)):
    return admin_service.get_storage_usage()


@router.get("/providers", response_model=list[ProviderUsage])
async def provider_usage(_: SessionUser = Depends(require_admin)):
    return admin_service.get_provider_usage()


@router.get("/audit-logs", response_model=list[SystemAuditLog])
async def audit_logs(
    limit: int = Query(default=100, le=500),
    category: str | None = Query(default=None),
    _: SessionUser = Depends(require_admin),
):
    return admin_service.get_audit_logs(limit=limit, category=category)


@router.get("/system-health")
async def system_health(_: SessionUser = Depends(require_admin)) -> dict:
    return admin_service.get_system_health()
