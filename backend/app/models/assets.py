from __future__ import annotations
from pydantic import BaseModel

VALID_ASSET_TYPES = {"glb", "gltf", "obj", "fbx"}


class AssetVersion(BaseModel):
    version: int
    file_path: str
    created_at: str
    provider: str


class GeneratedAsset(BaseModel):
    id: str
    project_id: str
    source_job_id: str
    provider: str
    asset_type: str          # glb | gltf | obj | fbx
    file_path: str
    name: str = ""
    preview_image: str | None = None
    thumbnail: str | None = None
    polygon_count: int | None = None   # None until real extraction is implemented
    file_size: int = 0                 # bytes
    created_at: str
    updated_at: str
    version: int = 1
    tags: list[str] = []
    versions: list[AssetVersion] = []
