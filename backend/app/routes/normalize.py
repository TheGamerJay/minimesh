from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.models.normalize import NormalizeJob
from app.services import normalize_service

router = APIRouter(prefix="/api/normalize", tags=["normalize"])


@router.post("/run/{asset_id}", response_model=NormalizeJob, status_code=201)
async def run_normalize(asset_id: str):
    try:
        job = normalize_service.create_normalize_job(asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return job


@router.get("/{job_id}", response_model=NormalizeJob)
async def get_normalize_job(job_id: str):
    job = normalize_service.get_normalize_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Normalize job not found")
    return job


@router.get("", response_model=list[NormalizeJob])
async def list_normalize_jobs(asset_id: Optional[str] = Query(None)):
    return normalize_service.list_normalize_jobs(asset_id)
