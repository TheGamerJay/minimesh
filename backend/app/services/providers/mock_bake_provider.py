from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

from app.models.baking import BakeJob, BAKE_OUTPUT_MAPS
from app.services.project_context import PROJECT_ROOT

_BAKE_COMPLETE_SECS = 6
_BAKE_PROCESSING_SECS = 2


def _elapsed(created_at: str) -> float:
    created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - created).total_seconds()


def poll(job: BakeJob) -> BakeJob:
    elapsed = _elapsed(job.created_at)
    now = datetime.now(timezone.utc).isoformat()

    if elapsed < _BAKE_PROCESSING_SECS:
        job.status = "queued"
        job.progress = 0
        job.message = "Bake job queued — waiting for worker"
    elif elapsed < _BAKE_COMPLETE_SECS:
        job.status = "processing"
        span = _BAKE_COMPLETE_SECS - _BAKE_PROCESSING_SECS
        job.progress = min(99, int((elapsed - _BAKE_PROCESSING_SECS) / span * 100))
        job.message = f"Baking textures… {job.progress}%"
    else:
        job.status = "completed"
        job.progress = 100
        job.output_maps = BAKE_OUTPUT_MAPS.get(job.bake_type, [job.bake_type])
        job.message = f"Bake complete — {len(job.output_maps)} map(s) ready (mock)"
        _write_result(job)

    job.updated_at = now
    return job


def _write_result(job: BakeJob) -> None:
    out_dir = PROJECT_ROOT / "exports" / "bakes" / job.id
    out_dir.mkdir(parents=True, exist_ok=True)
    result = {
        "bake_job_id": job.id,
        "asset_id": job.asset_id,
        "bake_type": job.bake_type,
        "provider": "mock",
        "output_maps": job.output_maps,
        "completed_at": job.updated_at,
        "note": "Mock bake result — no real textures were generated.",
    }
    (out_dir / "bake_result.json").write_text(
        json.dumps(result, indent=2), encoding="utf-8"
    )
