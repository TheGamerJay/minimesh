from __future__ import annotations
from fastapi import APIRouter, HTTPException
from app.models.providers import ProviderDetail, ProviderCapabilities, ProviderTestResult
from app.services import provider_registry as reg
from app.services import provider_health_service as health_svc

router = APIRouter(prefix="/api/providers", tags=["providers"])


def _to_detail(d: dict) -> ProviderDetail:
    return ProviderDetail(
        name=d["name"],
        display_name=d["display_name"],
        description=d["description"],
        stub=d["stub"],
        enabled=d["enabled"],
        api_key_present=d["api_key_present"],
        capabilities=ProviderCapabilities(**d["capabilities"]),
        priority_order=d["priority_order"],
        health_status=d["health_status"],
        health_message=d["health_message"],
    )


@router.get("/status", response_model=list[ProviderDetail])
async def get_provider_status():
    return [_to_detail(d) for d in reg.list_all()]


@router.get("/active")
async def get_active_provider():
    from app.services.provider_service import get_active_provider_name, is_real_provider_active
    active = get_active_provider_name()
    cached = reg.load_health_cache().get(active, {})
    return {
        "provider": active,
        "is_real": is_real_provider_active(),
        "health_status": cached.get("status", "unknown"),
        "fallback_provider": _get_fallback_name(active),
    }


def _get_fallback_name(active: str) -> str | None:
    priority = reg.load_priority()
    keys = reg.key_map()
    found_active = False
    for name in priority:
        if name == active:
            found_active = True
            continue
        if not found_active:
            continue
        meta = reg.PROVIDER_METADATA.get(name)
        if not meta or meta["stub"] or not reg.is_enabled(name):
            continue
        if meta["requires_key"] and not keys.get(name, "").strip():
            continue
        return name
    return None


@router.get("/priority")
async def get_priority():
    return {"priority": reg.load_priority()}


@router.patch("/priority")
async def update_priority(body: dict):
    priority: list[str] = body.get("priority", [])
    known = list(reg.PROVIDER_METADATA.keys())
    filtered = [p for p in priority if p in known]
    for p in known:
        if p not in filtered:
            filtered.append(p)
    reg.save_priority(filtered)
    return {"priority": filtered}


@router.patch("/{provider_name}/enabled")
async def set_provider_enabled(provider_name: str, body: dict):
    if provider_name not in reg.PROVIDER_METADATA:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider_name}")
    if provider_name == "mock":
        raise HTTPException(status_code=400, detail="Mock provider cannot be disabled — it is the final fallback.")
    reg.set_enabled(provider_name, bool(body.get("enabled", True)))
    return {"provider": provider_name, "enabled": bool(body.get("enabled", True))}


@router.post("/test/{provider_name}", response_model=ProviderTestResult)
async def test_provider(provider_name: str):
    if provider_name not in reg.PROVIDER_METADATA:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider_name}")
    result = health_svc.check_health(provider_name)
    return ProviderTestResult(**result)
