# MiniMesh

AI-powered image-to-3D, sculpting, rigging, and animation pipeline studio.

Upload reference images. Choose a sculpt style. Generate a production-ready 3D asset with textures, auto-rigging, and animation — all in one pipeline.

---

## Current Phase: Phase 23 — Real Blender Mesh Normalize Worker (v2.3.0)

Non-destructive Blender GLB normalization — centers at world origin, scales to 2-unit bounding cube, applies transforms, registers as a new asset version. Falls back to file copy when Blender is unavailable. See [docs/PHASES.md](docs/PHASES.md) for the full roadmap.

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

**Worker routes (Phase 21):**

| Route | Method | Description |
|-------|--------|-------------|
| `/api/workers/health` | GET | Worker health + Blender detection status |
| `/api/workers/tasks/create` | POST | Queue a worker task (glb_inspect / mesh_normalize / uv_check / mock_bake / mock_edit / export_prepare) |
| `/api/workers/tasks` | GET | List all worker tasks |
| `/api/workers/tasks/{id}` | GET | Get task status + logs |

**Normalization behavior:**
- Original GLB is **never modified**. Output always goes to `exports/normalized/{job_id}/normalized.glb`
- On completion, registers as a new `AssetVersion` (v2, v3…) via asset registry
- When Blender unavailable: fallback creates a byte-identical copy and marks `fallback_normalized: true`
- Normalized version can be opened directly in the 3D Viewer from the Normalize or Versions tab

**Normalization script:** `workers/blender_normalize.py` centers the scene bounding box at world origin, applies a uniform scale so the model fits a 2-unit cube, applies mesh transforms, and exports as GLB.

**Blender setup:**
```env
# backend/.env
BLENDER_PATH=C:/Program Files/Blender Foundation/Blender 4.2/blender.exe
```
If `BLENDER_PATH` is not set, the worker and inspection pipeline auto-detect Blender via `PATH` and common install locations. If not found, inspection returns a fallback estimate clearly labeled `fallback_estimate: true`.

**Inspection script:** `workers/blender_inspect.py` is the headless Blender script. It clears the scene, imports the GLB, counts meshes/triangles/materials, detects UVs/armature/animations, and computes the world-space bounding box. Output is written to `storage/inspections/{asset_id}_raw.json` and merged into a `GLBInspectionReport`.

**Previous phase highlights:** Local Worker + Blender Bridge (Phase 21), Sculpt Studio + Edit Tools (Phase 20), UV & Bake Prep (Phase 19), Texture Pipeline (Phase 18), Real GLB Viewer (Phase 17), Asset Registry (Phase 16).

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
| Storage    | Local dev → Cloudflare R2 (Phase 13)       |
| Deploy     | Railway (Phase 13)                         |

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
