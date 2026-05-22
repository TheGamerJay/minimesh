from fastapi import APIRouter
from app.models.repair import RepairActionResult, RepairPlan
from app.services import repair_service

router = APIRouter(prefix="/api/repairs", tags=["repairs"])


@router.get("/{asset_id}/plan", response_model=RepairPlan)
def get_repair_plan(asset_id: str, project_id: str | None = None):
    return repair_service.generate_repair_plan(asset_id, project_id)


@router.post("/{asset_id}/run/{action_type}", response_model=RepairActionResult, status_code=201)
def run_repair_action(asset_id: str, action_type: str, project_id: str | None = None):
    return repair_service.run_action(asset_id, action_type, project_id)
