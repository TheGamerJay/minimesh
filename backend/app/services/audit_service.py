from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models.audit import AuditIssue, PipelineSummaryItem, ProjectAudit
from app.services.project_context import get_audits_dir, get_uploads_dir


def _audits_dir() -> Path:
    d = get_audits_dir()
    d.mkdir(parents=True, exist_ok=True)
    return d


def _audit_path(audit_id: str) -> Path:
    return _audits_dir() / f"{audit_id}.json"


def _save(audit: ProjectAudit) -> None:
    _audit_path(audit.id).write_text(audit.model_dump_json(indent=2))


def _make_issue(now: str, severity: str, category: str, title: str, description: str, suggestion: str) -> AuditIssue:
    return AuditIssue(
        id=str(uuid.uuid4()),
        severity=severity,
        category=category,
        title=title,
        description=description,
        suggestion=suggestion,
        created_at=now,
    )


def run_audit() -> ProjectAudit:
    now = datetime.now(timezone.utc).isoformat()
    issues: list[AuditIssue] = []
    strengths: list[str] = []
    score = 100

    # â”€â”€ References â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ref_status = "missing"
    ref_detail = "No images uploaded"
    try:
        uploads_dir = get_uploads_dir()
        sidecars = list(uploads_dir.glob("*.json")) if uploads_dir.exists() else []
        images = []
        for sf in sidecars:
            try:
                images.append(json.loads(sf.read_text()))
            except Exception:
                continue

        if not images:
            issues.append(_make_issue(now, "critical", "references",
                "No reference images uploaded",
                "No images found in the project. Generation requires at least a front-view reference.",
                "Upload reference images to begin the pipeline."))
            score -= 20
            ref_status = "missing"
            ref_detail = "No images uploaded"
        else:
            roles = {img.get("reference_role", "unassigned") for img in images}
            has_primary = any(img.get("is_primary", False) for img in images)
            problems = []

            if "front_view" not in roles:
                issues.append(_make_issue(now, "critical", "references",
                    "Missing front-view reference",
                    "No front-view image tagged. This is required for all generation modes.",
                    "Upload a front-view reference image and tag it as 'front_view'."))
                score -= 10
                problems.append("no front view")
            else:
                strengths.append("Front-view reference image present.")

            if "back_view" not in roles:
                issues.append(_make_issue(now, "warning", "references",
                    "Missing back-view reference",
                    "No back-view image tagged. 3D workflows benefit significantly from back views.",
                    "Upload a back-view reference image to improve 3D reconstruction accuracy."))
                score -= 8
                problems.append("no back view")
            else:
                strengths.append("Back-view reference image present.")

            if "side_view" not in roles:
                issues.append(_make_issue(now, "warning", "references",
                    "Missing side-view reference",
                    "No side-view image tagged. Game-ready and cinematic modes require side views.",
                    "Upload a side-view reference image to improve silhouette accuracy."))
                score -= 8
                problems.append("no side view")
            else:
                strengths.append("Side-view reference image present.")

            if not has_primary:
                issues.append(_make_issue(now, "warning", "references",
                    "No primary image set",
                    "No image is marked as primary. The primary image guides generation more strongly.",
                    "Mark your most important reference image as primary."))
                score -= 6
                problems.append("no primary")
            else:
                strengths.append("Primary reference image designated.")

            if "material_reference" not in roles and "armor_reference" not in roles:
                issues.append(_make_issue(now, "info", "references",
                    "No material or armor reference",
                    "No material reference tagged. Surface detail quality may be reduced.",
                    "Upload a material or armor reference for better texture guidance."))
                score -= 8
            else:
                strengths.append("Material or armor reference present.")

            ref_status = "warning" if problems else "healthy"
            ref_detail = f"{len(images)} image(s) Â· {', '.join(problems) if problems else 'all roles covered'}"
    except Exception:
        ref_status = "warning"
        ref_detail = "Could not load references"

    # â”€â”€ Generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    gen_status = "missing"
    gen_detail = "No jobs created"
    try:
        from app.services.job_service import list_jobs
        jobs = list_jobs()
        completed_jobs = [j for j in jobs if j.status == "completed"]
        failed_jobs = [j for j in jobs if j.status == "failed"]
        processing_jobs = [j for j in jobs if j.status in ("queued", "processing")]

        if failed_jobs:
            issues.append(_make_issue(now, "critical", "generation",
                "Generation job(s) failed",
                f"{len(failed_jobs)} generation job(s) ended in failure.",
                "Review error messages and retry generation with corrected configuration."))
            score -= 12
            gen_status = "failed"
            gen_detail = f"{len(failed_jobs)} failed, {len(completed_jobs)} completed"
        elif completed_jobs:
            strengths.append(f"{len(completed_jobs)} generation job(s) completed successfully.")
            gen_status = "healthy"
            gen_detail = f"{len(completed_jobs)} job(s) completed"
        elif processing_jobs:
            gen_status = "warning"
            gen_detail = f"{len(processing_jobs)} job(s) in progress"
        else:
            issues.append(_make_issue(now, "warning", "generation",
                "No generation jobs",
                "No generation jobs have been created yet.",
                "Configure generation settings and create a draft mesh job."))
            score -= 6
            gen_status = "missing"
            gen_detail = "No jobs created"
    except Exception:
        gen_status = "warning"
        gen_detail = "Could not load generation data"

    # â”€â”€ Rigging â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    rig_status = "missing"
    rig_detail = "No rig jobs"
    try:
        from app.services.rig_service import list_rig_jobs
        rig_jobs = list_rig_jobs()
        completed_rigs = [r for r in rig_jobs if r.status == "completed"]
        failed_rigs = [r for r in rig_jobs if r.status == "failed"]

        if not rig_jobs:
            issues.append(_make_issue(now, "info", "rigging",
                "No rig jobs created",
                "No rigging jobs exist. Rigging is required before animation.",
                "Open Rig Studio and create a rig job for your character."))
            score -= 8
            rig_status = "missing"
            rig_detail = "No rig jobs"
        elif not completed_rigs:
            issues.append(_make_issue(now, "warning", "rigging",
                "No completed rig",
                "Rig jobs exist but none have completed successfully.",
                "Wait for rig processing to complete or retry with a different profile."))
            score -= 5
            rig_status = "warning"
            rig_detail = f"{len(failed_rigs)} failed, none completed"
        else:
            strengths.append(f"{len(completed_rigs)} rig(s) completed.")
            rig_status = "healthy"
            rig_detail = f"{len(completed_rigs)} rig(s) completed"
    except Exception:
        rig_status = "warning"
        rig_detail = "Could not load rig data"

    # â”€â”€ Animation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    anim_status = "missing"
    anim_detail = "No animation jobs"
    try:
        from app.services.animation_service import list_animation_jobs
        anim_jobs = list_animation_jobs()
        completed_anims = [a for a in anim_jobs if a.status == "completed"]

        if not anim_jobs:
            issues.append(_make_issue(now, "info", "animation",
                "No animation previews",
                "No animation preview jobs have been created.",
                "Open Animation Preview and apply a motion clip to your rig."))
            score -= 6
            anim_status = "missing"
            anim_detail = "No previews created"
        elif completed_anims:
            strengths.append(f"{len(completed_anims)} animation preview(s) ready.")
            anim_status = "healthy"
            anim_detail = f"{len(completed_anims)} preview(s) ready"
        else:
            anim_status = "warning"
            anim_detail = "Jobs pending completion"
    except Exception:
        anim_status = "warning"
        anim_detail = "Could not load animation data"

    # â”€â”€ Exports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    exp_status = "missing"
    exp_detail = "No exports"
    try:
        from app.services.job_service import list_jobs as _list_jobs
        from app.services.export_service import list_exports_for_job

        completed = [j for j in _list_jobs() if j.status == "completed"]
        all_exports = []
        for j in completed:
            try:
                all_exports.extend(list_exports_for_job(j.id))
            except Exception:
                pass

        if not all_exports:
            issues.append(_make_issue(now, "info", "exports",
                "No export packages generated",
                "No export packages have been created for any completed job.",
                "Generate an export package to verify full pipeline compatibility."))
            score -= 6
            exp_status = "missing"
            exp_detail = "No packages generated"
        else:
            strengths.append(f"{len(all_exports)} export package(s) available.")
            exp_status = "healthy"
            exp_detail = f"{len(all_exports)} package(s) ready"
    except Exception:
        exp_status = "warning"
        exp_detail = "Could not load export data"

    # â”€â”€ Modules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    mod_status = "missing"
    mod_detail = "No module assignments"
    try:
        from app.services.project_context import get_modules_dir
        mod_storage = get_modules_dir()
        assignment_files = list(mod_storage.glob("*_assignment.json")) if mod_storage.exists() else []
        total_assigned = 0
        for af in assignment_files:
            try:
                data = json.loads(af.read_text())
                total_assigned += len(data.get("module_ids", []))
            except Exception:
                pass

        if total_assigned == 0:
            issues.append(_make_issue(now, "info", "modules",
                "No modular rig assignments",
                "No modules assigned to any rig job.",
                "Open Rig Studio > Modules tab to assign wings, weapons, or armor modules."))
            score -= 5
            mod_status = "missing"
            mod_detail = "No modules assigned"
        else:
            strengths.append(f"{total_assigned} module(s) assigned across rig jobs.")
            mod_status = "healthy"
            mod_detail = f"{total_assigned} module(s) assigned"
    except Exception:
        mod_status = "warning"
        mod_detail = "Could not load module data"

    # â”€â”€ Finalize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    score = max(0, min(100, score))
    if score >= 90:
        status = "production_ready"
    elif score >= 65:
        status = "needs_attention"
    else:
        status = "unhealthy"

    pipeline_summary = [
        PipelineSummaryItem(category="References", status=ref_status, detail=ref_detail),
        PipelineSummaryItem(category="Generation", status=gen_status, detail=gen_detail),
        PipelineSummaryItem(category="Rigging", status=rig_status, detail=rig_detail),
        PipelineSummaryItem(category="Animation", status=anim_status, detail=anim_detail),
        PipelineSummaryItem(category="Exports", status=exp_status, detail=exp_detail),
        PipelineSummaryItem(category="Modules", status=mod_status, detail=mod_detail),
    ]

    seen: set[str] = set()
    recommendations: list[str] = []
    for issue in sorted(issues, key=lambda i: {"critical": 0, "warning": 1, "info": 2}[i.severity]):
        if issue.severity in ("critical", "warning") and issue.suggestion not in seen:
            seen.add(issue.suggestion)
            recommendations.append(issue.suggestion)

    audit = ProjectAudit(
        id=str(uuid.uuid4()),
        score=score,
        status=status,
        issues=issues,
        strengths=strengths,
        recommendations=recommendations,
        pipeline_summary=pipeline_summary,
        created_at=now,
    )
    _save(audit)
    return audit


def get_latest_audit() -> ProjectAudit:
    d = _audits_dir()
    files = sorted(d.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        raise HTTPException(status_code=404, detail="No audits found.")
    return ProjectAudit.model_validate_json(files[0].read_text())


def list_audits() -> list[ProjectAudit]:
    d = _audits_dir()
    files = sorted(d.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    result = []
    for f in files:
        try:
            result.append(ProjectAudit.model_validate_json(f.read_text()))
        except Exception:
            continue
    return result
