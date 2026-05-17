from __future__ import annotations
import os
import shutil
import subprocess
import time
from pathlib import Path

# Common Blender install locations per OS
_COMMON_PATHS: list[str] = [
    # Windows
    "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe",
    "C:/Program Files/Blender Foundation/Blender 4.1/blender.exe",
    "C:/Program Files/Blender Foundation/Blender 4.0/blender.exe",
    "C:/Program Files/Blender Foundation/Blender 3.6/blender.exe",
    "C:/Program Files/Blender Foundation/Blender 3.5/blender.exe",
    # macOS
    "/Applications/Blender.app/Contents/MacOS/blender",
    # Linux
    "/usr/bin/blender",
    "/usr/local/bin/blender",
    "/snap/bin/blender",
]

# Simple TTL cache so health checks don't hammer disk/subprocess
_cache: dict | None = None
_cache_time: float = 0.0
_CACHE_TTL_SECS = 60


def find_blender() -> str:
    """Return path to Blender executable, or empty string if not found."""
    env_path = os.environ.get("BLENDER_PATH", "").strip()
    if env_path and Path(env_path).exists():
        return env_path

    which = shutil.which("blender")
    if which:
        return which

    for p in _COMMON_PATHS:
        if Path(p).exists():
            return p

    return ""


def get_blender_version(blender_path: str) -> str:
    """Run `blender --version` safely (no shell=True). Returns first output line or empty."""
    if not blender_path:
        return ""
    try:
        result = subprocess.run(
            [blender_path, "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            shell=False,
        )
        raw = (result.stdout or result.stderr or "").strip()
        return raw.split("\n")[0] if raw else ""
    except Exception:
        return ""


def detect() -> dict:
    """Return Blender detection info (cached for 60 s)."""
    global _cache, _cache_time

    if _cache is not None and (time.time() - _cache_time) < _CACHE_TTL_SECS:
        return _cache

    path = find_blender()
    if not path:
        result = {"found": False, "path": "", "version": "", "mode": "mock"}
    else:
        version = get_blender_version(path)
        result = {
            "found": bool(version),
            "path": path,
            "version": version or "Unknown",
            "mode": "real" if version else "mock",
        }

    _cache = result
    _cache_time = time.time()
    return result


def invalidate_cache() -> None:
    global _cache, _cache_time
    _cache = None
    _cache_time = 0.0


def run_thumbnail_render(
    glb_path: str,
    output_png: str,
    script_path: str,
    render_type: str = "preview",
    timeout: int = 120,
) -> tuple[bool, str, str]:
    """
    Run blender_thumbnail.py headlessly.
    Returns (success, stdout, stderr).
    """
    info = detect()
    if not info["found"]:
        return False, "", "Blender not available"

    cmd = [
        info["path"],
        "--background",
        "--python", script_path,
        "--",
        glb_path,
        output_png,
        render_type,
    ]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", f"ERROR: Blender timed out after {timeout}s"
    except FileNotFoundError as e:
        return False, "", f"ERROR: Blender executable not found — {e}"
    except PermissionError as e:
        return False, "", f"ERROR: Permission denied — {e}"
    except Exception as e:
        return False, "", f"ERROR: Unexpected exception — {e}"


def run_glb_normalize(
    glb_path: str,
    output_glb: str,
    report_json: str,
    script_path: str,
    timeout: int = 120,
) -> tuple[bool, str, str]:
    """
    Run blender_normalize.py headlessly.
    Returns (success, stdout, stderr).
    Caller reads report_json on success.
    NEVER pass output_glb == glb_path — the script enforces this too.
    """
    info = detect()
    if not info["found"]:
        return False, "", "Blender not available"

    cmd = [
        info["path"],
        "--background",
        "--python", script_path,
        "--",
        glb_path,
        output_glb,
        report_json,
    ]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", f"ERROR: Blender timed out after {timeout}s"
    except FileNotFoundError as e:
        return False, "", f"ERROR: Blender executable not found — {e}"
    except PermissionError as e:
        return False, "", f"ERROR: Permission denied — {e}"
    except Exception as e:
        return False, "", f"ERROR: Unexpected exception — {e}"


def run_glb_inspection(
    glb_path: str,
    output_json: str,
    script_path: str,
    timeout: int = 60,
) -> tuple[bool, str, str]:
    """
    Run blender_inspect.py headlessly against glb_path.
    Returns (success, stdout, stderr).
    Caller is responsible for reading output_json on success.
    """
    info = detect()
    if not info["found"]:
        return False, "", "Blender not available"

    blender_exe = info["path"]
    cmd = [
        blender_exe,
        "--background",
        "--python", script_path,
        "--",
        glb_path,
        output_json,
    ]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", f"ERROR: Blender timed out after {timeout}s"
    except FileNotFoundError as e:
        return False, "", f"ERROR: Blender executable not found — {e}"
    except PermissionError as e:
        return False, "", f"ERROR: Permission denied — {e}"
    except Exception as e:
        return False, "", f"ERROR: Unexpected exception — {e}"
