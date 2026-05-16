"""
Central active-project path resolver.

Legacy project (id="legacy") maps to the original flat storage layout so
existing data is never touched. New projects get their own subdirectory
under storage/projects/{id}/.
"""
from __future__ import annotations
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
_ACTIVE_FILE = PROJECT_ROOT / "storage" / "active_project.json"
LEGACY_ID = "legacy"


# â”€â”€ Active project pointer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def get_active_project_id() -> str:
    try:
        if _ACTIVE_FILE.exists():
            return json.loads(_ACTIVE_FILE.read_text(encoding="utf-8")).get("project_id", LEGACY_ID)
    except Exception:
        pass
    return LEGACY_ID


def set_active_project_id(project_id: str) -> None:
    _ACTIVE_FILE.parent.mkdir(parents=True, exist_ok=True)
    _ACTIVE_FILE.write_text(json.dumps({"project_id": project_id}, indent=2), encoding="utf-8")


# â”€â”€ Storage path helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Each function returns the correct directory for the active project (or a
# specific project_id when passed explicitly).

def _pid(project_id: str | None) -> str:
    return project_id if project_id is not None else get_active_project_id()


def get_storage_base(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage"
    return PROJECT_ROOT / "storage" / "projects" / pid


def get_uploads_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "uploads"
    return PROJECT_ROOT / "storage" / "projects" / pid / "uploads"


def get_jobs_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "jobs"
    return PROJECT_ROOT / "storage" / "projects" / pid / "jobs"


def get_rigs_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "rigs"
    return PROJECT_ROOT / "storage" / "projects" / pid / "rigs"


def get_animations_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "animations"
    return PROJECT_ROOT / "storage" / "projects" / pid / "animations"


def get_modules_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "modules"
    return PROJECT_ROOT / "storage" / "projects" / pid / "modules"


def get_audits_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "audits"
    return PROJECT_ROOT / "storage" / "projects" / pid / "audits"


def get_generation_config_path(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "generation_config.json"
    return PROJECT_ROOT / "storage" / "projects" / pid / "generation_config.json"


def get_session_file_path(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "project_session.json"
    return PROJECT_ROOT / "storage" / "projects" / pid / "project_session.json"


# â”€â”€ Export path helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def get_export_packages_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "exports" / "packages"
    return PROJECT_ROOT / "exports" / "projects" / pid / "packages"


def get_export_jobs_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "exports" / "jobs"
    return PROJECT_ROOT / "exports" / "projects" / pid / "jobs"


def get_export_rigs_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "exports" / "rigs"
    return PROJECT_ROOT / "exports" / "projects" / pid / "rigs"


def get_export_animations_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "exports" / "animations"
    return PROJECT_ROOT / "exports" / "projects" / pid / "animations"


def get_textures_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "textures"
    return PROJECT_ROOT / "storage" / "projects" / pid / "textures"


def get_assets_dir(project_id: str | None = None) -> Path:
    pid = _pid(project_id)
    if pid == LEGACY_ID:
        return PROJECT_ROOT / "storage" / "assets"
    return PROJECT_ROOT / "storage" / "projects" / pid / "assets"


def ensure_project_dirs(project_id: str | None = None) -> None:
    for fn in (
        get_uploads_dir, get_jobs_dir, get_rigs_dir, get_animations_dir,
        get_modules_dir, get_audits_dir, get_assets_dir, get_textures_dir,
        get_export_packages_dir, get_export_jobs_dir,
        get_export_rigs_dir, get_export_animations_dir,
    ):
        fn(project_id).mkdir(parents=True, exist_ok=True)
