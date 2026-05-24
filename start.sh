#!/bin/sh
# MiniMesh — production start script (non-Docker / bare uvicorn)
# For Docker deployment: use `docker build -t minimesh . && docker run -p 8080:8080 minimesh`
set -e

PORT=${PORT:-8080}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[MiniMesh] Starting..."
echo "[MiniMesh] Root     : $SCRIPT_DIR"
echo "[MiniMesh] Port     : $PORT"
echo "[MiniMesh] Env      : ${APP_ENV:-development}"
echo "[MiniMesh] Storage  : ${STORAGE_PATH:-$SCRIPT_DIR/storage}"
echo "[MiniMesh] Blender  : ${BLENDER_PATH:-not configured (fallback mode)}"
echo "[MiniMesh] Meshy    : $([ -n "$MESHY_API_KEY" ] && echo 'configured' || echo 'not set (mock provider)')"

# Create required storage and export directories
mkdir -p "$SCRIPT_DIR/storage/uploads"
mkdir -p "$SCRIPT_DIR/storage/jobs"
mkdir -p "$SCRIPT_DIR/storage/rigs"
mkdir -p "$SCRIPT_DIR/storage/animations"
mkdir -p "$SCRIPT_DIR/storage/modules"
mkdir -p "$SCRIPT_DIR/storage/audits"
mkdir -p "$SCRIPT_DIR/storage/projects"
mkdir -p "$SCRIPT_DIR/storage/credits/ledger"
mkdir -p "$SCRIPT_DIR/storage/providers"
mkdir -p "$SCRIPT_DIR/storage/assets"
mkdir -p "$SCRIPT_DIR/storage/textures"
mkdir -p "$SCRIPT_DIR/storage/bakes"
mkdir -p "$SCRIPT_DIR/storage/edits"
mkdir -p "$SCRIPT_DIR/storage/workers/tasks"
mkdir -p "$SCRIPT_DIR/storage/inspections"
mkdir -p "$SCRIPT_DIR/storage/normalize"
mkdir -p "$SCRIPT_DIR/storage/thumbnails"
mkdir -p "$SCRIPT_DIR/storage/export_packages_v2"
mkdir -p "$SCRIPT_DIR/storage/asset_qa"
mkdir -p "$SCRIPT_DIR/storage/repairs"
mkdir -p "$SCRIPT_DIR/exports/packages"
mkdir -p "$SCRIPT_DIR/exports/rigs"
mkdir -p "$SCRIPT_DIR/exports/animations"
mkdir -p "$SCRIPT_DIR/exports/bakes"
mkdir -p "$SCRIPT_DIR/exports/edits"
mkdir -p "$SCRIPT_DIR/exports/thumbnails"
mkdir -p "$SCRIPT_DIR/exports/packages_v2"
mkdir -p "$SCRIPT_DIR/exports/projects"
mkdir -p "$SCRIPT_DIR/exports/normalized"

echo "[MiniMesh] Storage directories ready."
echo "[MiniMesh] Launching backend on 0.0.0.0:$PORT..."

cd "$SCRIPT_DIR/backend"
exec python -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "$PORT" \
  --workers 1
