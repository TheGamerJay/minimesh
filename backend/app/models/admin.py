from __future__ import annotations
from pydantic import BaseModel


class AdminUserSummary(BaseModel):
    id: str
    username: str
    email: str
    created_at: str
    last_login: str | None = None
    is_admin: bool = False
    is_legacy: bool = False
    project_count: int = 0
    asset_count: int = 0


class SystemAuditLog(BaseModel):
    id: str
    category: str
    action: str
    user_id: str
    message: str
    created_at: str


class StorageUsage(BaseModel):
    total_users: int = 0
    total_projects: int = 0
    total_assets: int = 0
    total_exports: int = 0
    total_storage_bytes: int = 0


class ProviderUsage(BaseModel):
    provider: str
    generation_jobs: int = 0
    inspection_jobs: int = 0
    normalize_jobs: int = 0
    thumbnail_jobs: int = 0
    failed_jobs: int = 0
