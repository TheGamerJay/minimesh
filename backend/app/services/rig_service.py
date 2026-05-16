from __future__ import annotations
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models.rig import BUILT_IN_PROFILES, VALID_RIG_TYPES, RigJob, RigProfile
from app.services.providers.mock_rig_provider import MockRigProvider
from app.services.project_context import get_rigs_dir

_PROVIDER = MockRigProvider()


def get_profiles() -> list[RigProfile]:
    return [RigProfile(**p) for p in BUILT_IN_PROFILES]


def _rigs_dir() -> Path:
    d = get_rigs_dir()
    d.mkdir(parents=True, exist_ok=True)
    return d


def _job_path(rig_job_id: str) -> Path:
    return _rigs_dir() / f"{rig_job_id}.json"


def _load(rig_job_id: str) -> RigJob:
    p = _job_path(rig_job_id)
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"Rig job {rig_job_id} not found")
    return RigJob.model_validate_json(p.read_text())


def _save(rig_job: RigJob) -> None:
    rig_job.updated_at = datetime.now(timezone.utc).isoformat()
    _job_path(rig_job.id).write_text(rig_job.model_dump_json(indent=2))


def create_rig_job(source_job_id: str, rig_type: str) -> RigJob:
    from app.services.job_service import get_job
    from app.services.credit_service import spend_credits, get_pricing

    job = get_job(source_job_id)
    if job is None or job.status != "completed":
        raise HTTPException(
            status_code=422,
            detail="Source job must be completed before rigging.",
        )
    if rig_type not in VALID_RIG_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid rig_type. Valid: {sorted(VALID_RIG_TYPES)}",
        )

    pricing = get_pricing()
    spend_credits(pricing.rigging_cost, "rigging", "create_rig_job", "Create Rig Job")

    now = datetime.now(timezone.utc).isoformat()
    rig_job = RigJob(
        id=str(uuid.uuid4()),
        source_job_id=source_job_id,
        status="queued",
        rig_type=rig_type,
        provider=_PROVIDER.name,
        skeleton_data=None,
        outputs=[],
        message="",
        error=None,
        created_at=now,
        updated_at=now,
    )
    _PROVIDER.submit(rig_job)
    _save(rig_job)
    return rig_job


def get_rig_job(rig_job_id: str) -> RigJob:
    rig_job = _load(rig_job_id)
    if rig_job.status not in ("completed", "failed"):
        _PROVIDER.poll(rig_job)
        _save(rig_job)
    return rig_job


def list_rig_jobs() -> list[RigJob]:
    d = _rigs_dir()
    paths = sorted(d.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    result = []
    for p in paths:
        try:
            rj = RigJob.model_validate_json(p.read_text())
            if rj.status not in ("completed", "failed"):
                _PROVIDER.poll(rj)
                _save(rj)
            result.append(rj)
        except Exception:
            continue
    return result
