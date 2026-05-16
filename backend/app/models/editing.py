from __future__ import annotations
from pydantic import BaseModel

VALID_OPERATION_TYPES = {"sculpt", "smooth", "inflate", "pinch", "move", "transform", "mirror"}
VALID_STATUSES = {"queued", "processing", "completed", "failed"}


class EditOperation(BaseModel):
    id: str
    asset_id: str
    operation_type: str
    brush_type: str = "clay"
    strength: float = 0.5
    radius: float = 20.0
    position: list[float] = []
    status: str = "queued"
    provider: str = "mock"
    message: str = ""
    created_at: str
    updated_at: str


class EditHistoryEntry(BaseModel):
    id: str
    operation_id: str
    asset_id: str
    operation_name: str
    created_at: str
