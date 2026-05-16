from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.models.baking import UVAnalysis, BakeJob
from app.services import bake_service, uv_service
from app.services.texture_service import list_textures

router = APIRouter(prefix="/api/bakes", tags=["bakes"])


class CreateBakeBody(BaseModel):
    asset_id: str
    bake_type: str = "full_pbr"


class ValidateBody(BaseModel):
    assigned_textures: dict[str, str]


@router.get("/uv/{asset_id}", response_model=UVAnalysis)
def get_uv_analysis(asset_id: str):
    return uv_service.analyze_uv(asset_id)


@router.post("/validate")
def validate_textures(body: ValidateBody):
    all_textures = list_textures()
    available_ids = {t.id for t in all_textures}
    return uv_service.validate_textures(body.assigned_textures, available_ids)


@router.post("/create", response_model=BakeJob, status_code=201)
def create_bake_job(body: CreateBakeBody):
    try:
        return bake_service.create_bake_job(body.asset_id, body.bake_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("", response_model=list[BakeJob])
def list_bake_jobs(asset_id: Optional[str] = None):
    return bake_service.list_bake_jobs(asset_id)


@router.get("/{bake_job_id}", response_model=BakeJob)
def get_bake_job(bake_job_id: str):
    job = bake_service.get_bake_job(bake_job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Bake job not found")
    return job
