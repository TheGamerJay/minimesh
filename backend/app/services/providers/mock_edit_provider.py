from __future__ import annotations
import json
from datetime import datetime, timezone

from app.models.editing import EditOperation
from app.services.project_context import PROJECT_ROOT

_EDIT_COMPLETE_SECS = 4
_EDIT_PROCESSING_SECS = 1


def _elapsed(created_at: str) -> float:
    created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - created).total_seconds()


def poll(op: EditOperation) -> EditOperation:
    elapsed = _elapsed(op.created_at)
    now = datetime.now(timezone.utc).isoformat()

    if elapsed < _EDIT_PROCESSING_SECS:
        op.status = "queued"
        op.message = "Edit operation queued — waiting for worker"
    elif elapsed < _EDIT_COMPLETE_SECS:
        op.status = "processing"
        span = _EDIT_COMPLETE_SECS - _EDIT_PROCESSING_SECS
        progress = min(99, int((elapsed - _EDIT_PROCESSING_SECS) / span * 100))
        op.message = f"Applying {op.operation_type} ({op.brush_type})… {progress}%"
    else:
        op.status = "completed"
        op.message = f"{op.operation_type.capitalize()} ({op.brush_type}) complete (mock)"
        _write_result(op)

    op.updated_at = now
    return op


def _write_result(op: EditOperation) -> None:
    out_dir = PROJECT_ROOT / "exports" / "edits" / op.id
    out_dir.mkdir(parents=True, exist_ok=True)
    result = {
        "operation_id": op.id,
        "asset_id": op.asset_id,
        "operation_type": op.operation_type,
        "brush_type": op.brush_type,
        "provider": "mock",
        "completed_at": op.updated_at,
        "note": "Mock edit result — no real mesh deformation was applied.",
    }
    (out_dir / "edit_result.json").write_text(
        json.dumps(result, indent=2), encoding="utf-8"
    )
