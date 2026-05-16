from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.assets import GeneratedAsset
from app.services import asset_service

router = APIRouter(prefix="/api/assets", tags=["assets"])


class RenameBody(BaseModel):
    name: str


class TagBody(BaseModel):
    tags: list[str]


@router.get("", response_model=list[GeneratedAsset])
def list_assets():
    return asset_service.list_assets()


@router.get("/{asset_id}", response_model=GeneratedAsset)
def get_asset(asset_id: str):
    asset = asset_service.get_asset(asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.delete("/{asset_id}")
def delete_asset(asset_id: str):
    removed = asset_service.delete_asset(asset_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"deleted": asset_id}


@router.post("/{asset_id}/duplicate", response_model=GeneratedAsset)
def duplicate_asset(asset_id: str):
    try:
        return asset_service.duplicate_asset(asset_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{asset_id}/rename", response_model=GeneratedAsset)
def rename_asset(asset_id: str, body: RenameBody):
    try:
        return asset_service.rename_asset(asset_id, body.name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{asset_id}/tags", response_model=GeneratedAsset)
def tag_asset(asset_id: str, body: TagBody):
    try:
        return asset_service.tag_asset(asset_id, body.tags)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
