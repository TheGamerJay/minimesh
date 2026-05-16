from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.edit_service import (
    create_edit_operation,
    get_edit_operation,
    list_edit_operations,
)

router = APIRouter(prefix="/api/edits", tags=["edits"])


class CreateEditRequest(BaseModel):
    asset_id: str
    operation_type: str = "sculpt"
    brush_type: str = "clay"
    strength: float = 0.5
    radius: float = 20.0
    position: list[float] = []


@router.post("/create", status_code=201)
async def create_edit(req: CreateEditRequest):
    try:
        op = create_edit_operation(
            asset_id=req.asset_id,
            operation_type=req.operation_type,
            brush_type=req.brush_type,
            strength=req.strength,
            radius=req.radius,
            position=req.position,
        )
        return op
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("")
async def list_edits(asset_id: str | None = None):
    return list_edit_operations(asset_id=asset_id)


@router.get("/{operation_id}")
async def get_edit(operation_id: str):
    op = get_edit_operation(operation_id)
    if not op:
        raise HTTPException(status_code=404, detail="Edit operation not found")
    return op
