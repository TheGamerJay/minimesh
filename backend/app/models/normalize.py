from __future__ import annotations
from pydantic import BaseModel

VALID_NORMALIZE_STATUSES = {"queued", "processing", "completed", "failed"}


class NormalizeJob(BaseModel):
    id: str
    asset_id: str
    source_version: int = 1
    output_version: int = 0
    status: str = "queued"
    provider: str = "blender"
    normalization_scale: float = 1.0
    original_bounds: dict = {}
    normalized_bounds: dict = {}
    message: str = ""
    fallback_normalized: bool = False
    created_at: str
    updated_at: str
