from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.models.thumbnails import ThumbnailRenderJob
from app.services import thumbnail_service

router = APIRouter(prefix="/api/thumbnails", tags=["thumbnails"])


class CaptureRequest(BaseModel):
    data_url: str


@router.post("/render/{asset_id}", response_model=ThumbnailRenderJob, status_code=201)
async def render_thumbnail(asset_id: str, render_type: str = "preview"):
    try:
        job = thumbnail_service.create_thumbnail_job(asset_id, render_type=render_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return job


@router.post("/capture/{asset_id}", status_code=200)
async def capture_viewer_thumbnail(asset_id: str, body: CaptureRequest):
    try:
        url = thumbnail_service.save_viewer_capture(asset_id, body.data_url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"thumbnail_url": url}


@router.get("/{job_id}", response_model=ThumbnailRenderJob)
async def get_thumbnail_job(job_id: str):
    job = thumbnail_service.get_thumbnail_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Thumbnail job not found")
    return job


@router.get("", response_model=list[ThumbnailRenderJob])
async def list_thumbnail_jobs(asset_id: Optional[str] = Query(None)):
    return thumbnail_service.list_thumbnail_jobs(asset_id)
