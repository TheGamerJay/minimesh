from __future__ import annotations
from pydantic import BaseModel

VALID_MODULE_TYPES = {
    "wings", "shield", "weapon", "tail", "armor", "vehicle_part", "accessory"
}

BUILT_IN_MODULES: list[dict] = [
    {
        "id": "wing-module",
        "name": "Wing Module",
        "module_type": "wings",
        "description": "Articulated wing system for flying characters. Folds for compact transport.",
        "compatible_rig_types": ["winged_humanoid"],
        "required_bones": ["left_wing", "right_wing"],
        "created_at": "2025-01-01T00:00:00+00:00",
    },
    {
        "id": "shield-module",
        "name": "Shield Module",
        "module_type": "shield",
        "description": "Detachable shield attached to the off-hand or spine back socket.",
        "compatible_rig_types": ["humanoid", "winged_humanoid"],
        "required_bones": ["left_arm"],
        "created_at": "2025-01-01T00:00:00+00:00",
    },
    {
        "id": "weapon-module",
        "name": "Weapon Module",
        "module_type": "weapon",
        "description": "One-handed weapon attached to the dominant hand socket.",
        "compatible_rig_types": ["humanoid", "winged_humanoid"],
        "required_bones": ["right_arm"],
        "created_at": "2025-01-01T00:00:00+00:00",
    },
    {
        "id": "tail-module",
        "name": "Tail Module",
        "module_type": "tail",
        "description": "Dynamic tail system for creatures and beast-type characters.",
        "compatible_rig_types": ["creature"],
        "required_bones": ["tail"],
        "created_at": "2025-01-01T00:00:00+00:00",
    },
    {
        "id": "back-armor-module",
        "name": "Back Armor Module",
        "module_type": "armor",
        "description": "Detachable back plate or cape attached to the spine socket.",
        "compatible_rig_types": ["humanoid", "winged_humanoid"],
        "required_bones": ["spine"],
        "created_at": "2025-01-01T00:00:00+00:00",
    },
    {
        "id": "transform-wings-to-shield",
        "name": "Transform: Wings â†’ Shield",
        "module_type": "wings",
        "description": "Detachable wing system capable of folded shield configuration. Wings collapse into protective barrier.",
        "compatible_rig_types": ["winged_humanoid"],
        "required_bones": ["left_wing", "right_wing", "spine_back_socket"],
        "created_at": "2025-01-01T00:00:00+00:00",
    },
]

BUILT_IN_SOCKETS: list[dict] = [
    {
        "id": "socket-spine-back",
        "socket_name": "spine_back_socket",
        "parent_bone": "spine",
        "position": [0.0, 1.0, -0.18],
        "rotation": [0.0, 0.0, 0.0],
        "scale": [1.0, 1.0, 1.0],
        "attachment_type": "armor",
    },
    {
        "id": "socket-left-hand",
        "socket_name": "left_hand_socket",
        "parent_bone": "left_arm",
        "position": [-0.58, 1.05, 0.0],
        "rotation": [0.0, 0.0, 0.0],
        "scale": [1.0, 1.0, 1.0],
        "attachment_type": "weapon",
    },
    {
        "id": "socket-right-hand",
        "socket_name": "right_hand_socket",
        "parent_bone": "right_arm",
        "position": [0.58, 1.05, 0.0],
        "rotation": [0.0, 0.0, 0.0],
        "scale": [1.0, 1.0, 1.0],
        "attachment_type": "weapon",
    },
    {
        "id": "socket-waist",
        "socket_name": "waist_socket",
        "parent_bone": "pelvis",
        "position": [0.0, 0.42, 0.0],
        "rotation": [0.0, 0.0, 0.0],
        "scale": [1.0, 1.0, 1.0],
        "attachment_type": "accessory",
    },
    {
        "id": "socket-head",
        "socket_name": "head_socket",
        "parent_bone": "head",
        "position": [0.0, 1.9, 0.0],
        "rotation": [0.0, 0.0, 0.0],
        "scale": [1.0, 1.0, 1.0],
        "attachment_type": "accessory",
    },
    {
        "id": "socket-left-wing",
        "socket_name": "left_wing_socket",
        "parent_bone": "left_wing",
        "position": [-0.72, 1.12, -0.1],
        "rotation": [0.0, 0.0, 0.0],
        "scale": [1.0, 1.0, 1.0],
        "attachment_type": "wings",
    },
    {
        "id": "socket-right-wing",
        "socket_name": "right_wing_socket",
        "parent_bone": "right_wing",
        "position": [0.72, 1.12, -0.1],
        "rotation": [0.0, 0.0, 0.0],
        "scale": [1.0, 1.0, 1.0],
        "attachment_type": "wings",
    },
]

BUILT_IN_TRANSFORM_STATES: list[dict] = [
    {
        "id": "transform-flight",
        "name": "Flight Mode",
        "description": "Wings fully extended for aerial movement.",
        "active_modules": ["wing-module", "transform-wings-to-shield"],
        "transform_behavior": "wings_extended",
    },
    {
        "id": "transform-defense",
        "name": "Defense Mode",
        "description": "Wings folded inward forming a protective shield barrier.",
        "active_modules": ["transform-wings-to-shield", "shield-module"],
        "transform_behavior": "wings_shield",
    },
    {
        "id": "transform-combat",
        "name": "Combat Mode",
        "description": "Weapon deployed in dominant hand, shield active on off-hand.",
        "active_modules": ["weapon-module", "shield-module"],
        "transform_behavior": "combat_stance",
    },
    {
        "id": "transform-idle",
        "name": "Idle Mode",
        "description": "All modules retracted to compact form. Minimal footprint.",
        "active_modules": [],
        "transform_behavior": "compact",
    },
]


class RigModule(BaseModel):
    id: str
    name: str
    module_type: str
    description: str
    compatible_rig_types: list[str]
    required_bones: list[str]
    created_at: str


class AttachmentSocket(BaseModel):
    id: str
    socket_name: str
    parent_bone: str
    position: list[float]
    rotation: list[float]
    scale: list[float]
    attachment_type: str


class TransformState(BaseModel):
    id: str
    name: str
    description: str
    active_modules: list[str]
    transform_behavior: str
