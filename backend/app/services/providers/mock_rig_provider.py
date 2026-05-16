from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

from app.services.project_context import get_export_rigs_dir

_RIG_SKELETON_DATA: dict[str, dict] = {
    "humanoid": {
        "bones": [
            {"name": "head", "position": [0, 1.72, 0], "parent": None},
            {"name": "neck", "position": [0, 1.52, 0], "parent": "head"},
            {"name": "spine", "position": [0, 1.0, 0], "parent": "neck"},
            {"name": "pelvis", "position": [0, 0.5, 0], "parent": "spine"},
            {"name": "left_arm", "position": [-0.38, 1.25, 0], "parent": "spine"},
            {"name": "right_arm", "position": [0.38, 1.25, 0], "parent": "spine"},
            {"name": "left_leg", "position": [-0.15, 0.05, 0], "parent": "pelvis"},
            {"name": "right_leg", "position": [0.15, 0.05, 0], "parent": "pelvis"},
        ]
    },
    "creature": {
        "bones": [
            {"name": "head", "position": [0.6, 0.9, 0], "parent": None},
            {"name": "spine", "position": [0, 0.85, 0], "parent": "head"},
            {"name": "front_left_leg", "position": [-0.28, 0.1, 0.4], "parent": "spine"},
            {"name": "front_right_leg", "position": [0.28, 0.1, 0.4], "parent": "spine"},
            {"name": "rear_left_leg", "position": [-0.28, 0.1, -0.4], "parent": "spine"},
            {"name": "rear_right_leg", "position": [0.28, 0.1, -0.4], "parent": "spine"},
            {"name": "tail", "position": [-0.6, 0.65, -0.3], "parent": "spine"},
        ]
    },
    "winged_humanoid": {
        "bones": [
            {"name": "head", "position": [0, 1.72, 0], "parent": None},
            {"name": "neck", "position": [0, 1.52, 0], "parent": "head"},
            {"name": "spine", "position": [0, 1.0, 0], "parent": "neck"},
            {"name": "pelvis", "position": [0, 0.5, 0], "parent": "spine"},
            {"name": "left_arm", "position": [-0.38, 1.25, 0], "parent": "spine"},
            {"name": "right_arm", "position": [0.38, 1.25, 0], "parent": "spine"},
            {"name": "left_leg", "position": [-0.15, 0.05, 0], "parent": "pelvis"},
            {"name": "right_leg", "position": [0.15, 0.05, 0], "parent": "pelvis"},
            {"name": "left_wing", "position": [-0.55, 1.1, -0.1], "parent": "spine"},
            {"name": "right_wing", "position": [0.55, 1.1, -0.1], "parent": "spine"},
        ]
    },
    "prop": {
        "bones": [
            {"name": "root", "position": [0, 0, 0], "parent": None},
        ]
    },
    "vehicle": {
        "bones": [
            {"name": "root", "position": [0, 0, 0], "parent": None},
            {"name": "wheel_front_left", "position": [-0.7, -0.3, 0.9], "parent": "root"},
            {"name": "wheel_front_right", "position": [0.7, -0.3, 0.9], "parent": "root"},
            {"name": "wheel_back_left", "position": [-0.7, -0.3, -0.9], "parent": "root"},
            {"name": "wheel_back_right", "position": [0.7, -0.3, -0.9], "parent": "root"},
        ]
    },
}


class MockRigProvider:
    name = "mock_rig"

    def submit(self, rig_job) -> None:
        rig_job.status = "queued"
        rig_job.message = "Mock rig job queued."

    def poll(self, rig_job) -> None:
        created = datetime.fromisoformat(rig_job.created_at)
        elapsed = (datetime.now(timezone.utc) - created).total_seconds()

        if elapsed < 3:
            rig_job.status = "queued"
            rig_job.message = "Waiting for rig worker..."
        elif elapsed < 8:
            rig_job.status = "processing"
            rig_job.message = f"Placing bones... ({int(elapsed - 3)}/5s)"
        else:
            rig_job.status = "completed"
            rig_job.message = "Rig complete."
            skeleton = _RIG_SKELETON_DATA.get(
                rig_job.rig_type, _RIG_SKELETON_DATA["humanoid"]
            )
            rig_job.skeleton_data = skeleton
            rig_job.outputs = [f"exports/rigs/{rig_job.id}/rig_data.json"]
            self._write_result(rig_job, skeleton)

    def _write_result(self, rig_job, skeleton: dict) -> None:
        out_dir = get_export_rigs_dir() / rig_job.id
        out_dir.mkdir(parents=True, exist_ok=True)
        result = {
            "rig_job_id": rig_job.id,
            "source_job_id": rig_job.source_job_id,
            "rig_type": rig_job.rig_type,
            "skeleton": skeleton,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        (out_dir / "rig_data.json").write_text(json.dumps(result, indent=2))
