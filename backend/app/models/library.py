from __future__ import annotations
from pydantic import BaseModel

TEMPLATES = ["blank", "character", "prop", "creature"]


class ProjectSummary(BaseModel):
    id: str
    name: str
    thumbnail: str | None = None
    created_at: str
    updated_at: str
    mode: str = "three_d_model"
    status: str = "draft"
    score: int = 0
    is_active: bool = False


class ProjectDetails(BaseModel):
    summary: ProjectSummary
    upload_count: int = 0
    job_count: int = 0
    rig_count: int = 0
    animation_count: int = 0
    export_count: int = 0
    audit_score: int | None = None
