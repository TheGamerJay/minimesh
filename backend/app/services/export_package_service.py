from __future__ import annotations
import json
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from app.models.export_v2 import (
    AssetExportPackage,
    ExportManifest,
    VALID_EXPORT_TYPES,
    EXPORT_TYPE_FLAGS,
)
from app.services.asset_service import get_asset
from app.services.project_context import PROJECT_ROOT

_STORAGE_DIR = PROJECT_ROOT / "storage" / "export_packages_v2"
_OUTPUT_DIR = PROJECT_ROOT / "exports" / "packages_v2"


def _pkg_path(package_id: str) -> Path:
    return _STORAGE_DIR / f"{package_id}.json"


def _load_pkg(package_id: str) -> AssetExportPackage | None:
    p = _pkg_path(package_id)
    if not p.exists():
        return None
    try:
        return AssetExportPackage.model_validate(json.loads(p.read_text(encoding="utf-8")))
    except Exception:
        return None


def _save_pkg(pkg: AssetExportPackage) -> None:
    _STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    _pkg_path(pkg.id).write_text(json.dumps(pkg.model_dump(), indent=2), encoding="utf-8")


def get_package(package_id: str) -> AssetExportPackage | None:
    return _load_pkg(package_id)


def list_packages(asset_id: str | None = None) -> list[AssetExportPackage]:
    if not _STORAGE_DIR.exists():
        return []
    packages: list[AssetExportPackage] = []
    for f in _STORAGE_DIR.glob("*.json"):
        try:
            pkg = AssetExportPackage.model_validate(json.loads(f.read_text(encoding="utf-8")))
            if asset_id is None or pkg.asset_id == asset_id:
                packages.append(pkg)
        except Exception:
            pass
    return sorted(packages, key=lambda p: p.created_at, reverse=True)


def get_package_zip_path(package_id: str) -> Path | None:
    pkg = _load_pkg(package_id)
    if not pkg or not pkg.zip_path:
        return None
    p = PROJECT_ROOT / pkg.zip_path
    return p if p.exists() else None


def _resolve_glb(asset, version_label: str) -> tuple[Path | None, int, bool]:
    """Returns (disk_path, version_number, is_normalized)."""
    if version_label == "original":
        if asset.versions:
            v1 = min(asset.versions, key=lambda v: v.version)
            p = PROJECT_ROOT / v1.file_path
            return (p if p.exists() else None), v1.version, ("normalize" in v1.provider)
        p = PROJECT_ROOT / asset.file_path
        return (p if p.exists() else None), asset.version, False

    elif version_label == "normalized":
        # Current version might be normalized
        if "normalize" in asset.provider:
            p = PROJECT_ROOT / asset.file_path
            return (p if p.exists() else None), asset.version, True
        # Or a previous version was normalized
        norm_versions = [v for v in asset.versions if "normalize" in v.provider]
        if norm_versions:
            best = max(norm_versions, key=lambda v: v.version)
            p = PROJECT_ROOT / best.file_path
            return (p if p.exists() else None), best.version, True
        # Fallback to latest
        p = PROJECT_ROOT / asset.file_path
        return (p if p.exists() else None), asset.version, False

    else:  # "latest"
        p = PROJECT_ROOT / asset.file_path
        return (p if p.exists() else None), asset.version, ("normalize" in asset.provider)


def create_package(
    asset_id: str,
    export_type: str,
    version_label: str = "latest",
    project_id: str | None = None,
) -> AssetExportPackage:
    if export_type not in VALID_EXPORT_TYPES:
        raise ValueError(f"Invalid export_type: {export_type}")

    asset = get_asset(asset_id, project_id)
    if asset is None:
        raise ValueError(f"Asset {asset_id} not found")

    flags = EXPORT_TYPE_FLAGS[export_type]
    package_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    pkg_dir = _OUTPUT_DIR / package_id
    pkg_dir.mkdir(parents=True, exist_ok=True)

    included_files: list[str] = []
    textures_in_manifest: list[dict] = []
    has_textures = False
    has_inspection = False
    has_thumbnail = False
    inspection_summary: dict | None = None

    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in asset.name)
    zip_filename = f"{safe_name}_{version_label}.zip"
    zip_path = pkg_dir / zip_filename

    glb_disk_path, version_num, is_normalized = _resolve_glb(asset, version_label)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Model
        if flags["model"] and glb_disk_path and glb_disk_path.exists():
            zf.write(glb_disk_path, f"model/asset.{asset.asset_type}")
            included_files.append(f"model/asset.{asset.asset_type}")

        # Textures
        if flags["textures"]:
            try:
                from app.services.texture_service import list_textures, get_texture_file_path
                textures = list_textures(asset.project_id)
                for tex in textures:
                    tex_path = get_texture_file_path(tex.id, asset.project_id)
                    if tex_path and tex_path.exists():
                        arc_name = f"textures/{tex.texture_type}_{tex.filename}"
                        zf.write(tex_path, arc_name)
                        included_files.append(arc_name)
                        textures_in_manifest.append({"name": tex.filename, "type": tex.texture_type})
                has_textures = len(textures_in_manifest) > 0
            except Exception:
                pass

        # Thumbnail
        if flags["thumbnail"] and asset.thumbnail:
            # thumbnail URL: /export-packages/thumbnails/... → exports/thumbnails/...
            thumb_rel = asset.thumbnail.lstrip("/")
            if thumb_rel.startswith("export-packages/"):
                thumb_rel = thumb_rel[len("export-packages/"):]
            thumb_disk = PROJECT_ROOT / "exports" / thumb_rel
            if thumb_disk.exists():
                zf.write(thumb_disk, "preview/thumbnail.png")
                included_files.append("preview/thumbnail.png")
                has_thumbnail = True

        # Inspection
        if flags["inspection"]:
            inspection_path = PROJECT_ROOT / "storage" / "inspections" / f"{asset_id}.json"
            if inspection_path.exists():
                try:
                    report_data = json.loads(inspection_path.read_text(encoding="utf-8"))
                    zf.write(inspection_path, "inspection/report.json")
                    included_files.append("inspection/report.json")
                    has_inspection = True
                    inspection_summary = {
                        "mesh_count": report_data.get("mesh_count"),
                        "estimated_triangles": report_data.get("estimated_triangles"),
                        "material_count": report_data.get("material_count"),
                        "has_uvs": report_data.get("has_uvs"),
                        "fallback_estimate": report_data.get("fallback_estimate"),
                    }
                except Exception:
                    pass

        # Manifest (written to both zip and disk)
        manifest = ExportManifest(
            asset_id=asset_id,
            asset_name=asset.name,
            version=version_num,
            version_label=version_label,
            provider=asset.provider,
            normalized=is_normalized,
            export_type=export_type,
            textures=textures_in_manifest,
            has_inspection=has_inspection,
            inspection_summary=inspection_summary,
            thumbnail="preview/thumbnail.png" if has_thumbnail else None,
            file_count=len(included_files) + 1,  # +1 for manifest itself
            exported_at=now,
        )
        manifest_json = json.dumps(manifest.model_dump(), indent=2)
        zf.writestr("manifest.json", manifest_json)
        included_files.append("manifest.json")

    # Write manifest to disk for easy inspection
    manifest_disk = pkg_dir / "manifest.json"
    manifest_disk.write_text(manifest_json, encoding="utf-8")

    zip_size = zip_path.stat().st_size if zip_path.exists() else 0
    zip_rel = str(zip_path.relative_to(PROJECT_ROOT)).replace("\\", "/")
    manifest_rel = str(manifest_disk.relative_to(PROJECT_ROOT)).replace("\\", "/")

    pkg = AssetExportPackage(
        id=package_id,
        asset_id=asset_id,
        asset_name=asset.name,
        export_type=export_type,
        version_exported=version_num,
        version_label=version_label,
        included_files=included_files,
        manifest_path=manifest_rel,
        zip_path=zip_rel,
        zip_size=zip_size,
        normalized=is_normalized,
        has_textures=has_textures,
        has_inspection=has_inspection,
        has_thumbnail=has_thumbnail,
        created_at=now,
    )
    _save_pkg(pkg)
    return pkg
