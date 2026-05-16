from __future__ import annotations


def get_active_provider_name() -> str:
    """Return the name of the highest-priority available provider."""
    from app.services.provider_registry import get_first_available
    return get_first_available("generation")


def is_real_provider_active() -> bool:
    return get_active_provider_name() != "mock"
