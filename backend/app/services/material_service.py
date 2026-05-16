from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models.materials import BUILT_IN_PRESETS, VALID_SHADER_TYPES, MaterialProfile
from app.services.project_context import PROJECT_ROOT, get_storage_base


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _materials_dir() -> Path:
    d = get_storage_base() / "materials"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _active_file() -> Path:
    return _materials_dir() / "active_material.json"


def _profile_path(material_id: str) -> Path:
    return _materials_dir() / f"{material_id}.json"


# â”€â”€ Active material â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def get_active_material_id() -> str:
    f = _active_file()
    if f.exists():
        try:
            return json.loads(f.read_text(encoding="utf-8")).get(
                "material_id", BUILT_IN_PRESETS[0]["id"]
            )
        except Exception:
            pass
    return BUILT_IN_PRESETS[0]["id"]


def _set_active(material_id: str) -> None:
    _active_file().write_text(
        json.dumps({"material_id": material_id}, indent=2), encoding="utf-8"
    )


# â”€â”€ Presets + custom profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _load_custom() -> list[MaterialProfile]:
    result = []
    for f in _materials_dir().glob("*.json"):
        if f.name == "active_material.json":
            continue
        try:
            result.append(MaterialProfile.model_validate_json(f.read_text(encoding="utf-8")))
        except Exception:
            continue
    result.sort(key=lambda m: m.updated_at, reverse=True)
    return result


def list_materials() -> list[MaterialProfile]:
    presets = [MaterialProfile(**p, created_at=_now(), updated_at=_now()) for p in BUILT_IN_PRESETS]
    custom = _load_custom()
    # Mark active
    active_id = get_active_material_id()
    all_profiles = presets + custom
    # Return with is_active conceptually embedded in the ID check (frontend handles it)
    return all_profiles


def get_material(material_id: str) -> MaterialProfile:
    # Built-in preset?
    for p in BUILT_IN_PRESETS:
        if p["id"] == material_id:
            return MaterialProfile(**p, created_at=_now(), updated_at=_now())
    # Custom
    path = _profile_path(material_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Material '{material_id}' not found.")
    return MaterialProfile.model_validate_json(path.read_text(encoding="utf-8"))


def create_material(data: dict) -> MaterialProfile:
    from app.services.credit_service import spend_credits, get_pricing

    if "shader_type" in data and data["shader_type"] not in VALID_SHADER_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid shader_type. Valid: {sorted(VALID_SHADER_TYPES)}",
        )

    pricing = get_pricing()
    spend_credits(pricing.material_preset_cost, "materials", "save_material_preset", "Save Material Preset")
    now = _now()
    profile = MaterialProfile(
        id=str(uuid.uuid4()),
        name=data.get("name", "Custom Material"),
        shader_type=data.get("shader_type", "pbr"),
        base_color=data.get("base_color", "#1e293b"),
        secondary_color=data.get("secondary_color", "#334155"),
        emissive_color=data.get("emissive_color", "#06b6d4"),
        metallic=float(data.get("metallic", 0.5)),
        roughness=float(data.get("roughness", 0.5)),
        emissive_intensity=float(data.get("emissive_intensity", 0.2)),
        opacity=float(data.get("opacity", 1.0)),
        rim_light=bool(data.get("rim_light", False)),
        toon_steps=int(data.get("toon_steps", 3)),
        is_preset=False,
        created_at=now,
        updated_at=now,
    )
    _profile_path(profile.id).write_text(profile.model_dump_json(indent=2), encoding="utf-8")
    return profile


def update_material(material_id: str, data: dict) -> MaterialProfile:
    # Cannot update built-in presets
    for p in BUILT_IN_PRESETS:
        if p["id"] == material_id:
            raise HTTPException(
                status_code=400, detail="Built-in presets cannot be modified. Duplicate first."
            )
    path = _profile_path(material_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Material '{material_id}' not found.")
    profile = MaterialProfile.model_validate_json(path.read_text(encoding="utf-8"))
    for field in ("name", "shader_type", "base_color", "secondary_color", "emissive_color",
                  "metallic", "roughness", "emissive_intensity", "opacity", "rim_light", "toon_steps"):
        if field in data:
            setattr(profile, field, data[field])
    if "shader_type" in data and data["shader_type"] not in VALID_SHADER_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid shader_type.")
    profile.updated_at = _now()
    path.write_text(profile.model_dump_json(indent=2), encoding="utf-8")
    return profile


def delete_material(material_id: str) -> None:
    for p in BUILT_IN_PRESETS:
        if p["id"] == material_id:
            raise HTTPException(status_code=400, detail="Built-in presets cannot be deleted.")
    path = _profile_path(material_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Material '{material_id}' not found.")
    path.unlink()
    # If deleted profile was active, reset to first preset
    if get_active_material_id() == material_id:
        _set_active(BUILT_IN_PRESETS[0]["id"])


def activate_material(material_id: str) -> MaterialProfile:
    profile = get_material(material_id)
    _set_active(material_id)
    return profile
