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


def _get_provider_by_name(name: str):
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


def _submit_with_fallback(job: Job) -> Job:
    """Try providers in priority order, falling back on submit errors."""
    from app.services import provider_registry as reg
    from app.config import settings

    priority = reg.load_priority()
    keys = {
        "meshy": settings.MESHY_API_KEY,
        "tripo": settings.TRIPO_API_KEY,
        "rodin": settings.RODIN_API_KEY,
        "mock": "",
    }
    attempts: list[str] = []

    for name in priority:
        meta = reg.PROVIDER_METADATA.get(name)
        if not meta:
            continue
        if not reg.is_enabled(name):
            continue
        if meta["stub"]:
            continue
        if not meta["capabilities"].get("generation", False):
            continue
        if meta["requires_key"] and not keys.get(name, "").strip():
            continue
        try:
            provider = _get_provider_by_name(name)
            job.provider = name
            job = provider.submit(job)
            attempts.append(f"{name}_submitted")
            job.provider_attempts = attempts
            return job
        except Exception:
            attempts.append(f"{name}_failed")
            continue

    # Hard fallback — mock always works
    attempts.append("mock_fallback")
    job.provider = "mock"
    job = MockProvider().submit(job)
    job.provider_attempts = attempts
    return job


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

    pricing = get_pricing()
    spend_credits(pricing.generation_cost, "generation", "create_job", "Generate Draft Mesh")

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
        provider="mock",
        image_count=len(session.images),
        created_at=now,
        updated_at=now,
    )
    job = _submit_with_fallback(job)
    _persist_job(job)
    return job


def _maybe_register_asset(job: Job) -> Job:
    """Auto-register GLB as an asset when a real provider job completes."""
    if job.status == "completed" and job.model_downloaded and not job.asset_id:
        try:
            from app.services.asset_service import auto_register_from_job
            asset = auto_register_from_job(job)
            if asset:
                job.asset_id = asset.id
        except Exception:
            pass
    return job


def get_job(job_id: str) -> Job | None:
    job = _load_job(job_id)
    if job is None:
        return None
    if job.status not in ("completed", "failed"):
        provider = _get_provider_by_name(job.provider)
        job = provider.poll(job)
        job = _maybe_register_asset(job)
        _persist_job(job)
    elif job.status == "completed" and job.model_downloaded and not job.asset_id:
        job = _maybe_register_asset(job)
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
                provider = _get_provider_by_name(job.provider)
                job = provider.poll(job)
                job = _maybe_register_asset(job)
                _persist_job(job)
            elif job.status == "completed" and job.model_downloaded and not job.asset_id:
                job = _maybe_register_asset(job)
                _persist_job(job)
            jobs.append(job)
        except Exception:
            continue
    return jobs
