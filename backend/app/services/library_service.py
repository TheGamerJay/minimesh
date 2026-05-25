from __future__ import annotations
import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models.library import ProjectSummary, ProjectDetails
from app.services.project_context import (
    PROJECT_ROOT,
    LEGACY_ID,
    get_active_project_id,
    set_active_project_id,
    get_uploads_dir,
    get_jobs_dir,
    get_rigs_dir,
    get_animations_dir,
    get_audits_dir,
    get_project_dir,
    get_projects_registry_file,
    _get_active_file,
    ensure_project_dirs,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# â”€â”€ Registry helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _load_registry() -> list[dict]:
    f = get_projects_registry_file()
    if not f.exists():
        return []
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_registry(entries: list[dict]) -> None:
    f = get_projects_registry_file()
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8")


def _upsert_registry(summary: ProjectSummary) -> None:
    entries = _load_registry()
    for i, e in enumerate(entries):
        if e["id"] == summary.id:
            entries[i] = summary.model_dump()
            _save_registry(entries)
            return
    entries.insert(0, summary.model_dump())
    _save_registry(entries)


def _remove_registry(project_id: str) -> None:
    entries = [e for e in _load_registry() if e["id"] != project_id]
    _save_registry(entries)


# â”€â”€ Thumbnail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _derive_thumbnail(project_id: str) -> str | None:
    uploads_dir = get_uploads_dir(project_id)
    if not uploads_dir.exists():
        return None
    # Prefer primary front_view, then any primary, then first image
    best: Path | None = None
    best_score = -1
    for sidecar in uploads_dir.glob("*.json"):
        try:
            meta = json.loads(sidecar.read_text(encoding="utf-8"))
            score = 0
            if meta.get("reference_role") == "front_view":
                score += 2
            if meta.get("is_primary"):
                score += 1
            if score > best_score:
                url = meta.get("url", "")
                if url:
                    candidate = uploads_dir / Path(url).name
                    if candidate.exists():
                        best_score = score
                        best = candidate
        except Exception:
            continue
    if best is None:
        return None
    # Return a relative URL the frontend can reach
    pid = project_id
    if pid == LEGACY_ID:
        return f"/uploads/{best.name}"
    return f"/uploads/{best.name}"  # active-project uploads are always /uploads/


# â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _count_json_files(directory: Path) -> int:
    if not directory.exists():
        return 0
    return sum(1 for _ in directory.glob("*.json"))


def _latest_audit_score(project_id: str) -> int | None:
    audits_dir = get_audits_dir(project_id)
    if not audits_dir.exists():
        return None
    files = sorted(audits_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        return None
    try:
        data = json.loads(files[0].read_text(encoding="utf-8"))
        return data.get("score")
    except Exception:
        return None


def _build_summary(entry: dict) -> ProjectSummary:
    pid = entry["id"]
    active_id = get_active_project_id()
    thumbnail = _derive_thumbnail(pid)
    score = _latest_audit_score(pid) or entry.get("score", 0)
    return ProjectSummary(
        id=pid,
        name=entry.get("name", "Untitled Project"),
        thumbnail=thumbnail,
        created_at=entry.get("created_at", _now()),
        updated_at=entry.get("updated_at", _now()),
        mode=entry.get("mode", "three_d_model"),
        status=entry.get("status", "draft"),
        score=score,
        is_active=(pid == active_id),
    )


# â”€â”€ Bootstrap legacy project â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _ensure_legacy_registered() -> None:
    entries = _load_registry()
    if any(e["id"] == LEGACY_ID for e in entries):
        return
    # Check if legacy data exists
    legacy_uploads = PROJECT_ROOT / "storage" / "uploads"
    if not legacy_uploads.exists():
        return
    now = _now()
    legacy = {
        "id": LEGACY_ID,
        "name": "My First Project",
        "created_at": now,
        "updated_at": now,
        "mode": "three_d_model",
        "status": "draft",
        "score": 0,
    }
    entries.append(legacy)
    _save_registry(entries)
    # If no active project set, activate legacy
    if not _get_active_file().exists():
        set_active_project_id(LEGACY_ID)


# â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def list_projects() -> list[ProjectSummary]:
    _ensure_legacy_registered()
    return [_build_summary(e) for e in _load_registry()]


def get_project_details(project_id: str) -> ProjectDetails:
    entries = _load_registry()
    entry = next((e for e in entries if e["id"] == project_id), None)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    summary = _build_summary(entry)
    return ProjectDetails(
        summary=summary,
        upload_count=_count_json_files(get_uploads_dir(project_id)),
        job_count=_count_json_files(get_jobs_dir(project_id)),
        rig_count=_count_json_files(get_rigs_dir(project_id)),
        animation_count=_count_json_files(get_animations_dir(project_id)),
        audit_score=_latest_audit_score(project_id),
    )


def create_project(name: str, template: str = "blank") -> ProjectSummary:
    now = _now()
    project_id = str(uuid.uuid4())
    ensure_project_dirs(project_id)
    entry = {
        "id": project_id,
        "name": name.strip() or "Untitled Project",
        "created_at": now,
        "updated_at": now,
        "mode": "three_d_model",
        "status": "draft",
        "score": 0,
        "template": template,
    }
    entries = _load_registry()
    entries.insert(0, entry)
    _save_registry(entries)
    return _build_summary(entry)


def duplicate_project(project_id: str) -> ProjectSummary:
    entries = _load_registry()
    entry = next((e for e in entries if e["id"] == project_id), None)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    new_id = str(uuid.uuid4())
    now = _now()

    # Copy storage dirs for non-legacy projects
    if project_id != LEGACY_ID:
        src = get_project_dir(project_id)
        dst = get_project_dir(new_id)
        if src.exists():
            shutil.copytree(src, dst)
        else:
            ensure_project_dirs(new_id)
    else:
        ensure_project_dirs(new_id)

    new_entry = {
        **entry,
        "id": new_id,
        "name": f"{entry.get('name', 'Project')} (Copy)",
        "created_at": now,
        "updated_at": now,
    }
    entries.insert(0, new_entry)
    _save_registry(entries)
    return _build_summary(new_entry)


def delete_project(project_id: str) -> None:
    entries = _load_registry()
    if len(entries) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last remaining project.")
    if not any(e["id"] == project_id for e in entries):
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    # Delete storage for non-legacy projects
    if project_id != LEGACY_ID:
        project_dir = get_project_dir(project_id)
        if project_dir.exists():
            shutil.rmtree(project_dir)

    _remove_registry(project_id)

    # If deleted project was active, switch to first remaining
    if get_active_project_id() == project_id:
        remaining = [e for e in entries if e["id"] != project_id]
        if remaining:
            set_active_project_id(remaining[0]["id"])


def activate_project(project_id: str) -> ProjectSummary:
    entries = _load_registry()
    entry = next((e for e in entries if e["id"] == project_id), None)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    ensure_project_dirs(project_id)
    set_active_project_id(project_id)
    return _build_summary(entry)
