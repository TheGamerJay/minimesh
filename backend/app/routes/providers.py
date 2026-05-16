from __future__ import annotations
from fastapi import APIRouter

from app.models.providers import ProviderConfig
from app.services import provider_service

router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("/status", response_model=list[ProviderConfig])
async def get_provider_status():
    """List all configured providers and their capability/key status."""
    return provider_service.list_providers()


@router.get("/active", response_model=dict)
async def get_active_provider():
    """Return which provider is currently active."""
    return {
        "provider": provider_service.get_active_provider_name(),
        "is_real": provider_service.is_real_provider_active(),
    }
