from __future__ import annotations
from pydantic import BaseModel

VALID_BAKE_TYPES = {"albedo", "normal", "roughness", "ao", "emissive", "full_pbr"}
BAKE_OUTPUT_MAPS = {
    "albedo":   ["albedo"],
    "normal":   ["normal"],
    "roughness": ["roughness"],
    "ao":       ["ao"],
    "emissive": ["emissive"],
    "full_pbr": ["albedo", "normal", "roughness", "metallic", "ao", "emissive"],
}


class UVAnalysis(BaseModel):
    has_uvs: bool
    uv_channel_count: int
    overlapping_uvs: bool
    estimated_uv_coverage: int      # 0–100 percent
    warnings: list[str] = []


class BakeJob(BaseModel):
    id: str
    asset_id: str
    status: str                     # queued | processing | completed | failed
    bake_type: str
    provider: str = "mock"
    output_maps: list[str] = []
    progress: int = 0
    message: str = ""
    error: str | None = None
    created_at: str
    updated_at: str
