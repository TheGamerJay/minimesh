from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.asset_qa import AssetQAReport, AssetQAIssue, SCORE_HEALTHY, SCORE_NEEDS_WORK
from app.services.asset_service import get_asset, update_qa_metadata
from app.services.project_context import PROJECT_ROOT

_QA_DIR = PROJECT_ROOT / "storage" / "asset_qa"


def _qa_path(asset_id: str) -> Path:
    return _QA_DIR / f"{asset_id}.json"


def _make_issue(
    category: str,
    severity: str,
    title: str,
    description: str,
    suggestion: str,
    now: str,
) -> AssetQAIssue:
    return AssetQAIssue(
        id=str(uuid.uuid4()),
        severity=severity,
        category=category,
        title=title,
        description=description,
        suggestion=suggestion,
        detected_at=now,
    )


def get_qa(asset_id: str) -> AssetQAReport | None:
    p = _qa_path(asset_id)
    if not p.exists():
        return None
    try:
        return AssetQAReport.model_validate(json.loads(p.read_text(encoding="utf-8")))
    except Exception:
        return None


def _save_qa(report: AssetQAReport) -> None:
    _QA_DIR.mkdir(parents=True, exist_ok=True)
    _qa_path(report.asset_id).write_text(
        json.dumps(report.model_dump(), indent=2), encoding="utf-8"
    )


def run_qa(asset_id: str, project_id: str | None = None) -> AssetQAReport:
    asset = get_asset(asset_id, project_id)
    if asset is None:
        raise ValueError(f"Asset {asset_id} not found")

    now = datetime.now(timezone.utc).isoformat()
    score = 100
    issues: list[AssetQAIssue] = []
    strengths: list[str] = []
    recommendations: list[str] = []

    # ── Inspection ───────────────────────────────────────────────────────────
    inspection = None
    try:
        from app.services.inspection_service import get_inspection
        inspection = get_inspection(asset_id)
    except Exception:
        pass

    if inspection is None:
        score -= 8
        issues.append(_make_issue(
            "geometry", "warning", "No inspection run",
            "Asset has not been inspected. Mesh metadata may be incomplete.",
            "Run GLB Inspection to extract real mesh metadata.",
            now,
        ))
        recommendations.append("Run inspection to verify mesh integrity.")
    elif inspection.fallback_estimate:
        issues.append(_make_issue(
            "geometry", "info", "Inspection uses fallback estimate",
            "Blender was unavailable; metadata is estimated rather than extracted.",
            "Install Blender and re-run inspection for accurate results.",
            now,
        ))
    else:
        strengths.append("Blender inspection run — real metadata extracted")

    # ── UV maps ──────────────────────────────────────────────────────────────
    if inspection is not None and not inspection.has_uvs:
        score -= 15
        issues.append(_make_issue(
            "uv", "critical", "Missing UV maps",
            "Asset has no UV maps. Texturing and texture baking will not function.",
            "Re-export from Blender with UV unwrapping applied.",
            now,
        ))
    elif inspection is not None and inspection.has_uvs:
        strengths.append("Asset has UV mapping")

    # ── Materials ────────────────────────────────────────────────────────────
    mat_count = inspection.material_count if inspection else asset.material_count
    if mat_count is not None and mat_count == 0:
        score -= 10
        issues.append(_make_issue(
            "materials", "warning", "No materials assigned",
            "Asset has no material slots. It will render as default gray in all viewers.",
            "Assign materials in Blender before exporting the GLB.",
            now,
        ))
    elif mat_count:
        strengths.append(f"{mat_count} material slot(s) detected")

    # ── Triangle count ────────────────────────────────────────────────────────
    if inspection and inspection.estimated_triangles > 0 and not inspection.fallback_estimate:
        tris = inspection.estimated_triangles
        if tris > 500_000:
            score -= 6
            issues.append(_make_issue(
                "geometry", "warning", "High polygon count",
                f"Asset has {tris:,} triangles. This may impact real-time performance.",
                "Consider decimating the mesh for game-engine use.",
                now,
            ))
        elif tris < 100:
            score -= 6
            issues.append(_make_issue(
                "geometry", "info", "Very low polygon count",
                f"Asset has only {tris:,} triangles.",
                "Verify this is intentional for a low-poly or proxy asset.",
                now,
            ))

    # ── Scale / bounding box ─────────────────────────────────────────────────
    if inspection and inspection.bounding_box:
        bb = inspection.bounding_box
        max_dim = max(bb.width, bb.height, bb.depth)
        if max_dim > 10.0:
            score -= 8
            issues.append(_make_issue(
                "scale", "warning", "Oversized scale",
                f"Largest dimension is {max_dim:.2f} units, exceeding standard conventions.",
                "Run Normalize to scale the asset to a 2-unit bounding cube.",
                now,
            ))
            if "Run Normalize" not in " ".join(recommendations):
                recommendations.append("Run Normalize to standardize scale and pivot.")
        elif 0 < max_dim < 0.01:
            score -= 8
            issues.append(_make_issue(
                "scale", "warning", "Undersized scale",
                f"Largest dimension is {max_dim:.5f} units — extremely small.",
                "Run Normalize to scale the asset to standard size.",
                now,
            ))
            if "Run Normalize" not in " ".join(recommendations):
                recommendations.append("Run Normalize to standardize scale and pivot.")

    # ── Normalization ─────────────────────────────────────────────────────────
    is_normalized = "normalize" in asset.provider or any(
        "normalize" in v.provider for v in asset.versions
    )
    if not is_normalized:
        score -= 12
        issues.append(_make_issue(
            "scale", "warning", "Asset not normalized",
            "Scale and pivot may not conform to standard origin/unit conventions.",
            "Run Normalize to standardize scale and pivot.",
            now,
        ))
        if "Run Normalize" not in " ".join(recommendations):
            recommendations.append("Run Normalize to standardize scale and pivot.")
    else:
        strengths.append("Asset is normalized to standard scale")

    # ── Textures in project ──────────────────────────────────────────────────
    project_textures: list = []
    try:
        from app.services.texture_service import list_textures
        project_textures = list_textures(asset.project_id)
    except Exception:
        pass

    if not project_textures:
        score -= 10
        issues.append(_make_issue(
            "textures", "warning", "No textures in project",
            "No texture files are uploaded for this project.",
            "Assign PBR textures to improve export readiness.",
            now,
        ))
        recommendations.append("Assign PBR textures to improve export readiness.")
    else:
        strengths.append(f"{len(project_textures)} texture file(s) available in project")

    # ── Thumbnail ─────────────────────────────────────────────────────────────
    if not asset.thumbnail:
        score -= 10
        issues.append(_make_issue(
            "export", "info", "No rendered thumbnail",
            "Asset has no rendered thumbnail. Asset cards display a placeholder.",
            "Generate a Blender thumbnail for asset previews.",
            now,
        ))
        recommendations.append("Generate a Blender thumbnail for asset previews.")
    else:
        strengths.append("Rendered thumbnail available")

    # ── Export packages ────────────────────────────────────────────────────────
    export_count = 0
    try:
        from app.services.export_package_service import list_packages
        export_count = len(list_packages(asset_id))
    except Exception:
        pass

    if export_count == 0:
        score -= 5
        issues.append(_make_issue(
            "export", "info", "No export packages created",
            "No export packages have been built for this asset.",
            "Create an export package for production use.",
            now,
        ))
        recommendations.append("Create an export package for production use.")
    else:
        strengths.append(f"{export_count} export package(s) created")

    score = max(0, score)

    if score >= SCORE_HEALTHY:
        status = "healthy"
    elif score >= SCORE_NEEDS_WORK:
        status = "needs_work"
    else:
        status = "problematic"

    # Deduplicate recommendations
    seen: set[str] = set()
    unique_recs: list[str] = []
    for r in recommendations:
        if r not in seen:
            seen.add(r)
            unique_recs.append(r)

    report = AssetQAReport(
        asset_id=asset_id,
        score=score,
        status=status,
        issues=issues,
        strengths=strengths,
        recommendations=unique_recs,
        generated_at=now,
    )
    _save_qa(report)
    update_qa_metadata(asset_id, score, status, now, project_id)
    return report
