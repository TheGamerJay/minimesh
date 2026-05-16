import json
from datetime import datetime, timezone

from app.models.job import Job
from app.services.providers.base import BaseProvider
from app.services.upload_service import PROJECT_ROOT

_EXPORTS_DIR = PROJECT_ROOT / "exports" / "jobs"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class MockProvider(BaseProvider):
    name = "mock"

    def submit(self, job: Job) -> Job:
        job.status = "queued"
        job.updated_at = _now()
        return job

    def poll(self, job: Job) -> Job:
        try:
            created = datetime.fromisoformat(job.created_at)
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
        except ValueError:
            created = datetime.now(timezone.utc)

        elapsed = (datetime.now(timezone.utc) - created).total_seconds()

        if elapsed < 4:
            job.status = "queued"
        elif elapsed < 12:
            job.status = "processing"
        else:
            job.status = "completed"
            result_dir = _EXPORTS_DIR / job.id
            result_dir.mkdir(parents=True, exist_ok=True)
            result_file = result_dir / "result.json"
            if not result_file.exists():
                result_data = {
                    "job_id": job.id,
                    "provider": "mock",
                    "mode": job.mode,
                    "style_direction": job.style_direction,
                    "output_format": "GLTF",
                    "mesh_file": f"{job.id}.gltf",
                    "texture_file": f"{job.id}_texture.png",
                    "polygon_count": 12500,
                    "note": "Mock result â€” no real 3D mesh was generated.",
                }
                result_file.write_text(json.dumps(result_data, indent=2), encoding="utf-8")
            job.result_path = f"exports/jobs/{job.id}/result.json"

        job.updated_at = _now()
        return job
