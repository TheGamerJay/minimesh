from datetime import datetime, timezone
from app.models.repair import RepairAction, RepairActionResult, RepairPlan

ACTION_DEFS: dict[str, dict] = {
    "run_inspection": {
        "label": "Run Inspection",
        "description": "Analyze the GLB with Blender to extract polygon count, UV data, material count, and bounding box.",
        "priority": 1,
        "navigation": False,
    },
    "run_normalize": {
        "label": "Normalize Mesh",
        "description": "Auto-center and scale the GLB to a 2-unit bounding box using Blender. Fixes oversized or undersized bounding box issues.",
        "priority": 2,
        "navigation": False,
    },
    "render_thumbnail": {
        "label": "Render Thumbnail",
        "description": "Render a clean preview image using Blender Workbench. Fixes the missing-thumbnail issue.",
        "priority": 3,
        "navigation": False,
    },
    "open_texture_studio": {
        "label": "Open Texture Studio",
        "description": "Navigate to Texture Studio to assign PBR maps (albedo, normal, roughness). Fixes UV and material issues.",
        "priority": 4,
        "navigation": True,
    },
    "build_export_package": {
        "label": "Build Export Package",
        "description": "Create a structured ZIP export package. Fixes the missing-export issue.",
        "priority": 5,
        "navigation": True,
    },
    "run_qa": {
        "label": "Run QA Again",
        "description": "Re-run the full QA analysis to update the health score after completing repairs.",
        "priority": 6,
        "navigation": False,
    },
}

# Maps QA issue category → action type(s) that address it
_CATEGORY_ACTIONS: dict[str, list[str]] = {
    "inspection":   ["run_inspection"],
    "uvs":          ["open_texture_studio"],
    "materials":    ["open_texture_studio"],
    "textures":     ["open_texture_studio"],
    "normalization":["run_normalize"],
    "bounds":       ["run_normalize"],
    "thumbnail":    ["render_thumbnail"],
    "exports":      ["build_export_package"],
    "triangles":    [],  # informational only — no automated action available
}


def generate_repair_plan(asset_id: str, project_id: str | None = None) -> RepairPlan:
    from app.services import asset_qa_service

    qa_report = asset_qa_service.get_qa(asset_id)

    # Accumulate: action_type → list of issue_ids that require it
    action_issue_ids: dict[str, list[str]] = {}

    if qa_report:
        for issue in qa_report.issues:
            for action_type in _CATEGORY_ACTIONS.get(issue.category, []):
                action_issue_ids.setdefault(action_type, []).append(issue.id)

    # run_qa is always the final action
    action_issue_ids.setdefault("run_qa", [])

    actions: list[RepairAction] = [
        RepairAction(
            action_type=atype,
            label=ACTION_DEFS[atype]["label"],
            description=ACTION_DEFS[atype]["description"],
            priority=ACTION_DEFS[atype]["priority"],
            issue_ids=issue_ids,
            navigation=ACTION_DEFS[atype]["navigation"],
        )
        for atype, issue_ids in action_issue_ids.items()
    ]
    actions.sort(key=lambda a: a.priority)

    return RepairPlan(
        asset_id=asset_id,
        actions=actions,
        generated_at=datetime.now(timezone.utc).isoformat(),
        qa_score=qa_report.score if qa_report else None,
        qa_status=qa_report.status if qa_report else None,
    )


def run_action(
    asset_id: str,
    action_type: str,
    project_id: str | None = None,
) -> RepairActionResult:
    try:
        if action_type == "run_inspection":
            from app.services import inspection_service
            inspection_service.run_inspection(asset_id, project_id)
            return RepairActionResult(
                action_type=action_type,
                status="triggered",
                message="Inspection complete.",
            )

        if action_type == "run_normalize":
            from app.services import normalize_service
            job = normalize_service.create_normalize_job(asset_id, project_id)
            return RepairActionResult(
                action_type=action_type,
                status="triggered",
                message="Normalize job queued.",
                job_id=job.id,
            )

        if action_type == "render_thumbnail":
            from app.services import thumbnail_service
            job = thumbnail_service.create_thumbnail_job(asset_id, "preview", project_id)
            return RepairActionResult(
                action_type=action_type,
                status="triggered",
                message="Thumbnail render queued.",
                job_id=job.id,
            )

        if action_type == "run_qa":
            from app.services import asset_qa_service
            report = asset_qa_service.run_qa(asset_id, project_id)
            return RepairActionResult(
                action_type=action_type,
                status="triggered",
                message=f"QA complete. Score: {report.score}/100.",
            )

        if action_type in ("open_texture_studio", "build_export_package"):
            # Navigation actions are handled client-side; backend just acknowledges
            return RepairActionResult(
                action_type=action_type,
                status="navigation",
                message="Navigate client-side.",
            )

        return RepairActionResult(
            action_type=action_type,
            status="failed",
            message=f"Unknown action type: {action_type!r}",
        )

    except Exception as exc:
        return RepairActionResult(
            action_type=action_type,
            status="failed",
            message=str(exc),
        )
