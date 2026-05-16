from __future__ import annotations
from pydantic import BaseModel

VALID_TASK_TYPES = {
    "glb_inspect",
    "mesh_normalize",
    "uv_check",
    "mock_bake",
    "mock_edit",
    "export_prepare",
}
VALID_STATUSES = {"queued", "running", "completed", "failed"}


class WorkerTask(BaseModel):
    id: str
    task_type: str
    provider: str = "local"
    asset_id: str | None = None
    status: str = "queued"
    input_files: list[str] = []
    output_files: list[str] = []
    logs: str = ""
    created_at: str
    updated_at: str


class WorkerHealth(BaseModel):
    worker_online: bool
    blender_available: bool
    blender_version: str
    blender_path: str
    blender_mode: str  # "real" | "mock"
    queue_size: int
    active_tasks: int
    last_check: str
