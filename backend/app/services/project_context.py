"""
Central active-project path resolver — user-aware since Phase 29.

Each authenticated user's data lives under:
  storage/users/{user_id}/projects/{project_id}/...

The DEFAULT_USER_ID maps to the original flat layout so legacy data is
never moved. Any new user gets their own isolated subtree.
"""
from __future__ import annotations
import json
from contextvars import ContextVar
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
LEGACY_ID = "legacy"
DEFAULT_USER_ID = "default_local_user"  # legacy migration user

# Set per-request by AuthMiddleware; None = unauthenticated or health routes
_current_user_id: ContextVar[str | None] = ContextVar("current_user_id", default=None)


def _uid() -> str | None:
    return _current_user_id.get()


# ── Active project pointer ────────────────────────────────────────────────────

def _get_active_file() -> Path:
    uid = _uid()
    if uid and uid != DEFAULT_USER_ID:
        return PROJECT_ROOT / "storage" / "users" / uid / "active_project.json"
    return PROJECT_ROOT / "storage" / "active_project.json"


def get_active_project_id() -> str:
    try:
        f = _get_active_file()
        if f.exists():
            return json.loads(f.read_text(encoding="utf-8")).get("project_id", LEGACY_ID)
    except Exception:
        pass
    return LEGACY_ID


def set_active_project_id(project_id: str) -> None:
    f = _get_active_file()
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps({"project_id": project_id}, indent=2), encoding="utf-8")


# ── User-aware base helpers ───────────────────────────────────────────────────

def _storage_legacy_base() -> Path:
    uid = _uid()
    if uid and uid != DEFAULT_USER_ID:
        return PROJECT_ROOT / "storage" / "users" / uid
    return PROJECT_ROOT / "storage"


def _storage_project_dir(pid: str) -> Path:
    uid = _uid()
    if uid and uid != DEFAULT_USER_ID:
        return PROJECT_ROOT / "storage" / "users" / uid / "projects" / pid
    return PROJECT_ROOT / "storage" / "projects" / pid


def _exports_legacy_base() -> Path:
    uid = _uid()
    if uid and uid != DEFAULT_USER_ID:
        return PROJECT_ROOT / "exports" / "users" / uid
    return PROJECT_ROOT / "exports"


def _exports_project_dir(pid: str) -> Path:
    uid = _uid()
    if uid and uid != DEFAULT_USER_ID:
        return PROJECT_ROOT / "exports" / "users" / uid / "projects" / pid
    return PROJECT_ROOT / "exports" / "projects" / pid


def _pid(project_id: str | None) -> str:
    return project_id if project_id is not None else get_active_project_id()


# ── Storage path helpers ──────────────────────────────────────────────────────

def get_storage_base(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base()
    return _storage_project_dir(pid)


def get_uploads_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "uploads"
    return _storage_project_dir(pid) / "uploads"


def get_jobs_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "jobs"
    return _storage_project_dir(pid) / "jobs"


def get_rigs_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "rigs"
    return _storage_project_dir(pid) / "rigs"


def get_animations_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "animations"
    return _storage_project_dir(pid) / "animations"


def get_modules_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "modules"
    return _storage_project_dir(pid) / "modules"


def get_audits_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "audits"
    return _storage_project_dir(pid) / "audits"


def get_generation_config_path(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "generation_config.json"
    return _storage_project_dir(pid) / "generation_config.json"


def get_session_file_path(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "project_session.json"
    return _storage_project_dir(pid) / "project_session.json"


def get_assets_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "assets"
    return _storage_project_dir(pid) / "assets"


def get_textures_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _storage_legacy_base() / "textures"
    return _storage_project_dir(pid) / "textures"


def get_project_dir(project_id: str) -> Path:
    """Absolute path to a project's storage directory (for copy/delete operations)."""
    uid = _uid()
    if uid and uid != DEFAULT_USER_ID:
        return PROJECT_ROOT / "storage" / "users" / uid / "projects" / project_id
    return PROJECT_ROOT / "storage" / "projects" / project_id


# ── Export path helpers ───────────────────────────────────────────────────────

def get_export_packages_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _exports_legacy_base() / "packages"
    return _exports_project_dir(pid) / "packages"


def get_export_jobs_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _exports_legacy_base() / "jobs"
    return _exports_project_dir(pid) / "jobs"


def get_export_rigs_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _exports_legacy_base() / "rigs"
    return _exports_project_dir(pid) / "rigs"


def get_export_animations_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return _exports_legacy_base() / "animations"
    return _exports_project_dir(pid) / "animations"


# ── Export V2 package dirs (used by export_package_service) ──────────────────

def get_export_packages_v2_storage() -> Path:
    uid = _uid()
    if uid and uid != DEFAULT_USER_ID:
        return PROJECT_ROOT / "storage" / "users" / uid / "export_packages_v2"
    return PROJECT_ROOT / "storage" / "export_packages_v2"


def get_export_packages_v2_output() -> Path:
    uid = _uid()
    if uid and uid != DEFAULT_USER_ID:
        return PROJECT_ROOT / "exports" / "users" / uid / "packages_v2"
    return PROJECT_ROOT / "exports" / "packages_v2"


# ── Project registry ──────────────────────────────────────────────────────────

def get_projects_registry_file() -> Path:
    uid = _uid()
    if uid and uid != DEFAULT_USER_ID:
        base = PROJECT_ROOT / "storage" / "users" / uid
        base.mkdir(parents=True, exist_ok=True)
        return base / "projects_registry.json"
    return PROJECT_ROOT / "storage" / "projects_registry.json"


# ── Directory bootstrap ───────────────────────────────────────────────────────

def ensure_project_dirs(project_id: str | None = None) -> None:
    for fn in (
        get_uploads_dir, get_jobs_dir, get_rigs_dir, get_animations_dir,
        get_modules_dir, get_audits_dir, get_assets_dir, get_textures_dir,
        get_export_packages_dir, get_export_jobs_dir,
        get_export_rigs_dir, get_export_animations_dir,
    ):
        fn(project_id).mkdir(parents=True, exist_ok=True)
