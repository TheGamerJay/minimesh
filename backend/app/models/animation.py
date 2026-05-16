from __future__ import annotations
from pydantic import BaseModel

VALID_CLIP_TYPES = {"idle", "walk", "run", "jump", "attack", "fly", "turntable"}

BUILT_IN_CLIPS: list[dict] = [
    {
        "id": "idle-pulse",
        "name": "Idle Pulse",
        "clip_type": "idle",
        "duration_seconds": 3.0,
        "compatible_rig_types": ["humanoid", "creature", "winged_humanoid"],
        "description": "Subtle breathing and weight shift. Works with any living character.",
    },
    {
        "id": "walk-cycle",
        "name": "Walk Cycle",
        "clip_type": "walk",
        "duration_seconds": 1.2,
        "compatible_rig_types": ["humanoid", "creature"],
        "description": "Standard looping walk cycle with arm swing.",
    },
    {
        "id": "run-cycle",
        "name": "Run Cycle",
        "clip_type": "run",
        "duration_seconds": 0.7,
        "compatible_rig_types": ["humanoid", "creature"],
        "description": "Fast looping run with exaggerated arm motion.",
    },
    {
        "id": "hero-landing",
        "name": "Hero Landing",
        "clip_type": "jump",
        "duration_seconds": 1.8,
        "compatible_rig_types": ["humanoid", "winged_humanoid"],
        "description": "Drop from height and land with a knee bend. Classic hero pose.",
    },
    {
        "id": "weapon-slash",
        "name": "Weapon Slash",
        "clip_type": "attack",
        "duration_seconds": 0.9,
        "compatible_rig_types": ["humanoid", "prop"],
        "description": "Right arm overhead slash with follow-through.",
    },
    {
        "id": "wing-hover",
        "name": "Wing Hover",
        "clip_type": "fly",
        "duration_seconds": 2.0,
        "compatible_rig_types": ["winged_humanoid"],
        "description": "Wings flap with a slow vertical drift. For floating characters.",
    },
    {
        "id": "turntable-preview",
        "name": "Turntable Preview",
        "clip_type": "turntable",
        "duration_seconds": 5.0,
        "compatible_rig_types": ["humanoid", "creature", "winged_humanoid", "prop", "vehicle"],
        "description": "Full 360Â° rotation for asset review. Compatible with all rig types.",
    },
]


class AnimationClip(BaseModel):
    id: str
    name: str
    clip_type: str
    duration_seconds: float
    compatible_rig_types: list[str]
    description: str


class AnimationJob(BaseModel):
    id: str
    source_rig_job_id: str
    status: str  # queued | processing | completed | failed
    clip_id: str
    provider: str
    output_files: list[str] = []
    message: str = ""
    error: str | None = None
    created_at: str
    updated_at: str
