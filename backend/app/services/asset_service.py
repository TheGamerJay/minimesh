from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.models.assets import GeneratedAsset, AssetVersion, VALID_ASSET_TYPES
from app.services.project_context import get_assets_dir, get_active_project_id


def _registry_path(project_id: str | None = None) -> Path:
    return get_assets_dir(project_id) / "registry.json"


def _load_registry(project_id: str | None = None) -> list[GeneratedAsset]:
    path = _registry_path(project_id)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return [GeneratedAsset.model_validate(a) for a in data]
    except Exception:
        return []


def _save_registry(assets: list[GeneratedAsset], project_id: str | None = None) -> None:
    path = _registry_path(project_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps([a.model_dump() for a in assets], indent=2),
        encoding="utf-8",
    )


def list_assets(project_id: str | None = None) -> list[GeneratedAsset]:
    return _load_registry(project_id)


def get_asset(asset_id: str, project_id: str | None = None) -> GeneratedAsset | None:
    for a in _load_registry(project_id):
        if a.id == asset_id:
            return a
    return None


def register_asset(
    *,
    source_job_id: str,
    provider: str,
    asset_type: str,
    file_path: str,
    name: str = "",
    preview_image: str | None = None,
    project_id: str | None = None,
) -> GeneratedAsset:
    if asset_type not in VALID_ASSET_TYPES:
        raise ValueError(f"Invalid asset_type: {asset_type}")

    pid = project_id or get_active_project_id()
    now = datetime.now(timezone.utc).isoformat()

    size = 0
    p = Path(file_path)
    if p.exists():
        size = p.stat().st_size

    asset = GeneratedAsset(
        id=str(uuid.uuid4()),
        project_id=pid,
        source_job_id=source_job_id,
        provider=provider,
        asset_type=asset_type,
        file_path=file_path,
        name=name or f"Asset {now[:10]}",
        preview_image=preview_image,
        file_size=size,
        created_at=now,
        updated_at=now,
        version=1,
    )

    assets = _load_registry(pid)
    assets.insert(0, asset)
    _save_registry(assets, pid)
    return asset


def auto_register_from_job(job) -> GeneratedAsset | None:
    """Called when a job completes with model_downloaded=True. Returns None if already registered."""
    if not getattr(job, "model_downloaded", False):
        return None
    if not getattr(job, "glb_path", None):
        return None

    pid = getattr(job, "project_id", None) or get_active_project_id()

    # Avoid duplicate registration
    existing = _load_registry(pid)
    for a in existing:
        if a.source_job_id == job.id:
            return a

    from datetime import date
    date_str = date.today().strftime("%b %d")
    mode_label = (job.mode or "asset").replace("_", " ").title()
    name = f"{mode_label} {date_str}"

    preview = getattr(job, "preview_url", None)

    asset = register_asset(
        source_job_id=job.id,
        provider=job.provider,
        asset_type="glb",
        file_path=job.glb_path,
        name=name,
        preview_image=preview,
        project_id=pid,
    )
    return asset


def register_new_version(
    asset_id: str,
    *,
    file_path: str,
    provider: str,
    project_id: str | None = None,
) -> GeneratedAsset:
    assets = _load_registry(project_id)
    for asset in assets:
        if asset.id == asset_id:
            old_version = AssetVersion(
                version=asset.version,
                file_path=asset.file_path,
                created_at=asset.created_at,
                provider=asset.provider,
            )
            asset.versions.append(old_version)
            asset.version += 1
            asset.file_path = file_path
            asset.provider = provider
            asset.updated_at = datetime.now(timezone.utc).isoformat()

            size = 0
            p = Path(file_path)
            if p.exists():
                size = p.stat().st_size
            asset.file_size = size

            _save_registry(assets, project_id)
            return asset
    raise ValueError(f"Asset {asset_id} not found")


def tag_asset(
    asset_id: str,
    tags: list[str],
    project_id: str | None = None,
) -> GeneratedAsset:
    assets = _load_registry(project_id)
    for asset in assets:
        if asset.id == asset_id:
            asset.tags = list(set(tags))
            asset.updated_at = datetime.now(timezone.utc).isoformat()
            _save_registry(assets, project_id)
            return asset
    raise ValueError(f"Asset {asset_id} not found")


def rename_asset(
    asset_id: str,
    name: str,
    project_id: str | None = None,
) -> GeneratedAsset:
    assets = _load_registry(project_id)
    for asset in assets:
        if asset.id == asset_id:
            asset.name = name
            asset.updated_at = datetime.now(timezone.utc).isoformat()
            _save_registry(assets, project_id)
            return asset
    raise ValueError(f"Asset {asset_id} not found")


def delete_asset(asset_id: str, project_id: str | None = None) -> bool:
    assets = _load_registry(project_id)
    original_len = len(assets)
    assets = [a for a in assets if a.id != asset_id]
    if len(assets) == original_len:
        return False
    _save_registry(assets, project_id)
    return True


def duplicate_asset(asset_id: str, project_id: str | None = None) -> GeneratedAsset:
    asset = get_asset(asset_id, project_id)
    if asset is None:
        raise ValueError(f"Asset {asset_id} not found")

    pid = project_id or get_active_project_id()
    now = datetime.now(timezone.utc).isoformat()

    duplicate = GeneratedAsset(
        id=str(uuid.uuid4()),
        project_id=pid,
        source_job_id=asset.source_job_id,
        provider=asset.provider,
        asset_type=asset.asset_type,
        file_path=asset.file_path,
        name=f"{asset.name} (copy)",
        preview_image=asset.preview_image,
        thumbnail=asset.thumbnail,
        polygon_count=asset.polygon_count,
        file_size=asset.file_size,
        created_at=now,
        updated_at=now,
        version=asset.version,
        tags=list(asset.tags),
        versions=list(asset.versions),
    )

    assets = _load_registry(pid)
    assets.insert(0, duplicate)
    _save_registry(assets, pid)
    return duplicate
