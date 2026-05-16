from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.worker_service import create_task, get_task, list_tasks, get_health

router = APIRouter(prefix="/api/workers", tags=["workers"])


class CreateTaskRequest(BaseModel):
    task_type: str
    asset_id: str | None = None


@router.get("/health")
async def worker_health():
    return get_health()


@router.post("/tasks/create", status_code=201)
async def create_worker_task(req: CreateTaskRequest):
    try:
        task = create_task(task_type=req.task_type, asset_id=req.asset_id)
        return task
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/tasks")
async def list_worker_tasks():
    return list_tasks()


@router.get("/tasks/{task_id}")
async def get_worker_task(task_id: str):
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Worker task not found")
    return task
