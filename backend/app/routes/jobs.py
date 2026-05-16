from fastapi import APIRouter, HTTPException

from app.models.job import Job
from app.services.job_service import JobValidationError, create_job, get_job, list_jobs

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("/generate", response_model=Job, status_code=201)
async def generate_job():
    try:
        return create_job()
    except JobValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/{job_id}", response_model=Job)
async def get_job_route(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("", response_model=list[Job])
async def list_jobs_route():
    return list_jobs()
