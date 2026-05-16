from fastapi import APIRouter
from pydantic import BaseModel

from app.models.animation import AnimationClip, AnimationJob
from app.services import animation_service

router = APIRouter(prefix="/api/animations", tags=["animations"])


class CreateAnimationJobRequest(BaseModel):
    source_rig_job_id: str
    clip_id: str


@router.get("/clips", response_model=list[AnimationClip])
async def list_clips():
    return animation_service.list_clips()


@router.post("/create", response_model=AnimationJob, status_code=201)
async def create_animation_job(body: CreateAnimationJobRequest):
    return animation_service.create_animation_job(body.source_rig_job_id, body.clip_id)


@router.get("", response_model=list[AnimationJob])
async def list_animation_jobs():
    return animation_service.list_animation_jobs()


@router.get("/{animation_job_id}", response_model=AnimationJob)
async def get_animation_job(animation_job_id: str):
    return animation_service.get_animation_job(animation_job_id)
