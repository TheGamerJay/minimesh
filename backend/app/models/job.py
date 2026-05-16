from __future__ import annotations

from pydantic import BaseModel


class Job(BaseModel):
    id: str
    status: str  # queued | processing | completed | failed
    mode: str
    style_direction: str
    rig_intent: str
    target_quality: str
    texture_style: str
    provider: str
    image_count: int
    created_at: str
    updated_at: str
    result_path: str | None = None
    error: str | None = None
    # Phase 14 â€” real provider fields
    external_job_id: str | None = None
    preview_url: str | None = None
    model_url: str | None = None
    model_downloaded: bool = False
    glb_path: str | None = None
    progress: int = 0
