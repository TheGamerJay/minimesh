from __future__ import annotations
from pydantic import BaseModel

VALID_EXPORT_TYPES = {
    "glb_package",
    "game_ready",
    "texture_bundle",
    "inspection_bundle",
    "full_project_bundle",
}

# Which file categories each export type includes
EXPORT_TYPE_FLAGS: dict[str, dict[str, bool]] = {
    "glb_package":         {"model": True,  "textures": False, "inspection": False, "thumbnail": True},
    "game_ready":          {"model": True,  "textures": True,  "inspection": False, "thumbnail": True},
    "texture_bundle":      {"model": False, "textures": True,  "inspection": False, "thumbnail": False},
    "inspection_bundle":   {"model": True,  "textures": False, "inspection": True,  "thumbnail": False},
    "full_project_bundle": {"model": True,  "textures": True,  "inspection": True,  "thumbnail": True},
}


class ExportPackageRequest(BaseModel):
    asset_id: str
    export_type: str = "full_project_bundle"
    version_label: str = "latest"   # "latest" | "original" | "normalized"


class ExportManifest(BaseModel):
    minimesh_version: str = "2"
    asset_id: str
    asset_name: str
    version: int
    version_label: str
    provider: str
    normalized: bool
    export_type: str
    textures: list[dict] = []
    has_inspection: bool = False
    inspection_summary: dict | None = None
    thumbnail: str | None = None
    file_count: int = 0
    exported_at: str


class AssetExportPackage(BaseModel):
    id: str
    asset_id: str
    asset_name: str
    export_type: str
    version_exported: int = 1
    version_label: str = "latest"
    included_files: list[str] = []
    manifest_path: str = ""
    zip_path: str = ""
    zip_size: int = 0
    normalized: bool = False
    has_textures: bool = False
    has_inspection: bool = False
    has_thumbnail: bool = False
    created_at: str
