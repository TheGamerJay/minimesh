from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.textures import TextureAsset, MaterialTextureSet, VALID_TEXTURE_TYPES
from app.services.project_context import get_textures_dir, get_active_project_id

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def _registry_path(project_id: str | None = None) -> Path:
    return get_textures_dir(project_id) / "registry.json"


def _assignments_path(project_id: str | None = None) -> Path:
    return get_textures_dir(project_id) / "assignments.json"


def _load_registry(project_id: str | None = None) -> list[TextureAsset]:
    path = _registry_path(project_id)
    if not path.exists():
        return []
    try:
        return [TextureAsset.model_validate(t) for t in json.loads(path.read_text(encoding="utf-8"))]
    except Exception:
        return []


def _save_registry(assets: list[TextureAsset], project_id: str | None = None) -> None:
    path = _registry_path(project_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps([a.model_dump() for a in assets], indent=2), encoding="utf-8")


def _load_assignments(project_id: str | None = None) -> list[MaterialTextureSet]:
    path = _assignments_path(project_id)
    if not path.exists():
        return []
    try:
        return [MaterialTextureSet.model_validate(s) for s in json.loads(path.read_text(encoding="utf-8"))]
    except Exception:
        return []


def _save_assignments(sets: list[MaterialTextureSet], project_id: str | None = None) -> None:
    path = _assignments_path(project_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps([s.model_dump() for s in sets], indent=2), encoding="utf-8")


def list_textures(project_id: str | None = None) -> list[TextureAsset]:
    return _load_registry(project_id)


def get_texture(texture_id: str, project_id: str | None = None) -> TextureAsset | None:
    for t in _load_registry(project_id):
        if t.id == texture_id:
            return t
    return None


def save_texture_file(
    file_bytes: bytes,
    original_filename: str,
    texture_type: str,
    name: str = "",
    tags: list[str] | None = None,
    project_id: str | None = None,
) -> TextureAsset:
    ext = Path(original_filename).suffix.lstrip(".").lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}. Allowed: {ALLOWED_EXTENSIONS}")

    if texture_type not in VALID_TEXTURE_TYPES:
        raise ValueError(f"Invalid texture_type: {texture_type}. Allowed: {VALID_TEXTURE_TYPES}")

    pid = project_id or get_active_project_id()
    tex_dir = get_textures_dir(pid)
    tex_dir.mkdir(parents=True, exist_ok=True)

    texture_id = str(uuid.uuid4())
    filename = f"{texture_id}.{ext}"
    file_path = tex_dir / filename
    file_path.write_bytes(file_bytes)

    now = datetime.now(timezone.utc).isoformat()
    asset = TextureAsset(
        id=texture_id,
        project_id=pid,
        name=name or Path(original_filename).stem,
        texture_type=texture_type,
        filename=filename,
        file_size=len(file_bytes),
        created_at=now,
        tags=tags or [],
    )

    assets = _load_registry(pid)
    assets.insert(0, asset)
    _save_registry(assets, pid)
    return asset


def delete_texture(texture_id: str, project_id: str | None = None) -> bool:
    pid = project_id or get_active_project_id()
    assets = _load_registry(pid)
    target = next((a for a in assets if a.id == texture_id), None)
    if target is None:
        return False

    # Remove file if it exists
    file_path = get_textures_dir(pid) / target.filename
    if file_path.exists():
        file_path.unlink()

    assets = [a for a in assets if a.id != texture_id]
    _save_registry(assets, pid)
    return True


def assign_textures(
    material_profile_id: str,
    textures: dict[str, str],
    asset_id: str | None = None,
    project_id: str | None = None,
) -> MaterialTextureSet:
    pid = project_id or get_active_project_id()

    # Validate texture_type keys
    for slot in textures:
        if slot not in VALID_TEXTURE_TYPES:
            raise ValueError(f"Invalid texture slot: {slot}")

    sets = _load_assignments(pid)
    now = datetime.now(timezone.utc).isoformat()

    existing = next((s for s in sets if s.material_profile_id == material_profile_id), None)
    if existing:
        existing.assigned_textures = {**existing.assigned_textures, **textures}
        existing.updated_at = now
        _save_assignments(sets, pid)
        return existing

    new_set = MaterialTextureSet(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        material_profile_id=material_profile_id,
        assigned_textures=textures,
        created_at=now,
        updated_at=now,
    )
    sets.insert(0, new_set)
    _save_assignments(sets, pid)
    return new_set


def get_assignment(material_profile_id: str, project_id: str | None = None) -> MaterialTextureSet | None:
    for s in _load_assignments(project_id):
        if s.material_profile_id == material_profile_id:
            return s
    return None


def get_texture_file_path(texture_id: str, project_id: str | None = None) -> Path | None:
    asset = get_texture(texture_id, project_id)
    if asset is None:
        return None
    return get_textures_dir(project_id) / asset.filename
