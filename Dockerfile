# ─────────────────────────────────────────────────────────────────────────────
# MiniMesh — single-container production image
#
# Architecture:
#   Port 8080 (public)
#   └── nginx  ─┬── /api/*             → uvicorn 127.0.0.1:8000
#               ├── /uploads/*         → uvicorn 127.0.0.1:8000
#               ├── /export-packages/* → uvicorn 127.0.0.1:8000
#               ├── /textures/*        → uvicorn 127.0.0.1:8000
#               └── /*                 → React SPA (frontend/dist)
#
# PROJECT_ROOT inside the container resolves to /app
# (backend/app/services/project_context.py walks 4 dirs up from itself)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Build to /app/frontend/dist
RUN npm run build

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM python:3.11-slim

# System packages: nginx + supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        supervisor \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ───────────────────────────────────────────────────────
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ── Application source ────────────────────────────────────────────────────────
COPY backend/ ./backend/

# ── React production build ────────────────────────────────────────────────────
COPY --from=frontend-build /app/frontend/dist/ ./frontend/dist/

# ── Storage / export directories (writable at runtime) ───────────────────────
RUN mkdir -p \
    storage/uploads \
    storage/jobs \
    storage/rigs \
    storage/animations \
    storage/modules \
    storage/audits \
    storage/projects \
    storage/credits/ledger \
    storage/providers \
    storage/assets \
    storage/textures \
    storage/bakes \
    storage/edits \
    storage/workers/tasks \
    storage/inspections \
    storage/normalize \
    storage/thumbnails \
    storage/export_packages_v2 \
    storage/asset_qa \
    exports/packages \
    exports/rigs \
    exports/animations \
    exports/bakes \
    exports/edits \
    exports/thumbnails \
    exports/packages_v2 \
    exports/projects \
    exports/normalized

# ── Process management config ─────────────────────────────────────────────────
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/minimesh.conf

EXPOSE 8080

ENV APP_ENV=production
ENV PORT=8080
ENV FRONTEND_URL=http://localhost:8080
ENV PYTHONPATH=/app/backend

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/minimesh.conf"]
