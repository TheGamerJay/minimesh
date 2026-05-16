from __future__ import annotations
from pathlib import Path

from app.models.baking import UVAnalysis
from app.models.textures import VALID_TEXTURE_TYPES
from app.services.project_context import get_active_project_id


def analyze_uv(asset_id: str) -> UVAnalysis:
    """
    Produce a mock UV analysis for an asset.
    If the asset has a real GLB on disk, return a favorable analysis.
    Otherwise return a conservative estimate with an informational warning.
    """
    from app.services.asset_service import get_asset
    from app.services.project_context import get_assets_dir

    asset = get_asset(asset_id)
    has_real_glb = False
    if asset and asset.file_path:
        fp = Path(asset.file_path)
        has_real_glb = fp.exists() and fp.suffix.lower() == ".glb"

    if has_real_glb:
        return UVAnalysis(
            has_uvs=True,
            uv_channel_count=1,
            overlapping_uvs=False,
            estimated_uv_coverage=82,
            warnings=[],
        )

    # Mock for placeholder / no file
    return UVAnalysis(
        has_uvs=True,
        uv_channel_count=1,
        overlapping_uvs=False,
        estimated_uv_coverage=65,
        warnings=[
            "UV layout not verified — real GLB file not present on disk.",
            "Run a bake preview to confirm UV readiness.",
        ],
    )


def validate_textures(assigned_textures: dict[str, str], available_ids: set[str]) -> dict:
    """
    Validate PBR texture slot assignments.
    Returns: { warnings, suggestions, ready }
    """
    warnings: list[str] = []
    suggestions: list[str] = []

    critical = {"albedo", "normal", "roughness"}
    optional = {"metallic", "emissive", "ao", "opacity"}

    for slot in critical:
        if slot not in assigned_textures:
            warnings.append(f"Missing {slot} map — required for full PBR bake.")

    for slot in optional:
        if slot not in assigned_textures:
            suggestions.append(f"{slot.capitalize()} map not assigned — optional but recommended.")

    # Check stale IDs (texture deleted after assignment)
    for slot, tid in assigned_textures.items():
        if tid not in available_ids:
            warnings.append(f"{slot.capitalize()} assignment references a deleted texture.")

    # Duplicate assignments
    seen_ids: dict[str, str] = {}
    for slot, tid in assigned_textures.items():
        if tid in seen_ids:
            warnings.append(f"{slot.capitalize()} and {seen_ids[tid].capitalize()} share the same texture — may cause incorrect bake output.")
        else:
            seen_ids[tid] = slot

    ready = len(warnings) == 0
    return {"warnings": warnings, "suggestions": suggestions, "ready": ready}
