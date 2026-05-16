from __future__ import annotations
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

from app.models.textures import TextureAsset, MaterialTextureSet, VALID_TEXTURE_TYPES
from app.services import texture_service
from app.services.project_context import get_textures_dir, get_active_project_id

router = APIRouter(prefix="/api/textures", tags=["textures"])


class AssignBody(BaseModel):
    material_profile_id: str
    textures: dict[str, str]   # texture_type → texture_id
    asset_id: Optional[str] = None


@router.get("", response_model=list[TextureAsset])
def list_textures():
    return texture_service.list_textures()


@router.post("/upload", response_model=TextureAsset, status_code=201)
async def upload_texture(
    file: UploadFile = File(...),
    texture_type: str = Form("albedo"),
    name: str = Form(""),
    tags: str = Form(""),
):
    if texture_type not in VALID_TEXTURE_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid texture_type. Allowed: {sorted(VALID_TEXTURE_TYPES)}")

    content = await file.read()
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    try:
        asset = texture_service.save_texture_file(
            file_bytes=content,
            original_filename=file.filename or "texture.png",
            texture_type=texture_type,
            name=name,
            tags=tag_list,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return asset


@router.delete("/{texture_id}")
def delete_texture(texture_id: str):
    removed = texture_service.delete_texture(texture_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Texture not found")
    return {"deleted": texture_id}


@router.post("/assign", response_model=MaterialTextureSet)
def assign_textures(body: AssignBody):
    try:
        result = texture_service.assign_textures(
            material_profile_id=body.material_profile_id,
            textures=body.textures,
            asset_id=body.asset_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


@router.get("/assignment/{material_profile_id}", response_model=MaterialTextureSet)
def get_assignment(material_profile_id: str):
    result = texture_service.get_assignment(material_profile_id)
    if result is None:
        raise HTTPException(status_code=404, detail="No assignment found for this material profile")
    return result


@router.get("/file/{texture_id}")
def serve_texture_file(texture_id: str):
    """Serve raw texture file by texture ID (active project)."""
    path = texture_service.get_texture_file_path(texture_id)
    if path is None or not path.exists():
        raise HTTPException(status_code=404, detail="Texture file not found")
    return FileResponse(str(path))
