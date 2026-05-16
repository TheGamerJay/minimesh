from __future__ import annotations
import base64
import json
from datetime import datetime, timezone
from typing import Any

import httpx

from app.models.job import Job
from app.services.providers.base import BaseProvider
from app.services.project_context import PROJECT_ROOT, get_uploads_dir

_MESHY_BASE = "https://api.meshy.ai"
_EXPORTS_DIR = PROJECT_ROOT / "exports" / "jobs"

_STATUS_MAP = {
    "PENDING": "queued",
    "IN_PROGRESS": "processing",
    "SUCCEEDED": "completed",
    "FAILED": "failed",
    "EXPIRED": "failed",
}

_MIME_MAP = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _api_key() -> str:
    from app.config import settings
    return settings.MESHY_API_KEY.strip()


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
    }


def _primary_image_data_uri() -> str | None:
    """Return the first uploaded image as a base64 data URI, or None."""
    uploads_dir = get_uploads_dir()
    if not uploads_dir.exists():
        return None

    candidates: list = []
    for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
        candidates.extend(sorted(uploads_dir.glob(ext)))

    if not candidates:
        return None

    img_path = candidates[0]
    mime = _MIME_MAP.get(img_path.suffix.lower(), "image/jpeg")
    encoded = base64.b64encode(img_path.read_bytes()).decode("utf-8")
    return f"data:{mime};base64,{encoded}"


class MeshyProvider(BaseProvider):
    name = "meshy"

    # â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def submit(self, job: Job) -> Job:
        image_uri = _primary_image_data_uri()
        if not image_uri:
            job.status = "failed"
            job.error = "No uploaded images found. Upload at least one image before generating."
            job.updated_at = _now()
            return job

        payload: dict[str, Any] = {
            "image_url": image_uri,
            "enable_pbr": False,
            "should_remesh": False,
            "topology": "triangle",
            "target_polycount": 30000,
        }

        try:
            with httpx.Client(timeout=30) as client:
                res = client.post(
                    f"{_MESHY_BASE}/openapi/v2/image-to-3d",
                    json=payload,
                    headers=_headers(),
                )
                if res.status_code == 401:
                    raise ValueError("Invalid Meshy API key (401 Unauthorized).")
                if res.status_code == 422:
                    raise ValueError(f"Meshy rejected request: {res.text}")
                res.raise_for_status()
                data = res.json()
                task_id = data.get("result")
                if not task_id:
                    raise ValueError(f"Unexpected Meshy response: {data}")
                job.external_job_id = str(task_id)
                job.status = "queued"
                job.progress = 0
        except Exception as exc:
            job.status = "failed"
            job.error = f"Meshy submission failed: {exc}"

        job.updated_at = _now()
        return job

    # â”€â”€ Poll â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def poll(self, job: Job) -> Job:
        if not job.external_job_id:
            job.status = "failed"
            job.error = "Missing external_job_id â€” cannot poll Meshy."
            job.updated_at = _now()
            return job

        try:
            with httpx.Client(timeout=30) as client:
                res = client.get(
                    f"{_MESHY_BASE}/openapi/v2/image-to-3d/{job.external_job_id}",
                    headers=_headers(),
                )
                res.raise_for_status()
                data = res.json()

            raw_status = data.get("status", "PENDING")
            job.status = _STATUS_MAP.get(raw_status, "processing")
            job.progress = int(data.get("progress", 0))

            model_urls = data.get("model_urls") or {}
            job.model_url = model_urls.get("glb")
            job.preview_url = data.get("thumbnail_url")

            if job.status == "completed":
                job = self.download_result(job)
                self._save_provider_result(job, data)

            if job.status == "failed":
                job.error = data.get("task_error", {}).get("message") or "Meshy job failed."

        except Exception as exc:
            # Don't fail the job on transient network errors
            job.error = f"Meshy poll error (transient): {exc}"

        job.updated_at = _now()
        return job

    # â”€â”€ Download â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def download_result(self, job: Job) -> Job:
        if not job.model_url:
            return job

        result_dir = _EXPORTS_DIR / job.id
        result_dir.mkdir(parents=True, exist_ok=True)
        glb_path = result_dir / "model.glb"

        if glb_path.exists():
            job.model_downloaded = True
            job.glb_path = f"exports/jobs/{job.id}/model.glb"
            return job

        try:
            with httpx.Client(timeout=120, follow_redirects=True) as client:
                res = client.get(job.model_url)
                res.raise_for_status()
                glb_path.write_bytes(res.content)
            job.model_downloaded = True
            job.glb_path = f"exports/jobs/{job.id}/model.glb"
        except Exception as exc:
            job.error = f"GLB download failed: {exc}"

        return job

    # â”€â”€ Normalize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def normalize_result(self, raw: dict) -> dict:
        model_urls = raw.get("model_urls") or {}
        return {
            "provider": "meshy",
            "external_id": raw.get("id"),
            "status": _STATUS_MAP.get(raw.get("status", ""), "unknown"),
            "progress": raw.get("progress", 0),
            "model_urls": model_urls,
            "thumbnail_url": raw.get("thumbnail_url"),
            "finished_at": raw.get("finished_at"),
        }

    def _save_provider_result(self, job: Job, raw: dict) -> None:
        result_dir = _EXPORTS_DIR / job.id
        result_dir.mkdir(parents=True, exist_ok=True)
        (result_dir / "provider_result.json").write_text(
            json.dumps(self.normalize_result(raw), indent=2, default=str),
            encoding="utf-8",
        )
