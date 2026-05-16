from __future__ import annotations
import json
import subprocess
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.workers import WorkerTask, VALID_TASK_TYPES
from app.services import blender_bridge
from app.services.project_context import PROJECT_ROOT

_TASKS_DIR = PROJECT_ROOT / "storage" / "workers" / "tasks"

# Serialize task execution — one task runs at a time
_queue_lock = threading.Lock()

# Safe mock commands keyed by task_type.
# All use sys.executable (always available), no shell=True, no user data interpolated.
_MOCK_COMMANDS: dict[str, list[str]] = {
    "glb_inspect": [
        sys.executable, "-c",
        (
            "import sys; "
            "print('=== GLB Inspect ==='); "
            "print(f'Worker Python: {sys.version.split()[0]}'); "
            "print('Target asset: located (mock)'); "
            "print('Mesh count: 3 (mock)'); "
            "print('Material count: 2 (mock)'); "
            "print('File size: 1.4 MB (mock)'); "
            "print('Status: inspection complete')"
        ),
    ],
    "mesh_normalize": [
        sys.executable, "-c",
        (
            "print('=== Mesh Normalize ==='); "
            "print('Computing bounding box...'); "
            "print('Center: (0.12, 0.05, -0.08) -> (0, 0, 0)'); "
            "print('Scale: 2.0 / 1.83 = 1.093 applied'); "
            "print('Result: mesh fits 2-unit bounding cube (mock)'); "
            "print('Status: normalization complete')"
        ),
    ],
    "uv_check": [
        sys.executable, "-c",
        (
            "print('=== UV Check ==='); "
            "print('Scanning UV channels...'); "
            "print('Channel 0: 1,024 islands, coverage=82%'); "
            "print('Overlapping UVs: none detected'); "
            "print('Seams: 14 detected'); "
            "print('Status: UV layout ready for baking (mock)')"
        ),
    ],
    "mock_bake": [
        sys.executable, "-c",
        (
            "print('=== Mock Bake ==='); "
            "print('Initializing bake pipeline...'); "
            "print('Maps: albedo, normal, roughness, metallic, ao'); "
            "print('Resolution: 2048x2048'); "
            "print('Samples: 128 (mock)'); "
            "print('Progress: 100%'); "
            "print('Status: bake complete (mock)')"
        ),
    ],
    "mock_edit": [
        sys.executable, "-c",
        (
            "print('=== Mock Edit ==='); "
            "print('Loading mesh into edit context...'); "
            "print('Operation: clay sculpt, radius=20, strength=0.5'); "
            "print('Vertices affected: 1,240 / 8,192 (mock)'); "
            "print('Smooth passes: 2'); "
            "print('Status: sculpt edit complete (mock)')"
        ),
    ],
    "export_prepare": [
        sys.executable, "-c",
        (
            "print('=== Export Prepare ==='); "
            "print('Packaging asset for export...'); "
            "print('Files: model.glb, manifest.json, README.txt'); "
            "print('Textures: albedo.png, normal.png, roughness.png'); "
            "print('Bundle size: 2.4 MB (mock)'); "
            "print('Status: export package ready (mock)')"
        ),
    ],
}


def _task_path(task_id: str) -> Path:
    return _TASKS_DIR / f"{task_id}.json"


def _load_task(task_id: str) -> WorkerTask | None:
    p = _task_path(task_id)
    if not p.exists():
        return None
    return WorkerTask(**json.loads(p.read_text(encoding="utf-8")))


def _save_task(task: WorkerTask) -> None:
    _TASKS_DIR.mkdir(parents=True, exist_ok=True)
    _task_path(task.id).write_text(task.model_dump_json(indent=2), encoding="utf-8")


def _run_subprocess(cmd: list[str], timeout: int = 20) -> tuple[str, str, int]:
    """
    Run a subprocess safely:
    - No shell=True
    - Timeout enforced
    - Captured stdout + stderr
    - Arguments passed as list (no interpolation)
    """
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", f"ERROR: Subprocess timed out after {timeout}s", 1
    except FileNotFoundError as e:
        return "", f"ERROR: Command not found — {e}", 1
    except PermissionError as e:
        return "", f"ERROR: Permission denied — {e}", 1
    except Exception as e:
        return "", f"ERROR: Unexpected exception — {e}", 1


def _process_task(task_id: str) -> None:
    """Background worker — runs inside a daemon thread, serialized by _queue_lock."""
    # Detect Blender before acquiring lock (cached, fast after first call)
    blender_info = blender_bridge.detect()

    with _queue_lock:
        task = _load_task(task_id)
        if not task or task.status != "queued":
            return

        now = datetime.now(timezone.utc).isoformat()
        task.status = "running"
        task.updated_at = now
        task.logs = f"[{now}] Task started: {task.task_type}\n"
        _save_task(task)

        # Select command
        if task.task_type in _MOCK_COMMANDS:
            cmd = _MOCK_COMMANDS[task.task_type]
        elif blender_info["found"]:
            # Real Blender available — run version check as a safe probe
            cmd = [blender_info["path"], "--version"]
        else:
            cmd = [sys.executable, "-c", f"print('Worker task: {task.task_type} (mock)'); print('Status: complete')"]

        stdout, stderr, returncode = _run_subprocess(cmd)

        now = datetime.now(timezone.utc).isoformat()
        if stdout:
            task.logs += f"--- stdout ---\n{stdout}\n"
        if stderr:
            task.logs += f"--- stderr ---\n{stderr}\n"
        task.logs += f"[{now}] Exit code: {returncode}\n"

        task.status = "completed" if returncode == 0 else "failed"
        task.updated_at = now
        _save_task(task)


def create_task(task_type: str, asset_id: str | None = None) -> WorkerTask:
    if task_type not in VALID_TASK_TYPES:
        raise ValueError(
            f"Invalid task_type: {task_type!r}. "
            f"Must be one of: {sorted(VALID_TASK_TYPES)}"
        )

    now = datetime.now(timezone.utc).isoformat()
    task = WorkerTask(
        id=str(uuid.uuid4()),
        task_type=task_type,
        asset_id=asset_id,
        status="queued",
        logs="",
        created_at=now,
        updated_at=now,
    )
    _save_task(task)

    # Dispatch to background daemon thread (won't block the HTTP response)
    thread = threading.Thread(target=_process_task, args=(task.id,), daemon=True)
    thread.start()
    return task


def get_task(task_id: str) -> WorkerTask | None:
    return _load_task(task_id)


def list_tasks() -> list[WorkerTask]:
    if not _TASKS_DIR.exists():
        return []
    tasks: list[WorkerTask] = []
    for p in sorted(_TASKS_DIR.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
        try:
            tasks.append(WorkerTask(**json.loads(p.read_text(encoding="utf-8"))))
        except Exception:
            continue
    return tasks


def get_health() -> dict:
    blender_info = blender_bridge.detect()
    tasks = list_tasks()
    return {
        "worker_online": True,
        "blender_available": blender_info["found"],
        "blender_version": blender_info["version"],
        "blender_path": blender_info["path"],
        "blender_mode": blender_info["mode"],
        "queue_size": sum(1 for t in tasks if t.status == "queued"),
        "active_tasks": sum(1 for t in tasks if t.status == "running"),
        "last_check": datetime.now(timezone.utc).isoformat(),
    }
