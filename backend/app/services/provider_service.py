from __future__ import annotations
from datetime import datetime, timezone
from app.models.providers import ProviderConfig


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_meshy_config() -> ProviderConfig:
    from app.config import settings
    key = settings.MESHY_API_KEY.strip()
    return ProviderConfig(
        provider_name="meshy",
        enabled=bool(key),
        api_key_present=bool(key),
        supports_generation=True,
        supports_rigging=False,
        supports_animation=False,
        supports_textures=True,
        created_at=_now(),
        updated_at=_now(),
    )


def list_providers() -> list[ProviderConfig]:
    return [get_meshy_config()]


def get_active_provider_name() -> str:
    from app.config import settings
    if settings.MESHY_API_KEY.strip():
        return "meshy"
    return "mock"


def is_real_provider_active() -> bool:
    return get_active_provider_name() != "mock"
