from fastapi import APIRouter
from pydantic import BaseModel

from app.models.rig import RigJob, RigProfile
from app.services import rig_service

router = APIRouter(prefix="/api/rigs", tags=["rigs"])


class CreateRigJobRequest(BaseModel):
    source_job_id: str
    rig_type: str


@router.get("/profiles", response_model=list[RigProfile])
async def list_profiles():
    return rig_service.get_profiles()


@router.post("/create", response_model=RigJob, status_code=201)
async def create_rig_job(body: CreateRigJobRequest):
    return rig_service.create_rig_job(body.source_job_id, body.rig_type)


@router.get("", response_model=list[RigJob])
async def list_rig_jobs():
    return rig_service.list_rig_jobs()


@router.get("/{rig_job_id}", response_model=RigJob)
async def get_rig_job(rig_job_id: str):
    return rig_service.get_rig_job(rig_job_id)
