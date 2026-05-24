import os
from pathlib import Path
from pydantic import BaseModel


class EnvReport(BaseModel):
    port: int
    storage_path: str
    storage_ephemeral: bool
    meshy_key_present: bool
    tripo_key_present: bool
    rodin_key_present: bool
    blender_path: str | None
    app_env: str
    warnings: list[str] = []


def validate() -> EnvReport:
    from app.services.project_context import PROJECT_ROOT

    warnings: list[str] = []

    port = int(os.getenv("PORT", "8080"))
    storage_path_raw = os.getenv("STORAGE_PATH", str(PROJECT_ROOT / "storage"))
    blender_path = os.getenv("BLENDER_PATH") or None
    meshy_key = bool(os.getenv("MESHY_API_KEY", "").strip())
    tripo_key = bool(os.getenv("TRIPO_API_KEY", "").strip())
    rodin_key = bool(os.getenv("RODIN_API_KEY", "").strip())
    app_env = os.getenv("APP_ENV", "development")

    s = storage_path_raw.lower().replace("\\", "/")
    storage_ephemeral = s.startswith("/tmp") or s.startswith("/var/tmp") or s == "/dev/shm"

    if storage_ephemeral:
        warnings.append(
            "Persistent volume recommended for production asset storage. "
            "Current path looks temporary and will not survive container restarts."
        )
    if not meshy_key:
        warnings.append("MESHY_API_KEY not set — using mock provider for 3D generation.")
    if not blender_path:
        warnings.append("BLENDER_PATH not set — Blender features will run in fallback mode.")

    return EnvReport(
        port=port,
        storage_path=storage_path_raw,
        storage_ephemeral=storage_ephemeral,
        meshy_key_present=meshy_key,
        tripo_key_present=tripo_key,
        rodin_key_present=rodin_key,
        blender_path=blender_path,
        app_env=app_env,
        warnings=warnings,
    )


def log_startup() -> EnvReport:
    report = validate()
    sep = "=" * 54
    print(f"\n{sep}")
    print(f"  MiniMesh  v2.8.0  —  {report.app_env}")
    print(f"  Port     : {report.port}")
    print(f"  Storage  : {report.storage_path}")
    print(f"  Blender  : {report.blender_path or 'not configured (fallback)'}")
    print(f"  Meshy    : {'configured ✓' if report.meshy_key_present else 'not set  (mock)'}")
    print(f"  Tripo    : {'configured ✓' if report.tripo_key_present else 'not set'}")
    if report.storage_ephemeral:
        print(f"  ⚠ WARNING : Ephemeral storage detected — data will not persist!")
    for w in report.warnings:
        print(f"  ⚠ {w}")
    print(f"{sep}\n")
    return report
