from __future__ import annotations
import json
from pathlib import Path

from fastapi import HTTPException

from app.models.modules import (
    BUILT_IN_MODULES,
    BUILT_IN_SOCKETS,
    BUILT_IN_TRANSFORM_STATES,
    AttachmentSocket,
    RigModule,
    TransformState,
)
from app.services.project_context import get_modules_dir

_MODULE_MAP: dict[str, dict] = {m["id"]: m for m in BUILT_IN_MODULES}
_SOCKET_MAP: dict[str, dict] = {s["id"]: s for s in BUILT_IN_SOCKETS}
_TRANSFORM_MAP: dict[str, dict] = {t["id"]: t for t in BUILT_IN_TRANSFORM_STATES}

_MODULE_TO_SOCKET_TYPE: dict[str, str] = {
    "wings": "wings",
    "shield": "weapon",
    "weapon": "weapon",
    "armor": "armor",
    "tail": "armor",
    "accessory": "accessory",
    "vehicle_part": "accessory",
}


def list_modules() -> list[RigModule]:
    return [RigModule(**m) for m in BUILT_IN_MODULES]


def list_sockets() -> list[AttachmentSocket]:
    return [AttachmentSocket(**s) for s in BUILT_IN_SOCKETS]


def _modules_dir() -> Path:
    d = get_modules_dir()
    d.mkdir(parents=True, exist_ok=True)
    return d


def _assignment_path(rig_job_id: str) -> Path:
    return _modules_dir() / f"{rig_job_id}_assignment.json"


def assign_modules(rig_job_id: str, module_ids: list[str]) -> dict:
    from app.services.rig_service import get_rig_job

    rig_job = get_rig_job(rig_job_id)
    if rig_job.status != "completed":
        raise HTTPException(
            status_code=422,
            detail="Rig job must be completed before assigning modules.",
        )

    for mid in module_ids:
        if mid not in _MODULE_MAP:
            raise HTTPException(status_code=422, detail=f"Module '{mid}' not found.")

    rig_bones = {b["name"] for b in (rig_job.skeleton_data or {}).get("bones", [])}

    assigned: list[dict] = []
    incompatible: list[dict] = []

    for mid in module_ids:
        m = _MODULE_MAP[mid]
        rig_type_ok = rig_job.rig_type in m["compatible_rig_types"]
        real_required = [b for b in m["required_bones"] if not b.endswith("_socket")]
        missing = [b for b in real_required if b not in rig_bones]

        if rig_type_ok and not missing:
            assigned.append(m)
        else:
            reason = (
                f"Rig type '{rig_job.rig_type}' not in compatible list."
                if not rig_type_ok
                else f"Missing bones: {missing}"
            )
            incompatible.append({**m, "incompatibility_reason": reason})

    socket_types_needed = {
        _MODULE_TO_SOCKET_TYPE.get(m["module_type"], "accessory") for m in assigned
    }
    compatible_sockets = [s for s in BUILT_IN_SOCKETS if s["attachment_type"] in socket_types_needed]

    assigned_ids = {m["id"] for m in assigned}
    relevant_states = [
        t for t in BUILT_IN_TRANSFORM_STATES
        if not t["active_modules"] or any(mid in assigned_ids for mid in t["active_modules"])
    ]

    save = {
        "rig_job_id": rig_job_id,
        "module_ids": [m["id"] for m in assigned],
        "socket_ids": [s["id"] for s in compatible_sockets],
        "transform_state_ids": [t["id"] for t in relevant_states],
    }
    _assignment_path(rig_job_id).write_text(json.dumps(save, indent=2))

    return {
        "rig_job_id": rig_job_id,
        "assigned_modules": [RigModule(**m).model_dump() for m in assigned],
        "incompatible_modules": incompatible,
        "compatible_sockets": [AttachmentSocket(**s).model_dump() for s in compatible_sockets],
        "transform_states": [TransformState(**t).model_dump() for t in relevant_states],
    }


def get_rig_assignment(rig_job_id: str) -> dict:
    p = _assignment_path(rig_job_id)
    if not p.exists():
        return {
            "rig_job_id": rig_job_id,
            "assigned_modules": [],
            "incompatible_modules": [],
            "compatible_sockets": [],
            "transform_states": [],
        }

    data = json.loads(p.read_text())
    return {
        "rig_job_id": rig_job_id,
        "assigned_modules": [
            RigModule(**_MODULE_MAP[mid]).model_dump()
            for mid in data.get("module_ids", [])
            if mid in _MODULE_MAP
        ],
        "incompatible_modules": [],
        "compatible_sockets": [
            AttachmentSocket(**_SOCKET_MAP[sid]).model_dump()
            for sid in data.get("socket_ids", [])
            if sid in _SOCKET_MAP
        ],
        "transform_states": [
            TransformState(**_TRANSFORM_MAP[tid]).model_dump()
            for tid in data.get("transform_state_ids", [])
            if tid in _TRANSFORM_MAP
        ],
    }
