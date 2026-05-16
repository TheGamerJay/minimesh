from __future__ import annotations
from fastapi import APIRouter, HTTPException

from app.models.inspection import GLBInspectionReport
from app.services import inspection_service

router = APIRouter(prefix="/api/inspections", tags=["inspections"])


@router.post("/run/{asset_id}", response_model=GLBInspectionReport, status_code=200)
async def run_inspection(asset_id: str):
    try:
        report = inspection_service.run_inspection(asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return report


@router.get("/{asset_id}", response_model=GLBInspectionReport)
async def get_inspection(asset_id: str):
    report = inspection_service.get_inspection(asset_id)
    if report is None:
        raise HTTPException(status_code=404, detail="No inspection report found for this asset. Run inspection first.")
    return report
