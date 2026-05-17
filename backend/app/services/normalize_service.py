from __future__ import annotations
import json
import shutil
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.normalize import NormalizeJob
from app.services import blender_bridge
from app.services.asset_service import get_asset, register_new_version
from app.services.project_context import PROJECT_ROOT

_NORMALIZE_DIR = PROJECT_ROOT / "storage" / "normalize"
_OUTPUT_DIR = PROJECT_ROOT / "exports" / "normalized"
_NORMALIZE_SCRIPT = str(PROJECT_ROOT / "workers" / "blender_normalize.py")


def _job_path(job_id: str) -> Path:
    return _NORMALIZE_DIR / f"{job_id}.json"


def _load_job(job_id: str) -> NormalizeJob | None:
    p = _job_path(job_id)
    if not p.exists():
        return None
    try:
        return NormalizeJob.model_validate(json.loads(p.read_text(encoding="utf-8")))
    except Exception:
        return None


def _save_job(job: NormalizeJob) -> None:
    _NORMALIZE_DIR.mkdir(parents=True, exist_ok=True)
    _job_path(job.id).write_text(job.model_dump_json(indent=2), encoding="utf-8")


def get_normalize_job(job_id: str) -> NormalizeJob | None:
    return _load_job(job_id)


def list_normalize_jobs(asset_id: str | None = None) -> list[NormalizeJob]:
    if not _NORMALIZE_DIR.exists():
        return []
    jobs: list[NormalizeJob] = []
    for p in sorted(_NORMALIZE_DIR.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
        try:
            job = NormalizeJob.model_validate(json.loads(p.read_text(encoding="utf-8")))
            if asset_id is None or job.asset_id == asset_id:
                jobs.append(job)
        except Exception:
            continue
    return jobs


def _execute_normalize(job_id: str) -> None:
    """Background thread: runs normalization and updates the job."""
    job = _load_job(job_id)
    if not job or job.status != "queued":
        return

    now = datetime.now(timezone.utc).isoformat()
    job.status = "processing"
    job.updated_at = now
    _save_job(job)

    asset = get_asset(job.asset_id)
    if asset is None:
        job.status = "failed"
        job.message = f"Asset {job.asset_id!r} not found"
        job.updated_at = datetime.now(timezone.utc).isoformat()
        _save_job(job)
        return

    source_glb = asset.file_path
    output_dir = _OUTPUT_DIR / job.id
    output_dir.mkdir(parents=True, exist_ok=True)
    output_glb = str(output_dir / "normalized.glb")
    report_json = str(output_dir / "normalize_report.json")

    blender_info = blender_bridge.detect()
    blender_available = blender_info["found"] and Path(source_glb).is_file()

    if blender_available:
        success, stdout, stderr = blender_bridge.run_glb_normalize(
            glb_path=source_glb,
            output_glb=output_glb,
            report_json=report_json,
            script_path=_NORMALIZE_SCRIPT,
            timeout=120,
        )
        logs = ""
        if stdout:
            logs += stdout
        if stderr:
            logs += f"\n--- stderr ---\n{stderr}"

        if success and Path(output_glb).exists():
            try:
                report = json.loads(Path(report_json).read_text(encoding="utf-8"))
                job.normalization_scale = report.get("normalization_scale", 1.0)
                job.original_bounds = report.get("original_bounds", {})
                job.normalized_bounds = report.get("normalized_bounds", {})
            except Exception:
                pass
            job.fallback_normalized = False
            job.provider = "blender-normalize"
            job.message = logs[:2000] if logs else "Blender normalization complete"
        else:
            # Blender ran but failed → fall back to copy
            _copy_fallback(source_glb, output_glb)
            job.fallback_normalized = True
            job.provider = "normalize-fallback"
            job.message = f"Blender failed — fallback copy used.\n{logs[:1000]}"
    else:
        # Blender unavailable or source GLB missing → copy fallback
        _copy_fallback(source_glb, output_glb) if Path(source_glb).is_file() else None
        if not Path(output_glb).exists():
            job.status = "failed"
            job.message = "Blender unavailable and source GLB not found — cannot normalize"
            job.updated_at = datetime.now(timezone.utc).isoformat()
            _save_job(job)
            return
        job.fallback_normalized = True
        job.provider = "normalize-fallback"
        job.message = "Blender unavailable — non-destructive copy created (original preserved)"

    # Register as a new asset version
    try:
        updated_asset = register_new_version(
            job.asset_id,
            file_path=output_glb,
            provider=job.provider,
        )
        job.output_version = updated_asset.version
    except Exception as exc:
        job.status = "failed"
        job.message = f"Version registration failed: {exc}"
        job.updated_at = datetime.now(timezone.utc).isoformat()
        _save_job(job)
        return

    job.status = "completed"
    job.updated_at = datetime.now(timezone.utc).isoformat()
    _save_job(job)

    # Auto-trigger thumbnail render for the new version (best-effort)
    try:
        from app.services import thumbnail_service
        thumbnail_service.create_thumbnail_job(job.asset_id, render_type="preview")
    except Exception:
        pass


def _copy_fallback(source: str, dest: str) -> None:
    try:
        shutil.copy2(source, dest)
    except Exception:
        pass


def create_normalize_job(asset_id: str, project_id: str | None = None) -> NormalizeJob:
    asset = get_asset(asset_id, project_id)
    if asset is None:
        raise ValueError(f"Asset {asset_id!r} not found")

    now = datetime.now(timezone.utc).isoformat()
    job = NormalizeJob(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        source_version=asset.version,
        status="queued",
        created_at=now,
        updated_at=now,
    )
    _save_job(job)

    thread = threading.Thread(target=_execute_normalize, args=(job.id,), daemon=True)
    thread.start()
    return job
