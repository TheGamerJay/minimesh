# MiniMesh

AI-powered image-to-3D, sculpting, rigging, and animation pipeline studio.

Upload reference images. Choose a sculpt style. Generate a production-ready 3D asset with textures, auto-rigging, and animation — all in one pipeline.

---

## Current Phase: Phase 20 — Sculpt / Edit Tools Foundation (v2.0.0)

Full sculpt workspace with edit operation architecture, transform gizmo, brush system, and edit history timeline. See [docs/PHASES.md](docs/PHASES.md) for the full roadmap.

**Edit routes (Phase 20):**

| Route | Method | Description |
|-------|--------|-------------|
| `/api/edits/create` | POST | Create a mock edit operation (sculpt/smooth/inflate/pinch/move/transform/mirror) |
| `/api/edits` | GET | List edit operations (optional `?asset_id=`) |
| `/api/edits/{id}` | GET | Get operation status (polls mock provider if non-terminal) |

**Sculpt workspace:**
- **SculptToolbar** — 6 tool modes: Clay, Smooth, Inflate, Pinch, Move, Mirror
- **BrushSettingsPanel** — radius, strength, symmetry toggle, falloff (sphere/gaussian/flat)
- **GizmoOverlay** — R3F transform gizmo (move arrows, rotate rings, scale cubes) — visual only
- **EditHistoryPanel** — horizontal timeline of past operations with status, undo/redo placeholders
- **EditOperationPanel** — inspector with Apply button, current settings, last operation status

**Edit operation behavior:** Mock provider simulates queued (0–1s) → processing (1–4s) → completed (≥4s). No real mesh deformation applied. Result JSON written to `exports/edits/{id}/edit_result.json`. History stored at `storage/edits/history.json`.

**Previous phase highlights:** Texture Studio (Phase 18–19), UV & Bake Prep (Phase 19), Generated Asset Registry (Phase 16), Real GLB Viewer (Phase 17), Auto-Rigging (Phase 7), Animation Preview (Phase 8), Material Studio (Phase 12).

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
