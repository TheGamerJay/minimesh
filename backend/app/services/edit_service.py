from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.editing import EditOperation, EditHistoryEntry, VALID_OPERATION_TYPES
from app.services.providers import mock_edit_provider
from app.services.project_context import PROJECT_ROOT

_EDITS_DIR = PROJECT_ROOT / "storage" / "edits"


def _op_path(op_id: str) -> Path:
    return _EDITS_DIR / f"{op_id}.json"


def _history_path() -> Path:
    return _EDITS_DIR / "history.json"


def _load_op(op_id: str) -> EditOperation | None:
    p = _op_path(op_id)
    if not p.exists():
        return None
    return EditOperation(**json.loads(p.read_text(encoding="utf-8")))


def _save_op(op: EditOperation) -> None:
    _EDITS_DIR.mkdir(parents=True, exist_ok=True)
    _op_path(op.id).write_text(op.model_dump_json(indent=2), encoding="utf-8")


def _load_history() -> list[EditHistoryEntry]:
    p = _history_path()
    if not p.exists():
        return []
    return [EditHistoryEntry(**e) for e in json.loads(p.read_text(encoding="utf-8"))]


def _append_history(entry: EditHistoryEntry) -> None:
    history = _load_history()
    history.insert(0, entry)
    _history_path().write_text(
        json.dumps([e.model_dump() for e in history], indent=2),
        encoding="utf-8",
    )


def create_edit_operation(
    asset_id: str,
    operation_type: str,
    brush_type: str = "clay",
    strength: float = 0.5,
    radius: float = 20.0,
    position: list[float] | None = None,
) -> EditOperation:
    if operation_type not in VALID_OPERATION_TYPES:
        raise ValueError(f"Invalid operation_type: {operation_type!r}. Must be one of: {VALID_OPERATION_TYPES}")

    now = datetime.now(timezone.utc).isoformat()
    op = EditOperation(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        operation_type=operation_type,
        brush_type=brush_type,
        strength=strength,
        radius=radius,
        position=position or [],
        status="queued",
        provider="mock",
        message="Edit operation created",
        created_at=now,
        updated_at=now,
    )
    _save_op(op)

    entry = EditHistoryEntry(
        id=str(uuid.uuid4()),
        operation_id=op.id,
        asset_id=asset_id,
        operation_name=f"{operation_type.capitalize()} ({brush_type})",
        created_at=now,
    )
    _append_history(entry)
    return op


def get_edit_operation(op_id: str) -> EditOperation | None:
    op = _load_op(op_id)
    if not op:
        return None
    if op.status in ("queued", "processing"):
        op = mock_edit_provider.poll(op)
        _save_op(op)
    return op


def list_edit_operations(asset_id: str | None = None) -> list[EditOperation]:
    if not _EDITS_DIR.exists():
        return []
    ops: list[EditOperation] = []
    for p in sorted(_EDITS_DIR.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
        if p.name == "history.json":
            continue
        try:
            op = EditOperation(**json.loads(p.read_text(encoding="utf-8")))
            if asset_id and op.asset_id != asset_id:
                continue
            if op.status in ("queued", "processing"):
                op = mock_edit_provider.poll(op)
                _save_op(op)
            ops.append(op)
        except Exception:
            continue
    return ops
