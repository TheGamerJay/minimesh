from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

from app.services.project_context import PROJECT_ROOT

_AUDIT_DIR = PROJECT_ROOT / "storage" / "audit_logs"

DEFAULT_USER_ID = "default_local_user"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ── Audit logging ─────────────────────────────────────────────────────────────

def log_audit(category: str, action: str, user_id: str, message: str) -> None:
    try:
        _AUDIT_DIR.mkdir(parents=True, exist_ok=True)
        daily_file = _AUDIT_DIR / f"{_today()}.json"
        entries: list[dict] = []
        if daily_file.exists():
            try:
                entries = json.loads(daily_file.read_text(encoding="utf-8"))
            except Exception:
                entries = []
        entries.append({
            "id": str(uuid.uuid4()),
            "category": category,
            "action": action,
            "user_id": user_id,
            "message": message,
            "created_at": _now(),
        })
        daily_file.write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception:
        pass


def log_audit_from_request(path: str, method: str, user_id: str) -> None:
    """Called by AuthMiddleware after successful API responses."""
    rules = [
        ("POST",   "/api/jobs/generate",     "generation",    "generate"),
        ("POST",   "/api/normalize/run",      "normalization", "normalize_run"),
        ("POST",   "/api/export-v2/create",   "export",        "export_create"),
        ("DELETE", "/api/assets",             "delete",        "asset_delete"),
        ("POST",   "/api/workers/tasks",      "worker",        "task_create"),
        ("POST",   "/api/repairs",            "repair",        "repair_run"),
        ("POST",   "/api/thumbnails/render",  "thumbnail",     "thumbnail_render"),
    ]
    for m, prefix, category, action in rules:
        if method == m and path.startswith(prefix):
            log_audit(category, action, user_id, f"{method} {path}")
            break


def get_audit_logs(limit: int = 100, category: str | None = None):
    from app.models.admin import SystemAuditLog

    entries: list[dict] = []
    if not _AUDIT_DIR.exists():
        return []

    # Read daily files newest-first
    files = sorted(_AUDIT_DIR.glob("*.json"), reverse=True)
    for f in files:
        try:
            day_entries = json.loads(f.read_text(encoding="utf-8"))
            if category:
                day_entries = [e for e in day_entries if e.get("category") == category]
            entries.extend(day_entries)
            if len(entries) >= limit * 2:
                break
        except Exception:
            pass

    entries.sort(key=lambda e: e.get("created_at", ""), reverse=True)
    entries = entries[:limit]

    result = []
    for e in entries:
        try:
            result.append(SystemAuditLog(**e))
        except Exception:
            pass
    return result


# ── User admin functions ──────────────────────────────────────────────────────

def _get_user_records() -> list[dict]:
    from app.services.auth_service import _load_users
    return _load_users()


def get_all_users():
    from app.models.admin import AdminUserSummary

    users = _get_user_records()
    result = []
    for u in users:
        uid = u["id"]
        result.append(AdminUserSummary(
            id=uid,
            username=u.get("username", ""),
            email=u.get("email", ""),
            created_at=u.get("created_at", ""),
            last_login=u.get("last_login"),
            is_admin=u.get("is_admin", False),
            is_legacy=u.get("is_legacy", False),
            project_count=_count_user_projects(uid),
            asset_count=_count_user_assets(uid),
        ))
    return result


def _count_user_projects(user_id: str) -> int:
    try:
        if user_id == DEFAULT_USER_ID:
            reg = PROJECT_ROOT / "storage" / "projects_registry.json"
        else:
            reg = PROJECT_ROOT / "storage" / "users" / user_id / "projects_registry.json"
        if reg.exists():
            return len(json.loads(reg.read_text(encoding="utf-8")))
    except Exception:
        pass
    return 0


def _count_user_assets(user_id: str) -> int:
    try:
        if user_id == DEFAULT_USER_ID:
            base = PROJECT_ROOT / "storage"
        else:
            base = PROJECT_ROOT / "storage" / "users" / user_id
        total = 0
        for reg in base.rglob("assets/registry.json"):
            try:
                total += len(json.loads(reg.read_text(encoding="utf-8")))
            except Exception:
                pass
        return total
    except Exception:
        return 0


# ── Storage usage ─────────────────────────────────────────────────────────────

def get_storage_usage():
    from app.models.admin import StorageUsage

    total_users = len(_get_user_records())

    # Projects: sum across all registries
    total_projects = 0
    for reg in (PROJECT_ROOT / "storage").rglob("projects_registry.json"):
        try:
            total_projects += len(json.loads(reg.read_text(encoding="utf-8")))
        except Exception:
            pass

    # Assets: sum across all asset registries
    total_assets = 0
    for reg in (PROJECT_ROOT / "storage").rglob("assets/registry.json"):
        try:
            total_assets += len(json.loads(reg.read_text(encoding="utf-8")))
        except Exception:
            pass

    # Exports: sum export package records
    total_exports = 0
    for f in (PROJECT_ROOT / "storage").rglob("export_packages_v2/*.json"):
        total_exports += 1

    # Storage bytes
    total_bytes = 0
    for root in [PROJECT_ROOT / "storage", PROJECT_ROOT / "exports"]:
        if root.exists():
            for f in root.rglob("*"):
                if f.is_file():
                    try:
                        total_bytes += f.stat().st_size
                    except Exception:
                        pass

    return StorageUsage(
        total_users=total_users,
        total_projects=total_projects,
        total_assets=total_assets,
        total_exports=total_exports,
        total_storage_bytes=total_bytes,
    )


# ── Provider usage ────────────────────────────────────────────────────────────

def get_provider_usage():
    from app.models.admin import ProviderUsage

    stats: dict[str, dict] = {}

    def _ensure(provider: str) -> dict:
        if provider not in stats:
            stats[provider] = {
                "generation_jobs": 0,
                "inspection_jobs": 0,
                "normalize_jobs": 0,
                "thumbnail_jobs": 0,
                "failed_jobs": 0,
            }
        return stats[provider]

    # Generation jobs
    for job_file in (PROJECT_ROOT / "storage").rglob("jobs/*.json"):
        try:
            job = json.loads(job_file.read_text(encoding="utf-8"))
            p = job.get("provider", "unknown")
            _ensure(p)["generation_jobs"] += 1
            if job.get("status") == "failed":
                _ensure(p)["failed_jobs"] += 1
        except Exception:
            pass

    # Normalize jobs
    for nf in (PROJECT_ROOT / "storage" / "normalize").glob("*.json"):
        try:
            job = json.loads(nf.read_text(encoding="utf-8"))
            p = job.get("provider", "normalize-fallback")
            _ensure(p)["normalize_jobs"] += 1
            if job.get("status") == "failed":
                _ensure(p)["failed_jobs"] += 1
        except Exception:
            pass

    # Inspection reports
    for rf in (PROJECT_ROOT / "storage" / "inspections").glob("*.json"):
        if rf.name.endswith("_raw.json"):
            continue
        try:
            report = json.loads(rf.read_text(encoding="utf-8"))
            p = "blender-inspect" if report.get("blender_used") else "inspect-fallback"
            _ensure(p)["inspection_jobs"] += 1
        except Exception:
            pass

    # Thumbnail jobs
    for tf in (PROJECT_ROOT / "storage" / "thumbnails").glob("*.json"):
        try:
            job = json.loads(tf.read_text(encoding="utf-8"))
            p = job.get("provider", "thumbnail-fallback")
            _ensure(p)["thumbnail_jobs"] += 1
            if job.get("status") == "failed":
                _ensure(p)["failed_jobs"] += 1
        except Exception:
            pass

    return [
        ProviderUsage(provider=p, **s)
        for p, s in sorted(stats.items())
    ]


# ── System health ─────────────────────────────────────────────────────────────

def get_system_health() -> dict:
    result: dict = {}

    # Storage writable
    try:
        probe = PROJECT_ROOT / "storage" / ".admin_health_probe"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink()
        result["storage_writable"] = True
    except Exception:
        result["storage_writable"] = False

    # Auth storage
    try:
        from app.services.auth_service import auth_storage_ready
        result["auth_storage"] = auth_storage_ready()
    except Exception:
        result["auth_storage"] = False

    # Blender
    try:
        from app.services.blender_bridge import detect
        info = detect()
        result["blender_available"] = bool(info.get("found"))
        result["blender_version"] = info.get("version", "")
        result["blender_path"] = info.get("path", "")
    except Exception:
        result["blender_available"] = False
        result["blender_version"] = ""
        result["blender_path"] = ""

    # Provider registry
    try:
        from app.services import provider_registry  # noqa: F401
        result["provider_registry"] = True
    except Exception:
        result["provider_registry"] = False

    # Worker health
    try:
        from app.services import worker_service
        health = worker_service.get_health()
        result["worker_online"] = health.get("worker_online", False)
        result["queue_size"] = health.get("queue_size", 0)
        result["active_tasks"] = health.get("active_tasks", 0)
    except Exception:
        result["worker_online"] = False
        result["queue_size"] = 0
        result["active_tasks"] = 0

    # Audit log count (last 7 days)
    try:
        audit_count = sum(
            len(json.loads(f.read_text(encoding="utf-8")))
            for f in _AUDIT_DIR.glob("*.json")
            if (datetime.now(timezone.utc) - datetime.fromisoformat(f.stem + "T00:00:00+00:00"))
               < timedelta(days=7)
        )
        result["audit_events_7d"] = audit_count
    except Exception:
        result["audit_events_7d"] = 0

    return result
