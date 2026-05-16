from __future__ import annotations

from pydantic import BaseModel

VALID_EXPORT_TYPES = {
    "preview_package",
    "glb",
    "gltf",
    "obj",
    "fbx",
    "zip_bundle",
}


class ExportFile(BaseModel):
    filename: str
    path: str
    type: str
    size: int
    created_at: str


class ExportManifest(BaseModel):
    job_id: str
    export_id: str
    provider: str
    mode: str
    export_type: str
    files: list[ExportFile]
    created_at: str
