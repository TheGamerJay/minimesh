from __future__ import annotations
from pydantic import BaseModel

VALID_TEXTURE_TYPES = {"albedo", "normal", "roughness", "metallic", "emissive", "opacity", "ao"}


class TextureAsset(BaseModel):
    id: str
    project_id: str
    name: str
    texture_type: str          # albedo | normal | roughness | metallic | emissive | opacity | ao
    filename: str              # stored filename (served at /textures/{filename})
    file_size: int = 0         # bytes
    resolution: str | None = None   # "1024x1024" — populated when detectable
    created_at: str
    tags: list[str] = []


class MaterialTextureSet(BaseModel):
    id: str
    asset_id: str | None = None
    material_profile_id: str
    assigned_textures: dict[str, str] = {}   # texture_type → texture_id
    created_at: str
    updated_at: str
