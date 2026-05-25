# MiniMesh

AI-powered image-to-3D, sculpting, rigging, and animation pipeline studio.

Upload reference images. Choose a sculpt style. Generate a production-ready 3D asset with textures, auto-rigging, and animation — all in one pipeline.

---

## Current Phase: Phase 29 — Auth + User Ownership Foundation (v2.9.0)

Local authentication, per-user project isolation, and protected routes. Secure token sessions (30-day TTL), bcrypt password hashing, Bearer token middleware, per-user storage paths, and automatic legacy data migration. See [docs/PHASES.md](docs/PHASES.md) for the full roadmap.

**Auth routes:**

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Create account `{username, email, password}` → `{token, user}` |
| `/api/auth/login` | POST | Public | Login `{username, password}` → `{token, user}` |
| `/api/auth/logout` | POST | Bearer | Invalidate session token |
| `/api/auth/me` | GET | Bearer | Get current user `{id, username, email}` |

**Protected routes:** All `/api/*` routes except `/api/auth/` and `/health*` require `Authorization: Bearer {token}`.

**Session setup:**
```bash
# Register a new account
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "myname", "email": "me@example.com", "password": "secret123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "myname", "password": "secret123"}'

# Use token on protected routes
curl http://localhost:8080/api/library/projects \
  -H "Authorization: Bearer {token}"
```

**Legacy migration:** If pre-auth storage data exists (`storage/projects/`, `storage/uploads/`), a `default_local_user` is automatically created on startup:
```
username : local
password : local
```
Log in with these credentials to access existing project data.

**Repair routes (Phase 27):**

| Route | Method | Description |
|-------|--------|-------------|
| `/api/repairs/{asset_id}/plan` | GET | Generate repair plan from latest QA report |
| `/api/repairs/{asset_id}/run/{action_type}` | POST | Trigger a specific repair action (201) |

**Asset QA routes (Phase 26):**

| Route | Method | Description |
|-------|--------|-------------|
| `/api/asset-qa/run/{asset_id}` | POST | Run QA analysis, returns `AssetQAReport` |
| `/api/asset-qa/{asset_id}` | GET | Get latest QA report (404 if none) |

**QA scoring deductions:**

| Issue | Deduction |
|-------|-----------|
| No inspection report | -8 |
| Missing UVs | -15 |
| No materials | -10 |
| Not normalized | -12 |
| Bounding box out of range | -8 |
| No project textures | -10 |
| No thumbnail | -10 |
| No export packages | -5 |
| Triangle count >500k or <100 | -6 |

**Export V2 routes (Phase 25):**

| Route | Method | Description |
|-------|--------|-------------|
| `/api/export-v2/create` | POST | Build export package `{asset_id, export_type, version_label}` |
| `/api/export-v2/{id}/download` | GET | Download ZIP (Content-Disposition: attachment) |
| `/api/export-v2/{id}` | GET | Get package metadata |
| `/api/export-v2` | GET | List packages (`?asset_id=` filter) |

**Export types:**

| Type | Contents |
|------|---------|
| `glb_package` | model + thumbnail + manifest |
| `game_ready` | model + textures + thumbnail + manifest |
| `texture_bundle` | textures only + manifest |
| `inspection_bundle` | model + inspection report + manifest |
| `full_project_bundle` | all available files |

**ZIP structure:**
```
MyAsset_latest.zip
  model/asset.glb
  textures/albedo_texture.png
  preview/thumbnail.png
  inspection/report.json
  manifest.json
```

**Thumbnail routes (Phase 24):**

| Route | Method | Description |
|-------|--------|-------------|
| `/api/thumbnails/render/{asset_id}` | POST | Start Blender thumbnail render (`?render_type=preview\|turntable\|material_preview`) |
| `/api/thumbnails/capture/{asset_id}` | POST | Save viewer canvas capture as thumbnail (`body: {data_url}`) |
| `/api/thumbnails/{job_id}` | GET | Get thumbnail job status |
| `/api/thumbnails` | GET | List thumbnail jobs (`?asset_id=` filter) |

**Normalize routes (Phase 23):**

| Route | Method | Description |
|-------|--------|-------------|
| `/api/normalize/run/{asset_id}` | POST | Start normalize job (creates versioned GLB copy) |
| `/api/normalize/{job_id}` | GET | Get normalize job status |
| `/api/normalize` | GET | List all normalize jobs (`?asset_id=` filter) |

**Inspection routes (Phase 22):**

| Route | Method | Description |
|-------|--------|-------------|
| `/api/inspections/run/{asset_id}` | POST | Run GLB inspection (Blender if available, fallback otherwise) |
| `/api/inspections/{asset_id}` | GET | Get latest inspection report |

**Thumbnail behavior:**
- Uses `BLENDER_WORKBENCH` engine — reliable in headless environments without GPU/display
- Thumbnails stored at `exports/thumbnails/{job_id}/thumbnail.png`
- `asset.thumbnail` field set on completion — AssetCard and ThumbnailRenderPanel display it
- Fallback: uses `asset.preview_image` when Blender unavailable
- Auto-trigger: normalize completion automatically queues a `preview` thumbnail render

**Capture as Thumbnail:**
- "Capture as Thumbnail" button in Viewer3D header (visible when a real GLB is loaded for an asset)
- Extracts the live Three.js canvas via `gl.domElement.toDataURL` and POSTs to `/api/thumbnails/capture/{asset_id}`
- Saved to `exports/thumbnails/captures/{asset_id}/thumbnail.png`

**Blender setup:**
```env
# backend/.env
BLENDER_PATH=C:/Program Files/Blender Foundation/Blender 4.2/blender.exe
```
If `BLENDER_PATH` is not set, the worker pipeline auto-detects Blender via `PATH` and common install locations. If Blender is not found, thumbnail render marks `fallback: true` and uses the provider preview image.

**Health check routes (Phase 28):**

| Route | Method | Description |
|-------|--------|-------------|
| `/health/live` | GET | Liveness probe — always 200 |
| `/health/ready` | GET | Readiness probe — storage, frontend, providers, Blender |

**Environment variables:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 8080 | Server port |
| `APP_ENV` | No | development | `production` enables same-origin CORS |
| `STORAGE_PATH` | No | `./storage` | Asset storage root |
| `BLENDER_PATH` | No | — | Blender executable path |
| `MESHY_API_KEY` | No | — | Meshy API key (mock if unset) |
| `TRIPO_API_KEY` | No | — | Tripo API key (stub) |
| `RODIN_API_KEY` | No | — | Rodin API key (stub) |

**Docker deployment:**

```bash
# Build
docker build -t minimesh .

# Run with persistent volumes
docker run --rm -p 8080:8080 \
  -v minimesh-storage:/app/storage \
  -v minimesh-exports:/app/exports \
  minimesh
```

**Mini Forge deployment:** Connect the `TheGamerJay/minimesh` GitHub repo inside Mini Forge. The `miniforge.json` at the repo root declares the build command, start command, health check path, and required volumes.

**Previous phase highlights:** Auto-Repair Action Planner (Phase 27), Real Provider Output QA (Phase 26), Real Export Upgrade (Phase 25), Blender Thumbnail Renderer (Phase 24), Mesh Normalize Worker (Phase 23), GLB Inspection (Phase 22), Local Worker + Blender Bridge (Phase 21), Sculpt Studio (Phase 20).

---

## Tech Stack

| Layer      | Technology                                 |
|------------|--------------------------------------------|
| Frontend   | React 18, Vite, TypeScript, Tailwind CSS   |
| Backend    | Python 3.11+, FastAPI, Uvicorn             |
| Config     | pydantic-settings, python-dotenv           |
| 3D Preview | Three.js / React Three Fiber (Phase 5+)    |
| Database   | PostgreSQL (Phase 4+)                      |
| Workers    | Celery + Redis (Phase 4+)                  |
| Storage    | Local dev filesystem → persistent volumes  |
| Deploy     | Docker + nginx + supervisor (Mini Forge)   |

---

## Running the Backend

```bash
cd backend

# 1. Create a virtual environment
python -m venv venv

# 2. Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment config
cp .env.example .env

# 5. Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Backend will be available at: http://localhost:8080

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | App info + status |
| `/health` | GET | `{"status": "ok"}` |
| `/api/uploads/images` | POST | Upload one or more images (multipart/form-data) |
| `/api/uploads/images` | GET | List all uploaded images (includes role/notes/is_primary) |
| `/api/uploads/images/{id}/metadata` | PATCH | Update reference_role, notes, is_primary |
| `/api/uploads/images/{id}` | DELETE | Delete an image by ID |
| `/uploads/{filename}` | GET | Serve a stored image file |
| `/api/project/session` | GET | Get local project session + readiness score + mode requirements |
| `/api/project/session` | PATCH | Update project name |
| `/api/generation/config` | GET | Get current generation config |
| `/api/generation/config` | PATCH | Update mode, style, rig intent, quality, texture style, notes |
| `/api/jobs/generate` | POST | Create a generation job (validates readiness + mode requirements) |
| `/api/jobs/{id}` | GET | Get job status (polls mock provider if not terminal) |
| `/api/jobs` | GET | List all jobs, newest first |
| `/api/exports/{job_id}/create` | POST | Create export package from completed job |
| `/api/exports/job/{job_id}` | GET | List all exports for a job |
| `/api/exports/{export_id}` | GET | Get export manifest |
| `/api/exports/{export_id}/download` | GET | Download ZIP bundle |

### Upload limits

| Constraint | Value |
|------------|-------|
| Allowed types | PNG, JPG, JPEG, WEBP |
| Max file size | 25 MB per image |
| Max images | 20 per session |

### Reference roles

Each image can be tagged with one of: `unassigned`, `front_view`, `back_view`, `side_view`, `material_reference`, `weapon_reference`, `armor_reference`, `helmet_reference`, `environment_reference`, `other`. Only one image per role can hold `is_primary = true`.

### Readiness scoring

The backend scores the current reference set 0–100 based on which roles are covered:

| Criterion | Points |
|-----------|--------|
| front_view present | +25 |
| back_view present | +20 |
| side_view present | +20 |
| material_reference or armor_reference present | +20 |
| Any image set as primary | +15 |

Status:
- **not_ready** — no front view, or front + neither back/side
- **basic_ready** — front view + at least one of back/side
- **strong_ready** — front + back + side + material/armor reference

Uploaded files are stored at `storage/uploads/` in the project root. Each image is saved as `{uuid}.{ext}` alongside a `{uuid}.json` metadata sidecar file. The project session is stored at `storage/project_session.json`.

---

## Running the Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Frontend will be available at: http://localhost:5173

The Vite dev server proxies `/api` and `/uploads` requests to the backend on port 8080.

---

## Project Structure

```
minimesh/
  backend/          FastAPI API server
    app/
      main.py       Entry point
      config.py     Settings (pydantic-settings)
      routes/       API route modules
      core/         Core utilities (future)
      models/       Data models (future)
      services/     Business logic (future)
      utils/        Helpers (future)
  frontend/         React + Vite + TypeScript UI
    src/
      App.tsx       Main app shell
      components/   Reusable UI components (future)
      pages/        Page-level components (future)
      lib/
        uploads.ts  Upload API client (uploadImages, getUploadedImages, deleteImage)
      pages/
        UploadStudio.tsx  Drag-and-drop upload UI with gallery and preview modal
      types/        TypeScript type definitions (future)
  workers/          Background job processors (Phase 4+)
  pipelines/        AI pipeline stage definitions (Phase 4+)
  docs/             Project documentation
  storage/          Local file storage (dev)
  exports/          Generated asset output (dev)
```

---

## Documentation

- [Project Vision](docs/PROJECT_VISION.md)
- [Development Phases](docs/PHASES.md)
- [Architecture](docs/ARCHITECTURE.md)
