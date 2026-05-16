from fastapi import APIRouter

from app.models.generation import GenerationConfigResponse, GenerationConfigUpdate
from app.services.generation_service import get_or_create_config, update_config

router = APIRouter(prefix="/api/generation", tags=["generation"])


@router.get("/config", response_model=GenerationConfigResponse)
async def get_config():
    config = get_or_create_config()
    return GenerationConfigResponse(success=True, config=config)


@router.patch("/config", response_model=GenerationConfigResponse)
async def patch_config(body: GenerationConfigUpdate):
    config = update_config(body)
    return GenerationConfigResponse(success=True, config=config)
