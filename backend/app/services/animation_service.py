from __future__ import annotations
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models.animation import BUILT_IN_CLIPS, AnimationClip, AnimationJob
from app.services.providers.mock_animation_provider import MockAnimationProvider
from app.services.project_context import get_animations_dir

_PROVIDER = MockAnimationProvider()
_CLIP_MAP: dict[str, dict] = {c["id"]: c for c in BUILT_IN_CLIPS}


def list_clips() -> list[AnimationClip]:
    return [AnimationClip(**c) for c in BUILT_IN_CLIPS]


def _anims_dir() -> Path:
    d = get_animations_dir()
    d.mkdir(parents=True, exist_ok=True)
    return d


def _job_path(animation_job_id: str) -> Path:
    return _anims_dir() / f"{animation_job_id}.json"


def _load(animation_job_id: str) -> AnimationJob:
    p = _job_path(animation_job_id)
    if not p.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Animation job {animation_job_id} not found",
        )
    return AnimationJob.model_validate_json(p.read_text())


def _save(anim_job: AnimationJob) -> None:
    anim_job.updated_at = datetime.now(timezone.utc).isoformat()
    _job_path(anim_job.id).write_text(anim_job.model_dump_json(indent=2))


def create_animation_job(source_rig_job_id: str, clip_id: str) -> AnimationJob:
    from app.services.rig_service import get_rig_job
    from app.services.credit_service import spend_credits, get_pricing

    rig_job = get_rig_job(source_rig_job_id)
    if rig_job.status != "completed":
        raise HTTPException(
            status_code=422,
            detail="Rig job must be completed before creating an animation job.",
        )

    clip_data = _CLIP_MAP.get(clip_id)
    if not clip_data:
        raise HTTPException(status_code=422, detail=f"Clip '{clip_id}' not found.")

    if rig_job.rig_type not in clip_data["compatible_rig_types"]:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Clip '{clip_id}' is not compatible with rig type '{rig_job.rig_type}'. "
                f"Compatible types: {clip_data['compatible_rig_types']}"
            ),
        )

    pricing = get_pricing()
    spend_credits(pricing.animation_cost, "animation", "create_animation_job", "Preview Animation Clip")

    now = datetime.now(timezone.utc).isoformat()
    anim_job = AnimationJob(
        id=str(uuid.uuid4()),
        source_rig_job_id=source_rig_job_id,
        status="queued",
        clip_id=clip_id,
        provider=_PROVIDER.name,
        output_files=[],
        message="",
        error=None,
        created_at=now,
        updated_at=now,
    )
    _PROVIDER.submit(anim_job)
    _save(anim_job)
    return anim_job


def get_animation_job(animation_job_id: str) -> AnimationJob:
    anim_job = _load(animation_job_id)
    if anim_job.status not in ("completed", "failed"):
        _PROVIDER.poll(anim_job)
        _save(anim_job)
    return anim_job


def list_animation_jobs() -> list[AnimationJob]:
    d = _anims_dir()
    paths = sorted(d.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    result = []
    for p in paths:
        try:
            aj = AnimationJob.model_validate_json(p.read_text())
            if aj.status not in ("completed", "failed"):
                _PROVIDER.poll(aj)
                _save(aj)
            result.append(aj)
        except Exception:
            continue
    return result
