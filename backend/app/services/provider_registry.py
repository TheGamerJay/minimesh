from __future__ import annotations
import json
from app.services.project_context import PROJECT_ROOT

PROVIDER_METADATA: dict[str, dict] = {
    "mock": {
        "display_name": "Mock Provider",
        "description": "Local simulation for development. No API key required.",
        "stub": False,
        "requires_key": False,
        "capabilities": {
            "generation": True,
            "rigging": True,
            "animation": True,
            "textures": False,
        },
    },
    "meshy": {
        "display_name": "Meshy AI",
        "description": "Real image-to-3D generation via Meshy API v2.",
        "stub": False,
        "requires_key": True,
        "capabilities": {
            "generation": True,
            "rigging": False,
            "animation": False,
            "textures": True,
        },
    },
    "tripo": {
        "display_name": "Tripo3D",
        "description": "3D generation provider. Stub — full integration in a future phase.",
        "stub": True,
        "requires_key": True,
        "capabilities": {
            "generation": True,
            "rigging": False,
            "animation": False,
            "textures": False,
        },
    },
    "rodin": {
        "display_name": "Rodin",
        "description": "3D generation provider. Stub — full integration in a future phase.",
        "stub": True,
        "requires_key": True,
        "capabilities": {
            "generation": True,
            "rigging": False,
            "animation": False,
            "textures": False,
        },
    },
}

DEFAULT_PRIORITY = ["meshy", "tripo", "rodin", "mock"]

_PROVIDERS_DIR = PROJECT_ROOT / "storage" / "providers"
_PRIORITY_FILE = _PROVIDERS_DIR / "provider_priority.json"
_SETTINGS_FILE = _PROVIDERS_DIR / "provider_settings.json"
_HEALTH_CACHE_FILE = _PROVIDERS_DIR / "health_cache.json"


def _ensure_dir() -> None:
    _PROVIDERS_DIR.mkdir(parents=True, exist_ok=True)


def load_priority() -> list[str]:
    if _PRIORITY_FILE.exists():
        try:
            data = json.loads(_PRIORITY_FILE.read_text(encoding="utf-8"))
            order: list[str] = data.get("priority", DEFAULT_PRIORITY)
            for name in DEFAULT_PRIORITY:
                if name not in order:
                    order.append(name)
            return order
        except Exception:
            pass
    return DEFAULT_PRIORITY.copy()


def save_priority(priority: list[str]) -> None:
    _ensure_dir()
    _PRIORITY_FILE.write_text(json.dumps({"priority": priority}, indent=2), encoding="utf-8")


def _load_settings() -> dict:
    if _SETTINGS_FILE.exists():
        try:
            return json.loads(_SETTINGS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_settings(settings: dict) -> None:
    _ensure_dir()
    _SETTINGS_FILE.write_text(json.dumps(settings, indent=2), encoding="utf-8")


def is_enabled(name: str) -> bool:
    return _load_settings().get(name, {}).get("enabled", True)


def set_enabled(name: str, enabled: bool) -> None:
    s = _load_settings()
    s.setdefault(name, {})["enabled"] = enabled
    _save_settings(s)


def load_health_cache() -> dict:
    if _HEALTH_CACHE_FILE.exists():
        try:
            return json.loads(_HEALTH_CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def save_health_cache(name: str, result: dict) -> None:
    _ensure_dir()
    cache = load_health_cache()
    cache[name] = result
    _HEALTH_CACHE_FILE.write_text(json.dumps(cache, indent=2), encoding="utf-8")


def key_map() -> dict[str, str]:
    from app.config import settings
    return {
        "meshy": settings.MESHY_API_KEY,
        "tripo": settings.TRIPO_API_KEY,
        "rodin": settings.RODIN_API_KEY,
        "mock": "",
    }


def get_first_available(task: str = "generation") -> str:
    """Highest-priority non-stub provider that supports the task with a valid key, or 'mock'."""
    keys = key_map()
    for name in load_priority():
        meta = PROVIDER_METADATA.get(name)
        if not meta:
            continue
        if not is_enabled(name):
            continue
        if meta["stub"]:
            continue
        if not meta["capabilities"].get(task, False):
            continue
        if meta["requires_key"] and not keys.get(name, "").strip():
            continue
        return name
    return "mock"


def list_all() -> list[dict]:
    keys = key_map()
    priority = load_priority()
    health_cache = load_health_cache()
    result: list[dict] = []
    for name, meta in PROVIDER_METADATA.items():
        cached = health_cache.get(name, {})
        result.append({
            "name": name,
            "display_name": meta["display_name"],
            "description": meta["description"],
            "stub": meta["stub"],
            "enabled": is_enabled(name),
            "api_key_present": not meta["requires_key"] or bool(keys.get(name, "").strip()),
            "capabilities": meta["capabilities"],
            "priority_order": priority.index(name) if name in priority else 99,
            "health_status": cached.get("status", "unknown"),
            "health_message": cached.get("message", ""),
        })
    result.sort(key=lambda x: x["priority_order"])
    return result
