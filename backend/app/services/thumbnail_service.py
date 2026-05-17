from __future__ import annotations
import base64
import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.thumbnails import ThumbnailRenderJob, VALID_RENDER_TYPES
from app.services import blender_bridge
from app.services.asset_service import get_asset, update_thumbnail
from app.services.project_context import PROJECT_ROOT

_JOBS_DIR = PROJECT_ROOT / "storage" / "thumbnails"
_OUTPUT_DIR = PROJECT_ROOT / "exports" / "thumbnails"
_SCRIPT_PATH = str(PROJECT_ROOT / "workers" / "blender_thumbnail.py")


def _job_path(job_id: str) -> Path:
    return _JOBS_DIR / f"{job_id}.json"


def _load_job(job_id: str) -> ThumbnailRenderJob | None:
    p = _job_path(job_id)
    if not p.exists():
        return None
    try:
        return ThumbnailRenderJob.model_validate(json.loads(p.read_text(encoding="utf-8")))
    except Exception:
        return None


def _save_job(job: ThumbnailRenderJob) -> None:
    _JOBS_DIR.mkdir(parents=True, exist_ok=True)
    _job_path(job.id).write_text(job.model_dump_json(indent=2), encoding="utf-8")


def get_thumbnail_job(job_id: str) -> ThumbnailRenderJob | None:
    return _load_job(job_id)


def list_thumbnail_jobs(asset_id: str | None = None) -> list[ThumbnailRenderJob]:
    if not _JOBS_DIR.exists():
        return []
    jobs: list[ThumbnailRenderJob] = []
    for p in sorted(_JOBS_DIR.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
        try:
            job = ThumbnailRenderJob.model_validate(json.loads(p.read_text(encoding="utf-8")))
            if asset_id is None or job.asset_id == asset_id:
                jobs.append(job)
        except Exception:
            continue
    return jobs


def _thumbnail_url(job_id: str) -> str:
    return f"/export-packages/thumbnails/{job_id}/thumbnail.png"


def _execute_render(job_id: str) -> None:
    """Background daemon thread: runs Blender render and updates job + asset."""
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

    glb_path = asset.file_path
    output_dir = _OUTPUT_DIR / job.id
    output_dir.mkdir(parents=True, exist_ok=True)
    output_png = str(output_dir / "thumbnail.png")

    blender_info = blender_bridge.detect()
    glb_exists = Path(glb_path).is_file()
    can_render = blender_info["found"] and glb_exists

    if can_render:
        success, stdout, stderr = blender_bridge.run_thumbnail_render(
            glb_path=glb_path,
            output_png=output_png,
            script_path=_SCRIPT_PATH,
            render_type=job.render_type,
            timeout=120,
        )
        logs = ""
        if stdout:
            logs += stdout
        if stderr:
            logs += f"\n--- stderr ---\n{stderr}"

        if success and Path(output_png).exists():
            thumbnail_url = _thumbnail_url(job.id)
            update_thumbnail(job.asset_id, thumbnail_url)
            job.output_image = thumbnail_url
            job.fallback = False
            job.provider = "blender"
            job.message = logs[:2000] if logs else "Render complete"
            job.status = "completed"
        else:
            _apply_fallback(job, asset)
    else:
        reason = "Blender not available" if not blender_info["found"] else "GLB file not found"
        _apply_fallback(job, asset, reason)

    job.updated_at = datetime.now(timezone.utc).isoformat()
    _save_job(job)


def _apply_fallback(job: ThumbnailRenderJob, asset, reason: str = "") -> None:
    """Use existing preview_image as fallback thumbnail."""
    job.fallback = True
    job.provider = "fallback"
    if asset.preview_image:
        job.output_image = asset.preview_image
        update_thumbnail(job.asset_id, asset.preview_image)
        job.message = f"Blender unavailable — using existing preview image. {reason}".strip()
        job.status = "completed"
    else:
        job.message = f"Blender unavailable and no preview image exists. {reason}".strip()
        job.status = "failed"


def create_thumbnail_job(
    asset_id: str,
    render_type: str = "preview",
    project_id: str | None = None,
) -> ThumbnailRenderJob:
    if render_type not in VALID_RENDER_TYPES:
        raise ValueError(f"Invalid render_type: {render_type!r}. Must be one of: {sorted(VALID_RENDER_TYPES)}")

    asset = get_asset(asset_id, project_id)
    if asset is None:
        raise ValueError(f"Asset {asset_id!r} not found")

    now = datetime.now(timezone.utc).isoformat()
    job = ThumbnailRenderJob(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        version=asset.version,
        render_type=render_type,
        status="queued",
        created_at=now,
        updated_at=now,
    )
    _save_job(job)

    thread = threading.Thread(target=_execute_render, args=(job.id,), daemon=True)
    thread.start()
    return job


def save_viewer_capture(asset_id: str, data_url: str, project_id: str | None = None) -> str:
    """
    Save a browser-captured data URL as a PNG thumbnail for the asset.
    Returns the public thumbnail URL.
    """
    if not data_url.startswith("data:image/png;base64,"):
        raise ValueError("data_url must be a PNG data URL (data:image/png;base64,...)")

    b64 = data_url[len("data:image/png;base64,"):]
    raw = base64.b64decode(b64)

    capture_dir = _OUTPUT_DIR / "captures" / asset_id
    capture_dir.mkdir(parents=True, exist_ok=True)
    output_png = capture_dir / "thumbnail.png"
    output_png.write_bytes(raw)

    thumbnail_url = f"/export-packages/thumbnails/captures/{asset_id}/thumbnail.png"
    update_thumbnail(asset_id, thumbnail_url, project_id)
    return thumbnail_url
