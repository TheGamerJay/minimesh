# Workers

Background job processors for MiniMesh's long-running pipeline tasks.

## Purpose

Workers handle asynchronous tasks that are too slow to run synchronously inside an HTTP request:

- Polling AI providers for mesh generation job completion
- Post-processing generated meshes (UV unwrap, polygon reduction)
- Auto-rigging pipeline execution
- Texture baking and material export
- Packaging final export artifacts

## Planned Stack

- **Celery** — task queue
- **Redis** — message broker
- **Python 3.11+** — worker runtime

## Status

> Phase 4+ — workers are not implemented in Phase 0.

Workers will be added when AI provider integration begins in Phase 4.
