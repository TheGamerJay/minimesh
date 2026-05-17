from __future__ import annotations
from fastapi import APIRouter, HTTPException

from app.models.asset_qa import AssetQAReport
from app.services import asset_qa_service

router = APIRouter(prefix="/api/asset-qa", tags=["asset-qa"])


@router.post("/run/{asset_id}", response_model=AssetQAReport, status_code=201)
def run_asset_qa(asset_id: str):
    try:
        return asset_qa_service.run_qa(asset_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QA analysis failed: {e}")


@router.get("/{asset_id}", response_model=AssetQAReport)
def get_asset_qa(asset_id: str):
    report = asset_qa_service.get_qa(asset_id)
    if not report:
        raise HTTPException(status_code=404, detail="No QA report found for this asset")
    return report
