from __future__ import annotations
import time


def check_health(provider_name: str) -> dict:
    """Live health check for a provider. Caches result in health_cache.json."""
    from app.services import provider_registry as reg

    meta = reg.PROVIDER_METADATA.get(provider_name)
    if not meta:
        return {"provider": provider_name, "status": "offline", "message": "Unknown provider.", "latency_ms": None}

    if not reg.is_enabled(provider_name):
        result = {"provider": provider_name, "status": "disabled", "message": "Provider is disabled.", "latency_ms": None}
        reg.save_health_cache(provider_name, result)
        return result

    if provider_name == "mock":
        result = {"provider": provider_name, "status": "healthy", "message": "Mock provider always available.", "latency_ms": 0}
        reg.save_health_cache(provider_name, result)
        return result

    if meta["stub"]:
        result = {"provider": provider_name, "status": "offline", "message": "Stub provider — not yet integrated.", "latency_ms": None}
        reg.save_health_cache(provider_name, result)
        return result

    keys = reg.key_map()
    key = keys.get(provider_name, "").strip()
    if not key:
        result = {"provider": provider_name, "status": "offline", "message": "No API key configured.", "latency_ms": None}
        reg.save_health_cache(provider_name, result)
        return result

    if provider_name == "meshy":
        result = _check_meshy(key)
        reg.save_health_cache(provider_name, result)
        return result

    result = {"provider": provider_name, "status": "offline", "message": "Health check not implemented.", "latency_ms": None}
    reg.save_health_cache(provider_name, result)
    return result


def _check_meshy(key: str) -> dict:
    try:
        import httpx
        t0 = time.monotonic()
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                "https://api.meshy.ai/openapi/v2/image-to-3d",
                headers={"Authorization": f"Bearer {key}"},
                params={"page_num": 1, "page_size": 1},
            )
        latency_ms = int((time.monotonic() - t0) * 1000)
        if resp.status_code in (200, 422):
            return {"provider": "meshy", "status": "healthy", "message": "Provider reachable.", "latency_ms": latency_ms}
        if resp.status_code == 401:
            return {"provider": "meshy", "status": "offline", "message": "Invalid API key (401 Unauthorized).", "latency_ms": latency_ms}
        if resp.status_code == 429:
            return {"provider": "meshy", "status": "degraded", "message": "Rate limited (429).", "latency_ms": latency_ms}
        return {"provider": "meshy", "status": "degraded", "message": f"Unexpected HTTP {resp.status_code}.", "latency_ms": latency_ms}
    except Exception as e:
        import httpx as _httpx
        if isinstance(e, _httpx.TimeoutException):
            return {"provider": "meshy", "status": "degraded", "message": "Request timed out (>10 s).", "latency_ms": None}
        return {"provider": "meshy", "status": "offline", "message": f"Connection error: {str(e)[:100]}", "latency_ms": None}
