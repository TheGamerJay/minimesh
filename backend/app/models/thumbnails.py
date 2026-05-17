from __future__ import annotations
from pydantic import BaseModel

VALID_RENDER_TYPES = {"preview", "turntable", "material_preview"}
VALID_THUMBNAIL_STATUSES = {"queued", "processing", "completed", "failed"}


class ThumbnailRenderJob(BaseModel):
    id: str
    asset_id: str
    version: int = 1
    status: str = "queued"
    provider: str = "blender"
    render_type: str = "preview"
    output_image: str = ""
    message: str = ""
    fallback: bool = False
    created_at: str
    updated_at: str
