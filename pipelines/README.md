# Pipelines

Discrete pipeline stage definitions for MiniMesh's AI generation workflow.

## Pipeline Stages

Each stage is an independent Python module with a consistent interface:

| Stage       | Input                    | Output                     |
|-------------|--------------------------|----------------------------|
| `upload`    | Raw reference images     | Validated, stored uploads  |
| `sort`      | Uploaded images          | Categorized view set       |
| `generate`  | Reference set + style    | Raw 3D mesh                |
| `texture`   | Raw mesh                 | Textured mesh (PBR)        |
| `rig`       | Textured mesh            | Rigged mesh + skeleton     |
| `animate`   | Rigged mesh + motion     | Animated sequence          |
| `export`    | Final mesh               | FBX / GLTF / OBJ package  |

## Provider Abstraction

Each AI-backed stage wraps providers behind a common interface so backends can be swapped without changing upstream pipeline logic.

```python
class GenerationProvider(Protocol):
    async def submit(self, references: list[str], style: str) -> str: ...
    async def poll(self, job_id: str) -> JobStatus: ...
    async def fetch(self, job_id: str) -> MeshResult: ...
```

## Status

> Phase 4+ — pipelines are not implemented in Phase 0.

Pipeline modules will be scaffolded when AI provider integration begins in Phase 4.
