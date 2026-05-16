import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.job import Job
from app.services.providers.mock_provider import MockProvider
from app.services.project_context import get_jobs_dir


class JobValidationError(Exception):
    pass


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_provider():
    """Return the active provider based on configured API keys."""
    from app.services.provider_service import get_active_provider_name
    name = get_active_provider_name()
    if name == "meshy":
        from app.services.providers.meshy_provider import MeshyProvider
        return MeshyProvider()
    return MockProvider()


def _jobs_dir() -> Path:
    d = get_jobs_dir()
    d.mkdir(parents=True, exist_ok=True)
    return d


def _job_file(job_id: str) -> Path:
    return _jobs_dir() / f"{job_id}.json"


def _load_job(job_id: str) -> Job | None:
    f = _job_file(job_id)
    if not f.exists():
        return None
    try:
        return Job.model_validate_json(f.read_text(encoding="utf-8"))
    except Exception:
        return None


def _persist_job(job: Job) -> None:
    _jobs_dir().mkdir(parents=True, exist_ok=True)
    _job_file(job.id).write_text(job.model_dump_json(indent=2), encoding="utf-8")


def create_job() -> Job:
    from app.services.project_service import get_or_create_session, get_required_missing_for_mode
    from app.services.generation_service import get_or_create_config
    from app.services.credit_service import spend_credits, get_pricing

    session = get_or_create_session()
    config = get_or_create_config()

    if not session.images:
        raise JobValidationError(
            "No reference images uploaded. Upload at least one image before generating."
        )

    if session.readiness.status == "not_ready":
        raise JobValidationError(
            "Reference set is not ready. At minimum, a front view image is required for most output types."
        )

    required_missing = get_required_missing_for_mode(config.mode, session.images)
    if required_missing:
        label_list = ", ".join(required_missing)
        raise JobValidationError(
            f"Missing required references for this output type: {label_list}"
        )

    # Charge credits after all validation passes
    pricing = get_pricing()
    spend_credits(pricing.generation_cost, "generation", "create_job", "Generate Draft Mesh")

    provider = _get_provider()
    job_id = str(uuid.uuid4())
    now = _now()
    job = Job(
        id=job_id,
        status="queued",
        mode=config.mode,
        style_direction=config.style_direction,
        rig_intent=config.rig_intent,
        target_quality=config.target_quality,
        texture_style=config.texture_style,
        provider=provider.name,
        image_count=len(session.images),
        created_at=now,
        updated_at=now,
    )
    job = provider.submit(job)
    _persist_job(job)
    return job


def get_job(job_id: str) -> Job | None:
    job = _load_job(job_id)
    if job is None:
        return None
    if job.status not in ("completed", "failed"):
        # Use the same provider that created the job
        if job.provider == "meshy":
            from app.services.providers.meshy_provider import MeshyProvider
            provider = MeshyProvider()
        else:
            provider = MockProvider()
        job = provider.poll(job)
        _persist_job(job)
    return job


def list_jobs() -> list[Job]:
    jobs: list[Job] = []
    d = get_jobs_dir()
    if not d.exists():
        return jobs
    for f in sorted(d.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            job = Job.model_validate_json(f.read_text(encoding="utf-8"))
            if job.status not in ("completed", "failed"):
                if job.provider == "meshy":
                    from app.services.providers.meshy_provider import MeshyProvider
                    provider = MeshyProvider()
                else:
                    provider = MockProvider()
                job = provider.poll(job)
                _persist_job(job)
            jobs.append(job)
        except Exception:
            continue
    return jobs
