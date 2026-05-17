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

## Model Normalization Layer (Phase 17)

**File:** `frontend/src/components/viewer/RealModelViewer.tsx`

After GLB loads via `useGLTF`, a `useEffect` runs once per URL:
1. `new THREE.Box3().setFromObject(group)` — computes world-space bounds
2. `maxDim = max(size.x, size.y, size.z)` → `scale = 2.0 / maxDim`
3. `group.scale.setScalar(scale)` + `group.position = -center * scale`

Result: model always fits in a 2-unit cube centered at origin. `onNormalized` callback fires after normalization. `onStats` callback returns `{ meshCount, materialCount, triangleEstimate, boundingBoxSize }` gathered by traversing the scene graph.

GLB error boundary (`GLBErrorBoundary`) wraps the Suspense. On any load error, `onError` fires and parent falls back to `PlaceholderMesh`.

## Camera Preset System (Phase 17)

**File:** `frontend/src/components/viewer/MeshViewer.tsx` → `CameraController`

Six named presets defined in `lib/viewerEnvironments.ts`: Front, Back, Left, Right, Top, Iso.

`CameraController` is a scene component that runs a `useFrame` lerp:
```
camera.position.lerp(targetPos, 0.1)
controls.target.lerp(targetLook, 0.1)
controls.update()
```
Transition completes when distance < 0.02 units. Preset clears via `onCameraPresetDone` so re-clicking the same preset works.

## Environment Presets (Phase 17)

**File:** `frontend/src/lib/viewerEnvironments.ts`

Five presets (Studio Dark / Neon Cyan / Purple Void / Sunset / HDR Neutral) each define: background hex color, ambient light (color + intensity), and a list of directional/point lights. `EnvironmentLights` component renders the preset dynamically. `exposure` prop scales all intensities. No HDR files required — all simulated with standard Three.js lights.

Screenshot: `gl.domElement.toDataURL("image/png")` via `useThree`, requires `preserveDrawingBuffer: true` on Canvas. Download triggered by injecting a temporary `<a>` element.

---

## Asset Registry (Phase 16)

**Files:** `backend/app/models/assets.py`, `backend/app/services/asset_service.py`, `backend/app/routes/assets.py`

```
GeneratedAsset
  id, project_id, source_job_id, provider, asset_type
  file_path, name, preview_image, thumbnail
  polygon_count (None — real extraction future), file_size (bytes)
  created_at, updated_at, version, tags, versions[]

AssetVersion
  version, file_path, created_at, provider
```

Storage: `storage/projects/{id}/assets/registry.json` (ordered list, newest first).

Auto-registration: `job_service._maybe_register_asset(job)` runs after every poll. If `job.status == "completed" and job.model_downloaded and not job.asset_id`, calls `asset_service.auto_register_from_job(job)` and writes `asset_id` back to the job JSON. Duplicate guard: checks registry for matching `source_job_id` before inserting.

Routes: `GET /api/assets`, `GET /api/assets/{id}`, `DELETE`, `POST /{id}/duplicate`, `PATCH /{id}/rename`, `PATCH /{id}/tags`.

Frontend: `GeneratedAssets` page — searchable/filterable grid, AssetCard with preview image, AssetInspector (inline rename, tag CRUD, metadata), AssetVersionPanel, download link for real GLBs, "Open in Viewer" loads source job.

---

## Worker Layer (Phase 21)

**Files:** `backend/app/models/workers.py`, `backend/app/services/worker_service.py`, `backend/app/routes/workers.py`

```
WorkerTask
  id, task_type (glb_inspect|mesh_normalize|uv_check|mock_bake|mock_edit|export_prepare)
  provider ("local"), asset_id, status (queued|running|completed|failed)
  input_files[], output_files[], logs, created_at, updated_at

WorkerHealth
  worker_online, blender_available, blender_version, blender_path, blender_mode
  queue_size, active_tasks, last_check
```

Storage: `storage/workers/tasks/{id}.json`.

Task execution: daemon thread calls `_process_task()`, which acquires `_queue_lock` to serialize sequential execution. Safe subprocess with `capture_output=True`, `shell=False`, `timeout=20`. Mock commands use `sys.executable` (Python itself) — always available, no external dependencies required.

## Blender Bridge (Phase 21)

**File:** `backend/app/services/blender_bridge.py`

Blender detection order:
1. `BLENDER_PATH` environment variable (from `backend/.env`)
2. `shutil.which("blender")` (PATH lookup)
3. 9 hardcoded common install paths (Windows / macOS / Linux)

Version check: `subprocess.run([blender_path, "--version"], capture_output=True, text=True, timeout=10, shell=False)`. Result cached with 60-second TTL — `invalidate_cache()` available for forced refresh.

To configure Blender: add `BLENDER_PATH=C:/Program Files/Blender Foundation/Blender 4.2/blender.exe` to `backend/.env`.

## Queue Execution System (Phase 21)

**File:** `backend/app/services/worker_service.py`

```
create_task()
  → save task JSON (status=queued)
  → threading.Thread(target=_process_task, daemon=True).start()
  → return task immediately (non-blocking HTTP response)

_process_task()  [background thread]
  → blender_bridge.detect()   (cached — fast)
  → acquire _queue_lock        (serializes execution)
  → task.status = "running"
  → _run_subprocess(cmd)       (safe: no shell=True, timeout, captured output)
  → task.status = completed/failed
  → write logs + save JSON
```

Subprocess safety guarantees:
- `shell=False` on every call (no injection vector)
- Args passed as `list[str]` (no string interpolation of user data)
- `timeout` enforced (20s default, 10s for Blender version check)
- Handles `TimeoutExpired`, `FileNotFoundError`, `PermissionError`

`glb_inspect` tasks with `asset_id` now bypass the mock command and call `inspection_service.run_inspection()` directly inside `_process_task`. Logs capture Blender-used flag, fallback flag, and extracted counts.

---

## Normalize Pipeline (Phase 23)

**Files:** `backend/app/models/normalize.py`, `backend/app/services/normalize_service.py`, `backend/app/routes/normalize.py`, `workers/blender_normalize.py`

### NormalizeJob Data Model

```
NormalizeJob
  id, asset_id, source_version, output_version
  status (queued | processing | completed | failed)
  provider ("blender-normalize" | "normalize-fallback")
  normalization_scale (float)
  original_bounds: { width, height, depth, max_dim }
  normalized_bounds: { width, height, depth }
  message, fallback_normalized (bool)
  created_at, updated_at
```

Storage: `storage/normalize/{job_id}.json`. Output GLB: `exports/normalized/{job_id}/normalized.glb`. Report: `exports/normalized/{job_id}/normalize_report.json`.

### Blender Normalize Script

`workers/blender_normalize.py` is invoked as:
```
blender --background --python workers/blender_normalize.py -- <glb_path> <output_glb> <report_json>
```

Script enforces `glb_path != output_glb` (never overwrites source). Inside:
1. `bpy.ops.wm.read_factory_settings(use_empty=True)` + `import_scene.gltf`
2. Computes world-space bounding box across all `MESH` type objects
3. `center = (min_v + max_v) / 2`, `scale = 2.0 / max_dim`
4. All root objects (parent=None): `location = (location - center) * scale`, `scale *= scale_factor`
5. `transform_apply(location, rotation, scale)` on mesh objects only (safe — skips armatures)
6. Exports with `export_scene.gltf(format=GLB)` to output path
7. Writes `normalize_report.json` with `normalization_scale`, `original_bounds`, `normalized_bounds`

### Versioned Asset Workflow

Normalized outputs become new `AssetVersion` entries via `asset_service.register_new_version()`:

```
v1 = original Meshy/mock output   (provider: "mock" | "meshy")
v2 = normalized Blender output    (provider: "blender-normalize")
v3 = re-normalize or next edit    (provider: ...)
```

The `versions[]` list on `GeneratedAsset` stores all prior versions. Normalization never modifies the original file — the output is always a new path under `exports/normalized/`.

### Fallback Normalization

When Blender is unavailable or the source GLB doesn't exist on disk:
- `shutil.copy2(source, output)` creates a byte-identical copy
- `provider = "normalize-fallback"`, `fallback_normalized = True`
- Still registers as a new asset version — original preserved

### Blender Bridge Extension

`run_glb_normalize(glb_path, output_glb, report_json, script_path, timeout=120)` → `(bool, stdout, stderr)`:
- Same safety guarantees as `run_glb_inspection` (`shell=False`, explicit timeout, error type handling)

### Routes

```
POST /api/normalize/run/{asset_id}    → NormalizeJob (201, starts background thread)
GET  /api/normalize/{job_id}          → NormalizeJob
GET  /api/normalize?asset_id=...      → list[NormalizeJob]
```

### Frontend Normalize UI

**NormalizePanel** (`frontend/src/components/assets/NormalizePanel.tsx`):
- Disclaimer banner: "Normalization creates a non-destructive versioned copy. Original assets are preserved."
- Current bounds from `GLBInspectionReport` (if available)
- Target info: 2-unit bounding cube, world origin, Blender transform+apply method
- "Normalize Asset" / "Re-normalize" button

**NormalizeJobPanel** (`frontend/src/components/assets/NormalizeJobPanel.tsx`):
- Status badge with `animate-pulse` for queued/processing
- BLENDER (violet) or FALLBACK COPY (amber) badge on complete
- Original → Normalized bounds comparison; scale factor display
- "Open Normalized in Viewer" button → `normalizedGlbUrl(job)` → passed to viewer
- 2s polling until terminal status; auto-clears interval

**Version Switching in Viewer:**
- `Viewer3D` accepts `overrideGlbUrl?: string | null` and `versionLabel?: string | null`
- When `overrideGlbUrl` is set: uses it as the GLB URL, bypasses `isMock` check, shows `versionLabel` as an extra header badge
- `App.tsx`: `viewerOverrideGlbUrl` + `viewerVersionLabel` state; `handleOpenNormalized(url, label)` sets both and navigates to viewer; `handleOpenViewer` clears them

**AssetVersionPanel upgrades:**
- ORIGINAL badge (gray) for non-normalize providers
- NORMALIZED badge (cyan) for `blender-normalize`
- FALLBACK badge (amber) for `normalize-fallback`
- "Open in Viewer" button for normalized versions

---

## Export Package Builder (Phase 25)

**Files:** `backend/app/models/export_v2.py`, `backend/app/services/export_package_service.py`, `backend/app/routes/export_v2.py`

### Export V2 Data Model

```
AssetExportPackage
  id, asset_id, asset_name
  export_type (glb_package | game_ready | texture_bundle | inspection_bundle | full_project_bundle)
  version_exported (int), version_label ("latest" | "original" | "normalized")
  included_files[]           — list of paths inside the ZIP
  manifest_path, zip_path    — relative paths from PROJECT_ROOT
  zip_size (bytes)
  normalized, has_textures, has_inspection, has_thumbnail (booleans)
  created_at

ExportManifest (inside ZIP as manifest.json)
  minimesh_version: "2"
  asset_id, asset_name, version, version_label
  provider, normalized, export_type
  textures: [{name, type}]
  has_inspection, inspection_summary (mesh_count/triangles/materials/has_uvs)
  thumbnail (path inside ZIP or null)
  file_count, exported_at
```

Storage: `storage/export_packages_v2/{id}.json`. ZIP output: `exports/packages_v2/{id}/{name}_{version_label}.zip`.

### Export Type Flags

| Type | model | textures | inspection | thumbnail |
|------|-------|----------|------------|-----------|
| `glb_package` | ✓ | | | ✓ |
| `game_ready` | ✓ | ✓ | | ✓ |
| `texture_bundle` | | ✓ | | |
| `inspection_bundle` | ✓ | | ✓ | |
| `full_project_bundle` | ✓ | ✓ | ✓ | ✓ |

### Version Export Selection

`_resolve_glb(asset, version_label)` → `(disk_path, version_number, is_normalized)`:
- `"latest"`: `asset.file_path` (current version)
- `"original"`: `asset.versions[0].file_path` (lowest-version in history) or `asset.file_path` if no versions
- `"normalized"`: current if `"normalize" in asset.provider`, else searches `asset.versions[]` for normalize provider

### Bundle Manifest System

Manifest written both into the ZIP as `manifest.json` and to disk at `exports/packages_v2/{id}/manifest.json` for direct inspection. Contains all package metadata, texture list, inspection summary if included, and a `file_count` of all bundled artifacts.

### Texture Inclusion

Pulls from `texture_service.list_textures(project_id)` — all textures in the active project are included when the export type includes textures. Each texture is written to `textures/{type}_{filename}` inside the ZIP.

### Thumbnail Resolution

`asset.thumbnail` URL is `/export-packages/thumbnails/...` which maps to `exports/thumbnails/...` on disk. The path is resolved by stripping the URL prefix and joining with `PROJECT_ROOT / "exports"`.

### Routes

```
POST /api/export-v2/create            body: {asset_id, export_type, version_label} → AssetExportPackage (201)
GET  /api/export-v2/{id}/download     → FileResponse (ZIP, Content-Disposition: attachment)
GET  /api/export-v2/{id}              → AssetExportPackage
GET  /api/export-v2?asset_id=...      → list[AssetExportPackage]
```

### Frontend Export UI

**ExportManager page** (`frontend/src/pages/ExportManager.tsx`):
- Left column (w-80): asset selector dropdown + `ExportPackageBuilder`
- Right: package history list + `ExportInspector` side panel
- Navigation: App.tsx tracks `exportManagerAssetId`; `GeneratedAssets` "Export V2" button opens ExportManager preloaded with the selected asset

**ExportPackageBuilder** (`frontend/src/components/export/ExportPackageBuilder.tsx`):
- Asset display card (name, version, type, provider)
- Export type selector (5 types with descriptions)
- Version selector (latest/original/normalized with descriptions)
- "Will include" summary badges (derived from selected type)
- Build Package button with spinner

**ExportPackageCard** (`frontend/src/components/export/ExportPackageCard.tsx`):
- Type badge, asset name, version + size info
- NORMALIZED / TEXTURES / INSPECTION / THUMBNAIL badges from package booleans
- Download ZIP button (anchor with `download` attribute to `/api/export-v2/{id}/download`)

**ExportInspector** (`frontend/src/components/export/ExportInspector.tsx`):
- Full package detail view: type badge, badges row, included files list (font-mono), meta table
- Download ZIP primary action button

---

## Asset QA Layer (Phase 26)

**Files:** `backend/app/models/asset_qa.py`, `backend/app/services/asset_qa_service.py`, `backend/app/routes/asset_qa.py`

### Asset Health System

```
AssetQAReport
  asset_id, generated_at
  score: int (0–100)          # 100 = perfect, deductions per issue
  status: str                  # healthy (≥85) | needs_work (≥60) | problematic (<60)
  issues: list[AssetQAIssue]
  strengths: list[str]
  recommendations: list[str]   # deduplicated across all issue categories

AssetQAIssue
  id, severity (critical | warning | info)
  category, title, description, suggestion, detected_at
```

### Repair Suggestion Engine

`run_qa(asset_id)` inspects asset state and applies score deductions:

| Check | Deduction |
|-------|-----------|
| No inspection report | -8 |
| Missing UVs | -15 |
| No materials | -10 |
| Not normalized | -12 |
| Bounding box >10 or <0.01 units | -8 |
| No project textures | -10 |
| No thumbnail | -10 |
| No export packages | -5 |
| Triangle count >500k | -6 |
| Triangle count <100 (non-fallback) | -6 |

Each deduction adds an `AssetQAIssue` with a human-readable `suggestion`. Recommendations are collected from issues and deduplicated via a `seen: set[str]`. Reports stored at `storage/asset_qa/{asset_id}.json`.

### Auto-QA Trigger

`normalize_service._execute_normalize()` calls `asset_qa_service.run_qa()` after successful normalization using a deferred import to avoid circular imports:

```python
try:
    from app.services import asset_qa_service
    asset_qa_service.run_qa(job.asset_id)
except Exception:
    pass
```

`update_qa_metadata()` in `asset_service` syncs score/status/timestamp back to the asset registry JSON so AssetCard and Viewer3D reflect current health state without a separate QA fetch.

### Routes

```
POST /api/asset-qa/run/{asset_id}   → AssetQAReport (201)
GET  /api/asset-qa/{asset_id}       → AssetQAReport | 404
```

### Frontend QA UI

`AssetHealthBadge` — compact colored badge (emerald/amber/red) with score number, sizes `xs` and `sm`.

`AssetQAPanel` — full panel with:
- `ScoreRing` SVG component: circular arc proportional to score, colored by status
- `IssueRow` expandable cards: severity chip + title + description + suggestion
- Run / Re-run button with spinner
- Strengths list and recommendations list

`AssetQAOverview` in `QualityDashboard` — loads all assets and their QA reports, renders rows sorted by severity (problematic first), shows consolidated repair recommendations (deduped, max 8).

---

## Inspection Pipeline (Phase 22)

**Files:** `backend/app/models/inspection.py`, `backend/app/services/inspection_service.py`, `backend/app/routes/inspections.py`, `workers/blender_inspect.py`

### GLB Inspection Data Model

```
GLBInspectionReport
  asset_id, generated_at
  object_count, mesh_count, material_count, estimated_triangles
  bounding_box: { width, height, depth }   # world-space meters
  object_names[], material_names[]
  has_armature, has_animations, has_uvs
  file_size (bytes)
  fallback_estimate (bool)  # true when Blender unavailable
  blender_used (bool), blender_version, blender_logs
```

Storage: `storage/inspections/{asset_id}.json` (final report); `storage/inspections/{asset_id}_raw.json` (raw Blender JSON output).

### Blender Headless Script

`workers/blender_inspect.py` is invoked as:
```
blender --background --python workers/blender_inspect.py -- <glb_path> <output_json>
```

Inside Blender's Python environment (`bpy`):
1. `bpy.ops.wm.read_factory_settings(use_empty=True)` — clears scene
2. `bpy.ops.import_scene.gltf(filepath=glb_path)` — imports GLB
3. Iterates `bpy.context.scene.objects` — counts mesh/armature objects
4. For each mesh: iterates `polygon.vertices` to count triangles (`n-2` per polygon), checks `mesh.uv_layers`, collects `obj.material_slots`
5. Checks `bpy.data.actions` for animations
6. Computes world-space bounding box: `obj.matrix_world @ Vector(corner)` for each `obj.bound_box` corner across all mesh objects
7. Writes JSON result to `output_json`

### Inspection Service

`run_inspection(asset_id)`:
1. Fetches asset from registry → validates GLB path exists
2. If Blender found AND GLB exists → runs `_run_blender_inspection()` (calls `blender_bridge.run_glb_inspection()`)
3. Else → `_fallback_inspection()` returns: `{mesh_count:1, material_count:1, estimated_triangles:1400, has_uvs:true, fallback_estimate:true}`
4. Saves final report to `storage/inspections/{asset_id}.json`
5. Calls `asset_service.update_inspection_metadata()` to sync `polygon_count`, `material_count`, `has_uvs` into the asset registry

### Blender Bridge Extension

`run_glb_inspection(glb_path, output_json, script_path, timeout=60)` → `(bool, stdout, stderr)`:
- Constructs `[blender_exe, "--background", "--python", script_path, "--", glb_path, output_json]`
- `shell=False`, `capture_output=True`, explicit timeout
- Returns `(False, "", error_msg)` on timeout/FileNotFoundError/PermissionError

### Asset Metadata Sync

`GeneratedAsset` extended with `material_count: int | None` and `has_uvs: bool | None`. After every successful inspection (real or fallback), `update_inspection_metadata()` patches these fields in the asset registry JSON, enabling the asset card grid to surface real metadata without a separate inspection fetch.

### Routes

```
POST /api/inspections/run/{asset_id}   → GLBInspectionReport  (runs inspection synchronously)
GET  /api/inspections/{asset_id}       → GLBInspectionReport  (404 if no prior inspection)
```

### Frontend Inspection UI

`InspectionPanel` component (`frontend/src/components/assets/InspectionPanel.tsx`):
- **REAL** badge (violet) when `blender_used=true`, **FALLBACK ESTIMATE** badge (amber) otherwise
- Stats grid: Objects / Meshes / Triangles / Materials / File Size
- Feature flags: UVs / Armature / Animations with emerald/gray badges
- Bounding box W/H/D display
- Scrollable object names list (max-h-24) and material names list (max-h-20)
- "Run Inspection" or "Re-inspect" button calls `runInspection()` + `onRefresh()` callback

`GeneratedAssets` additions:
- "Inspect" tab added to inspector tab bar (alongside Info / Versions)
- `inspectionReports` state: `Record<string, GLBInspectionReport>` keyed by asset_id
- On asset select → auto-fetches cached report via `getInspection()` (silent on 404)
- "Run Inspection" / "View Inspection" shortcut button in inspector actions panel

---

## Edit Operation Layer (Phase 20)

**Files:** `backend/app/models/editing.py`, `backend/app/services/edit_service.py`, `backend/app/routes/edits.py`

```
EditOperation
  id, asset_id, operation_type (sculpt|smooth|inflate|pinch|move|transform|mirror)
  brush_type, strength (0–1), radius (1–100), position[]
  status (queued|processing|completed|failed)
  provider ("mock"), message, created_at, updated_at

EditHistoryEntry
  id, operation_id, asset_id, operation_name, created_at
```

Storage: `storage/edits/{id}.json` per operation; `storage/edits/history.json` (ordered list, newest first).

MockEditProvider timing: 0–1 s queued, 1–4 s processing (progress %), ≥4 s completed. Writes `exports/edits/{id}/edit_result.json`. Same timestamp-based state machine as bake/rig/animation providers.

Routes: `POST /api/edits/create` (201), `GET /api/edits` (optional `?asset_id=`), `GET /api/edits/{id}`.

## Sculpt Workspace (Phase 20)

**Files:** `frontend/src/pages/SculptStudio.tsx`, `frontend/src/components/editing/`

Layout: left tool+brush panel (w-44) | center MeshViewer | right EditOperationPanel (w-56) | bottom EditHistoryPanel (h-28).

- `SculptToolbar`: 6 tool buttons (Clay / Smooth / Inflate / Pinch / Move / Mirror) with active highlight. Visual selection only — tool choice maps to `operation_type` on create.
- `BrushSettingsPanel`: radius slider (1–100), strength slider (0–1.0), symmetry toggle (ON/OFF), pressure placeholder (disabled), falloff selector (sphere/gaussian/flat). State lives in SculptStudio only.
- `GizmoOverlay`: R3F scene component rendering X/Y/Z colored axis lines with cone arrowheads (move), torus rings per axis (rotate), midpoint cubes (scale), origin sphere. Rendered inside `SceneContents` when `editMode` prop is true. Visual only — no real transform logic.
- `EditOperationPanel`: "Apply Edit Preview" button triggers `createEditOperation()` + 2s polling. Shows current tool/brush settings and last operation status (queued/processing/completed/failed).
- `EditHistoryPanel`: horizontal scrollable strip of operation cards. Each shows operation_type, brush_type, status (color-coded), strength/radius, timestamp. Disabled Undo/Redo buttons as future-phase placeholders.

## Future Worker Integration (Phase 20 Prep)

The edit service is structured for future Blender/local-worker integration:
- Each `EditOperation` carries `asset_id` for mesh file lookup
- `provider` field is extensible (mock → blender_local → cloud_sculpt)
- `exports/edits/{id}/` output directory ready for real GLB outputs per operation
- `history.json` ordered stack prepares for undo/redo layer management
- `position[]` field reserved for future brush stroke coordinates

---

## UV Analysis Layer (Phase 19)

**Files:** `backend/app/services/uv_service.py`, `backend/app/models/baking.py`

`analyze_uv(asset_id)` checks if the asset's GLB file exists on disk:
- Real GLB present → `{ has_uvs: true, uv_channel_count: 1, overlapping_uvs: false, estimated_uv_coverage: 82, warnings: [] }`
- Mock/missing → `{ coverage: 65, warnings: ["UV layout not verified — real GLB not present."] }`

`validate_textures(assigned_textures, available_ids)`:
- Critical slots: albedo, normal, roughness → warnings if missing (blocks bake readiness)
- Optional slots: metallic, ao, emissive → suggestions if missing
- Detects stale texture IDs (deleted textures still assigned) and duplicate slot assignments
- Returns `{ warnings, suggestions, ready: bool }`

Frontend: `UVInspectorPanel` (coverage bar colored emerald≥75/amber≥50/red<50), `TextureValidationPanel` (Bake Ready / Issues Found badge with grouped warnings + suggestions). Both panels render inside TextureStudio's collapsible UV & Bake bottom section.

---

## Bake Queue System (Phase 19)

**Files:** `backend/app/services/bake_service.py`, `backend/app/services/providers/mock_bake_provider.py`, `backend/app/routes/bakes.py`

```
BakeJob
  id, asset_id, status (queued|processing|completed|failed)
  bake_type (full_pbr|albedo|normal|roughness|ao|emissive)
  provider ("mock"), output_maps[], progress (0-100)
  message, error, created_at, updated_at

MockBakeProvider
  0–2 s   → queued
  2–6 s   → processing (progress = (elapsed-2)/4 * 100)
  ≥6 s    → completed (writes exports/bakes/{id}/bake_result.json)
```

Jobs stored at `storage/bakes/{id}.json`. On every `get_bake_job()` call, if status is non-terminal the mock provider is re-evaluated with current elapsed time. No background thread needed — pure timestamp-based state machine.

Routes: `GET /api/bakes/uv/{asset_id}`, `POST /api/bakes/validate`, `POST /api/bakes/create` (201), `GET /api/bakes` (optional `?asset_id=`), `GET /api/bakes/{id}`.

Frontend: `BakeJobPanel` polls active job every 2 s via `setInterval`, shows progress bar during processing, output_maps tag badges on completion. "Bake Preview" button disabled while poll is active or no asset is selected.

---

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
