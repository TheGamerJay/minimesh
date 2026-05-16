from fastapi import APIRouter
from pydantic import BaseModel

from app.models.modules import AttachmentSocket, RigModule
from app.services import module_service

router = APIRouter(prefix="/api/modules", tags=["modules"])


class AssignModulesRequest(BaseModel):
    rig_job_id: str
    module_ids: list[str]


@router.get("", response_model=list[RigModule])
async def list_modules():
    return module_service.list_modules()


@router.get("/sockets", response_model=list[AttachmentSocket])
async def list_sockets():
    return module_service.list_sockets()


@router.post("/assign")
async def assign_modules(body: AssignModulesRequest):
    return module_service.assign_modules(body.rig_job_id, body.module_ids)


@router.get("/rig/{rig_job_id}")
async def get_rig_modules(rig_job_id: str):
    return module_service.get_rig_assignment(rig_job_id)
