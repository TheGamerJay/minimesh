from __future__ import annotations
import json
from datetime import datetime, timezone

from app.services.project_context import get_export_animations_dir


class MockAnimationProvider:
    name = "mock_animation"

    def submit(self, anim_job) -> None:
        anim_job.status = "queued"
        anim_job.message = "Mock animation job queued."

    def poll(self, anim_job) -> None:
        created = datetime.fromisoformat(anim_job.created_at)
        elapsed = (datetime.now(timezone.utc) - created).total_seconds()

        if elapsed < 2:
            anim_job.status = "queued"
            anim_job.message = "Waiting for animation worker..."
        elif elapsed < 7:
            anim_job.status = "processing"
            anim_job.message = f"Retargeting motion clip... ({int(elapsed - 2)}/5s)"
        else:
            anim_job.status = "completed"
            anim_job.message = (
                "Mock animation preview complete. "
                "Real retargeting will be integrated in future phases."
            )
            anim_job.output_files = [
                f"exports/animations/{anim_job.id}/animation_data.json"
            ]
            self._write_result(anim_job)

    def _write_result(self, anim_job) -> None:
        out_dir = get_export_animations_dir() / anim_job.id
        out_dir.mkdir(parents=True, exist_ok=True)
        result = {
            "animation_job_id": anim_job.id,
            "clip_id": anim_job.clip_id,
            "provider": anim_job.provider,
            "message": anim_job.message,
            "outputs": [],
        }
        (out_dir / "animation_data.json").write_text(json.dumps(result, indent=2))
