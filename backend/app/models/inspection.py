from __future__ import annotations
from pydantic import BaseModel


class BoundingBox(BaseModel):
    width: float = 0.0
    height: float = 0.0
    depth: float = 0.0


class GLBInspectionReport(BaseModel):
    asset_id: str
    object_count: int = 0
    mesh_count: int = 0
    material_count: int = 0
    estimated_triangles: int = 0
    bounding_box: BoundingBox = BoundingBox()
    object_names: list[str] = []
    material_names: list[str] = []
    has_armature: bool = False
    has_animations: bool = False
    has_uvs: bool = True
    file_size: int = 0
    generated_at: str
    fallback_estimate: bool = False
    blender_used: bool = False
    blender_version: str = ""
    blender_logs: str = ""
