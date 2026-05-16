# MiniMesh — Architecture

## Overview

MiniMesh is structured as a monorepo with clearly separated concerns across frontend, backend, workers, pipelines, and storage.

```
minimesh/
  backend/       FastAPI API server
  frontend/      React + Vite + TypeScript UI
  workers/       Background job processors
  pipelines/     AI pipeline stage definitions
  storage/       Local file storage (dev)
  exports/       Generated asset output (dev)
  docs/          Project documentation
```

---

## Frontend

**Stack:** React 18, Vite, TypeScript, Tailwind CSS, React Three Fiber (Phase 5+)

- Vite dev server on port 5173 with API proxy to backend port 8080.
- Component-based UI with pages for each pipeline stage.
- Three.js viewer for in-browser 3D mesh preview (added in Phase 5).
- No global state library initially; React context or Zustand added as complexity grows.

---

## Backend

**Stack:** Python 3.11+, FastAPI, Uvicorn, Pydantic, pydantic-settings

- RESTful API on port 8080.
- CORS configured for frontend origin.
- Routes organized by domain: health, upload, generation, export, rig.
- `config.py` uses pydantic-settings for environment-driven configuration.
- PostgreSQL added in Phase 4 via SQLAlchemy or Tortoise ORM.

---

## Workers

**Stack:** Python, Celery (planned), Redis (planned)

- Long-running background jobs for AI generation, rigging, and export processing.
- Workers poll provider APIs for job completion and write results to storage.
- Decoupled from the API server to avoid blocking HTTP responses.
- Phase 4+.

---

## Pipelines

**Stack:** Python pipeline definitions

- Each pipeline stage is a discrete Python module: upload → sort → generate → texture → rig → animate → export.
- Stages can be chained or run independently.
- Provider adapters wrap each AI service behind a common interface.
- Phase 4+.

---

## Generation Config

**Stack:** FastAPI route, JSON sidecar file

- Generation configuration is stored at `storage/generation_config.json`.
- Fields: `mode`, `style_direction`, `rig_intent`, `target_quality`, `texture_style`, `notes`.
- Available modes: `two_d_anime_sheet`, `three_d_model`, `clay_sculpt`, `toy_figurine`, `game_ready_character`, `cinematic_high_poly`, `low_poly_mobile`, `prop_only`.
- The selected mode determines which reference roles are required vs. suggested, surfaced in the project session readiness response as `generation_mode_requirements`.
- Route: `GET/PATCH /api/generation/config`

---

## Export Pipeline

**Stack:** FastAPI routes, Python zipfile, JSON manifests, FileResponse

- Export packages stored at `exports/packages/{export_id}/`: README.txt, manifest.json, bundle.zip.
- Per-job index at `exports/jobs/{job_id}/exports_index.json` tracks export IDs for fast listing.
- `ExportManifest` model: job_id, export_id, provider, mode, export_type, files (ExportFile list), created_at.
- `ExportFile` model: filename, path, type (readme/manifest/zip_bundle), size, created_at.
- Download route returns FileResponse with `Content-Disposition: attachment` for browser ZIP save.
- `/export-packages` static mount at backend root (port 8080) for direct file access.
- **Validation**: only `completed` jobs can be exported; failed/processing/queued jobs return 422.
- **Architecture**: `export_type` field is future-extensible to glb, gltf, obj, fbx, zip_bundle as real providers connect.

---

## Viewer Layer

**Stack:** React Three Fiber v8, @react-three/drei v9, Three.js

- `Viewer3D` page: full-screen layout (h-screen, flex-col) with header, toolbar, canvas area, inspector panel, and status bar.
- `MeshViewer`: wraps R3F `Canvas` (dpr=[1,2], antialias, shadows). Inner `SceneContents` component handles R3F hooks (OrbitControls ref + reset trigger, useEffect for camera reset).
- `PlaceholderMesh`: geometric humanoid (sphere head, box torso/hips, cylinder arms/legs, octahedron shoulder gems) with idle Y rotation via `useFrame`. Supports solid/wireframe/toon material modes.
- `EnvironmentLights`: ambient + two directional lights + two point lights (cyan + violet accent).
- `ViewerToolbar`: Reset Camera, Solid/Wireframe/Toon mode buttons, Auto Rotate toggle, Grid toggle.
- `ViewerInspector`: right panel showing job metadata and future-phase placeholders (rig, animation, textures, model loaders).
- `ViewerStatusBar`: bottom strip showing preview mode status and mock provider notice.
- **Real model loading (Phase 14)**: `MeshViewer` checks `modelUrl` + `modelType`. If `modelType === "glb"`, renders `RealModelViewer` (useGLTF + Suspense) instead of `PlaceholderMesh`. GLB served from `/export-packages/jobs/{job_id}/model.glb` via the existing static mount.
- **Model badge**: Viewer3D shows "REAL MODEL" (emerald) or "MOCK PREVIEW" (amber) badge based on `job.model_downloaded`.
- **Routing**: `App.tsx` tracks `viewerJob: Job | null`. `SculptTypeSelector` calls `onOpenViewer(job)` when a completed job's "Open 3D Preview" button is clicked. App navigates to `viewer3d` page and passes the job.

---

## Job System

**Stack:** FastAPI route, provider abstraction, JSON sidecar files

- Jobs persisted to `storage/jobs/{job_id}.json`.
- Provider interface: `BaseProvider` (abstract) with `submit`, `poll`, `submit_generation`, `poll_generation`, `download_result`, `normalize_result` methods.
- `MockProvider` simulates queued→processing→completed over ~12 seconds. Writes `exports/jobs/{job_id}/result.json` on completion.
- `MeshyProvider` (Phase 14): submits primary upload as base64 data URI to Meshy v2 Image-to-3D API. Polls task status. Downloads GLB to `exports/jobs/{job_id}/model.glb`. Saves `provider_result.json`. Stores `external_job_id` and `progress` in job.
- Provider selection: if `MESHY_API_KEY` is set → `MeshyProvider`, else → `MockProvider`. Provider stored on job so polling always uses the original provider.
- `job_service.create_job()` validates: images uploaded, readiness not `not_ready`, required mode refs present. Credits charged after validation.
- Routes: `POST /api/jobs/generate` (201), `GET /api/jobs/{id}`, `GET /api/jobs`.
- Provider routes: `GET /api/providers/status`, `GET /api/providers/active`.
- Frontend polls `GET /api/jobs/{id}` every 2 seconds while status is `queued` or `processing`.

---

## Provider Registry (Phase 15)

**File:** `backend/app/services/provider_registry.py`

Single source of truth for all provider metadata, state, and priority.

```
PROVIDER_METADATA  — display_name, description, stub, requires_key, capabilities
storage/providers/
  provider_priority.json   — ordered list: ["meshy","tripo","rodin","mock"]
  provider_settings.json   — per-provider {enabled: bool}
  health_cache.json        — last test result per provider
```

Key functions:
- `load_priority()` / `save_priority()` — read/write fallback chain order
- `is_enabled(name)` / `set_enabled(name, enabled)` — toggle providers
- `get_first_available(task)` — walks priority list, returns first usable provider
- `list_all()` — all providers with state, capabilities, priority_order, cached health

## Health Check Layer (Phase 15)

**File:** `backend/app/services/provider_health_service.py`

- `check_health(provider_name)` → `{provider, status, message, latency_ms}`
- Statuses: `healthy` | `degraded` | `offline` | `disabled`
- Mock: always healthy, 0 ms
- Stubs: always offline ("not yet integrated")
- Meshy: live HTTP ping to `/openapi/v2/image-to-3d`, measures latency, maps 200/401/429/timeout
- Result cached to `storage/providers/health_cache.json` for display without re-pinging

## Fallback Chain System (Phase 15)

**File:** `backend/app/services/job_service.py` → `_submit_with_fallback()`

On job creation, walks the priority list:
1. Skip disabled, stub, or key-less providers
2. Try `provider.submit(job)`
3. On success → record `{name}_submitted`, store provider on job, return
4. On failure → record `{name}_failed`, continue to next provider
5. Hard fallback → `mock` always succeeds

`job.provider_attempts` stores the full chain, e.g.:
```
["meshy_failed", "mock_fallback"]    # Meshy had an error, fell back to mock
["meshy_submitted"]                  # Normal Meshy success
["mock_submitted"]                   # No real provider configured
```

## Provider Abstraction Layer

**Stack:** Python abstract base class + provider adapters

```
BaseProvider (ABC)
├── submit(job) → Job              # abstract
├── poll(job) → Job                # abstract
├── submit_generation(job) → Job   # calls submit
├── poll_generation(job) → Job     # calls poll
├── download_result(job) → Job     # override in real providers
└── normalize_result(raw) → dict   # override in real providers

MockProvider  (name="mock")        # time-based simulation
MeshyProvider (name="meshy")       # real HTTP via httpx
TripoProvider (name="tripo")       # stub — NotImplementedError
RodinProvider (name="rodin")       # stub — NotImplementedError
```

Provider selected via `provider_registry.get_first_available("generation")`. Provider name stored on job for correct polling.

## GLB Loader Pipeline

```
Meshy API → task_id → poll → SUCCEEDED
         → model_urls.glb (CDN URL)
         → httpx download → exports/jobs/{id}/model.glb
         → job.glb_path set → job.model_downloaded = True
         → /export-packages/jobs/{id}/model.glb (static serve)
         → Frontend: useGLTF("/export-packages/jobs/{id}/model.glb")
         → RealModelViewer → primitive object={scene}
         → MeshViewer renders real mesh instead of PlaceholderMesh
```

---

## Storage

**Dev:** Local filesystem under `storage/` and `exports/`.
**Prod:** Cloud object storage (S3-compatible — AWS S3 or Cloudflare R2) via a storage abstraction layer.

- Raw uploads stored in `storage/uploads/`.
- Generated meshes in `storage/meshes/`.
- Final exports in `exports/`.

---

## Future AI Providers

The generation layer is provider-agnostic. Planned integrations:

| Provider   | Capability                      |
|------------|---------------------------------|
| Tripo3D    | Image-to-3D mesh generation     |
| Meshy      | Image-to-3D + texturing         |
| Hyper3D    | High-quality mesh generation    |
| Stable Zero3D | Open-source generation      |
| AccuRIG    | Auto-rigging                    |
| Mixamo API | Motion retargeting              |

Provider selection will be configurable per-project in Phase 4.

---

## Deployment (Phase 13)

- Backend: Railway (Python service)
- Frontend: Railway static site or Cloudflare Pages
- Workers: Railway background workers
- Database: Railway PostgreSQL
- Storage: Cloudflare R2
- CI/CD: GitHub Actions
