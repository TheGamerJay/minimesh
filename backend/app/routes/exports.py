from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.models.export import ExportManifest
from app.services.export_service import (
    create_export as svc_create_export,
    get_export,
    get_zip_path,
    list_exports_for_job,
)
from app.services.job_service import get_job

router = APIRouter(prefix="/api/exports", tags=["exports"])


@router.post("/{job_id}/create", response_model=ExportManifest, status_code=201)
async def create_export_route(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed":
        raise HTTPException(
            status_code=422,
            detail=f"Job is '{job.status}' â€” only completed jobs can be exported",
        )
    return svc_create_export(job)


# /job/{job_id} registered before /{export_id} to prevent route shadowing
@router.get("/job/{job_id}", response_model=list[ExportManifest])
async def list_job_exports(job_id: str):
    return list_exports_for_job(job_id)


@router.get("/{export_id}/download")
async def download_export(export_id: str):
    zip_path = get_zip_path(export_id)
    if zip_path is None:
        raise HTTPException(status_code=404, detail="Export ZIP not found")
    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename="minimesh_export.zip",
        headers={"Content-Disposition": 'attachment; filename="minimesh_export.zip"'},
    )


@router.get("/{export_id}", response_model=ExportManifest)
async def get_export_route(export_id: str):
    manifest = get_export(export_id)
    if manifest is None:
        raise HTTPException(status_code=404, detail="Export not found")
    return manifest
