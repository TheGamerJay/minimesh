from __future__ import annotations
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from app.models.inspection import GLBInspectionReport, BoundingBox
from app.services import blender_bridge
from app.services.asset_service import get_asset, update_inspection_metadata
from app.services.project_context import PROJECT_ROOT

_INSPECTIONS_DIR = PROJECT_ROOT / "storage" / "inspections"
_SCRIPT_PATH = str(PROJECT_ROOT / "workers" / "blender_inspect.py")


def _report_path(asset_id: str) -> Path:
    return _INSPECTIONS_DIR / f"{asset_id}.json"


def get_inspection(asset_id: str) -> GLBInspectionReport | None:
    p = _report_path(asset_id)
    if not p.exists():
        return None
    try:
        return GLBInspectionReport.model_validate(json.loads(p.read_text(encoding="utf-8")))
    except Exception:
        return None


def _save_report(report: GLBInspectionReport) -> None:
    _INSPECTIONS_DIR.mkdir(parents=True, exist_ok=True)
    _report_path(report.asset_id).write_text(report.model_dump_json(indent=2), encoding="utf-8")


def _fallback_inspection(asset_id: str, file_size: int, logs: str = "") -> GLBInspectionReport:
    return GLBInspectionReport(
        asset_id=asset_id,
        object_count=1,
        mesh_count=1,
        material_count=1,
        estimated_triangles=1400,
        bounding_box=BoundingBox(width=1.0, height=2.0, depth=1.0),
        object_names=["Mesh"],
        material_names=["Material"],
        has_armature=False,
        has_animations=False,
        has_uvs=True,
        file_size=file_size,
        generated_at=datetime.now(timezone.utc).isoformat(),
        fallback_estimate=True,
        blender_used=False,
        blender_version="",
        blender_logs=logs,
    )


def _run_blender_inspection(asset_id: str, glb_path: str, file_size: int) -> GLBInspectionReport:
    output_json = str(_INSPECTIONS_DIR / f"{asset_id}_raw.json")
    _INSPECTIONS_DIR.mkdir(parents=True, exist_ok=True)

    success, stdout, stderr = blender_bridge.run_glb_inspection(
        glb_path=glb_path,
        output_json=output_json,
        script_path=_SCRIPT_PATH,
        timeout=60,
    )

    logs = ""
    if stdout:
        logs += f"--- stdout ---\n{stdout}\n"
    if stderr:
        logs += f"--- stderr ---\n{stderr}\n"

    if not success or not Path(output_json).exists():
        report = _fallback_inspection(asset_id, file_size, logs)
        return report

    try:
        raw = json.loads(Path(output_json).read_text(encoding="utf-8"))
    except Exception as exc:
        report = _fallback_inspection(asset_id, file_size, logs + f"Parse error: {exc}\n")
        return report

    bb_data = raw.get("bounding_box", {})
    report = GLBInspectionReport(
        asset_id=asset_id,
        object_count=raw.get("object_count", 0),
        mesh_count=raw.get("mesh_count", 0),
        material_count=raw.get("material_count", 0),
        estimated_triangles=raw.get("estimated_triangles", 0),
        bounding_box=BoundingBox(
            width=bb_data.get("width", 0.0),
            height=bb_data.get("height", 0.0),
            depth=bb_data.get("depth", 0.0),
        ),
        object_names=raw.get("object_names", []),
        material_names=raw.get("material_names", []),
        has_armature=raw.get("has_armature", False),
        has_animations=raw.get("has_animations", False),
        has_uvs=raw.get("has_uvs", True),
        file_size=raw.get("file_size", file_size),
        generated_at=datetime.now(timezone.utc).isoformat(),
        fallback_estimate=False,
        blender_used=True,
        blender_version=raw.get("blender_version", ""),
        blender_logs=logs,
    )
    return report


def run_inspection(asset_id: str, project_id: str | None = None) -> GLBInspectionReport:
    asset = get_asset(asset_id, project_id)
    if asset is None:
        raise ValueError(f"Asset {asset_id!r} not found")

    glb_path = asset.file_path
    file_size = asset.file_size

    blender_info = blender_bridge.detect()
    if blender_info["found"] and os.path.isfile(glb_path):
        report = _run_blender_inspection(asset_id, glb_path, file_size)
    else:
        logs = "" if blender_info["found"] else "Blender not available — using fallback estimate.\n"
        if not os.path.isfile(glb_path):
            logs += f"GLB file not found at: {glb_path}\n"
        report = _fallback_inspection(asset_id, file_size, logs)

    _save_report(report)

    # Sync key metadata back to asset registry
    update_inspection_metadata(
        asset_id=asset_id,
        polygon_count=report.estimated_triangles,
        material_count=report.material_count,
        has_uvs=report.has_uvs,
        project_id=project_id,
    )

    return report
