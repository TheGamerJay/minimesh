from __future__ import annotations
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.baking import BakeJob, VALID_BAKE_TYPES
from app.services.project_context import PROJECT_ROOT

_BAKE_DIR = PROJECT_ROOT / "storage" / "bakes"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _job_path(job_id: str) -> Path:
    return _BAKE_DIR / f"{job_id}.json"


def _load(job_id: str) -> BakeJob | None:
    p = _job_path(job_id)
    if not p.exists():
        return None
    try:
        return BakeJob.model_validate_json(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def _persist(job: BakeJob) -> None:
    _BAKE_DIR.mkdir(parents=True, exist_ok=True)
    _job_path(job.id).write_text(job.model_dump_json(indent=2), encoding="utf-8")


def create_bake_job(asset_id: str, bake_type: str) -> BakeJob:
    if bake_type not in VALID_BAKE_TYPES:
        raise ValueError(f"Invalid bake_type: {bake_type}. Allowed: {sorted(VALID_BAKE_TYPES)}")

    now = _now()
    job = BakeJob(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        status="queued",
        bake_type=bake_type,
        provider="mock",
        message="Bake job created",
        created_at=now,
        updated_at=now,
    )
    _persist(job)
    return job


def get_bake_job(job_id: str) -> BakeJob | None:
    job = _load(job_id)
    if job is None:
        return None
    if job.status not in ("completed", "failed"):
        from app.services.providers.mock_bake_provider import poll
        job = poll(job)
        _persist(job)
    return job


def list_bake_jobs(asset_id: str | None = None) -> list[BakeJob]:
    jobs: list[BakeJob] = []
    if not _BAKE_DIR.exists():
        return jobs
    for f in sorted(_BAKE_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            job = BakeJob.model_validate_json(f.read_text(encoding="utf-8"))
            if job.status not in ("completed", "failed"):
                from app.services.providers.mock_bake_provider import poll
                job = poll(job)
                _persist(job)
            if asset_id is None or job.asset_id == asset_id:
                jobs.append(job)
        except Exception:
            continue
    return jobs
