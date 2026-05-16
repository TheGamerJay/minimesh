from __future__ import annotations
from pydantic import BaseModel

VALID_RIG_TYPES = {"humanoid", "creature", "winged_humanoid", "prop", "vehicle"}

BUILT_IN_PROFILES: list[dict] = [
    {
        "id": "humanoid-basic",
        "name": "Humanoid â€” Basic",
        "rig_type": "humanoid",
        "description": "Standard biped rig: head, spine, arms, legs. Suitable for characters and NPCs.",
        "expected_bones": ["head", "neck", "spine", "pelvis", "left_arm", "right_arm", "left_leg", "right_leg"],
        "supports_animation": True,
    },
    {
        "id": "creature-basic",
        "name": "Creature â€” Basic",
        "rig_type": "creature",
        "description": "Four-legged creature rig: head, spine, front/rear legs, tail.",
        "expected_bones": ["head", "spine", "front_left_leg", "front_right_leg", "rear_left_leg", "rear_right_leg", "tail"],
        "supports_animation": True,
    },
    {
        "id": "winged-humanoid",
        "name": "Winged Humanoid",
        "rig_type": "winged_humanoid",
        "description": "Biped rig with additional wing bones for angels, faeries, and winged characters.",
        "expected_bones": ["head", "neck", "spine", "pelvis", "left_arm", "right_arm", "left_leg", "right_leg", "left_wing", "right_wing"],
        "supports_animation": True,
    },
    {
        "id": "prop-rig",
        "name": "Prop â€” Root Only",
        "rig_type": "prop",
        "description": "Single root bone for props and static objects. No animation support.",
        "expected_bones": ["root"],
        "supports_animation": False,
    },
    {
        "id": "vehicle-rig",
        "name": "Vehicle â€” Basic",
        "rig_type": "vehicle",
        "description": "Root + four wheel bones for ground vehicles.",
        "expected_bones": ["root", "wheel_front_left", "wheel_front_right", "wheel_back_left", "wheel_back_right"],
        "supports_animation": True,
    },
]


class RigProfile(BaseModel):
    id: str
    name: str
    rig_type: str
    description: str
    expected_bones: list[str]
    supports_animation: bool


class RigJob(BaseModel):
    id: str
    source_job_id: str
    status: str  # queued | processing | completed | failed
    rig_type: str
    provider: str
    skeleton_data: dict | None = None
    outputs: list[str] = []
    message: str = ""
    error: str | None = None
    created_at: str
    updated_at: str
