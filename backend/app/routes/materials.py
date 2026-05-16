from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.materials import MaterialProfile
from app.services import material_service

router = APIRouter(prefix="/api/materials", tags=["materials"])


class MaterialCreateRequest(BaseModel):
    name: str = "Custom Material"
    shader_type: str = "pbr"
    base_color: str = "#1e293b"
    secondary_color: str = "#334155"
    emissive_color: str = "#06b6d4"
    metallic: float = 0.5
    roughness: float = 0.5
    emissive_intensity: float = 0.2
    opacity: float = 1.0
    rim_light: bool = False
    toon_steps: int = 3


class MaterialUpdateRequest(BaseModel):
    name: str | None = None
    shader_type: str | None = None
    base_color: str | None = None
    secondary_color: str | None = None
    emissive_color: str | None = None
    metallic: float | None = None
    roughness: float | None = None
    emissive_intensity: float | None = None
    opacity: float | None = None
    rim_light: bool | None = None
    toon_steps: int | None = None


@router.get("", response_model=list[MaterialProfile])
async def list_materials():
    return material_service.list_materials()


@router.post("/create", response_model=MaterialProfile, status_code=201)
async def create_material(body: MaterialCreateRequest):
    return material_service.create_material(body.model_dump(exclude_none=False))


@router.patch("/{material_id}", response_model=MaterialProfile)
async def update_material(material_id: str, body: MaterialUpdateRequest):
    return material_service.update_material(
        material_id, body.model_dump(exclude_none=True)
    )


@router.delete("/{material_id}", status_code=204)
async def delete_material(material_id: str):
    material_service.delete_material(material_id)


@router.post("/{material_id}/activate", response_model=MaterialProfile)
async def activate_material(material_id: str):
    return material_service.activate_material(material_id)
