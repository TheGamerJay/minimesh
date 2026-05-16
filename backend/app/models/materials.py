from __future__ import annotations
from pydantic import BaseModel

VALID_SHADER_TYPES = {"toon", "pbr", "metallic", "holographic", "matte", "emissive"}

BUILT_IN_PRESETS: list[dict] = [
    {
        "id": "preset-anime-toon",
        "name": "Anime Toon",
        "shader_type": "toon",
        "base_color": "#164e63",
        "secondary_color": "#0891b2",
        "emissive_color": "#06b6d4",
        "metallic": 0.0,
        "roughness": 0.8,
        "emissive_intensity": 0.3,
        "opacity": 1.0,
        "rim_light": True,
        "toon_steps": 4,
        "is_preset": True,
    },
    {
        "id": "preset-black-gold-armor",
        "name": "Black Gold Armor",
        "shader_type": "metallic",
        "base_color": "#111111",
        "secondary_color": "#b45309",
        "emissive_color": "#d97706",
        "metallic": 0.95,
        "roughness": 0.12,
        "emissive_intensity": 0.4,
        "opacity": 1.0,
        "rim_light": True,
        "toon_steps": 3,
        "is_preset": True,
    },
    {
        "id": "preset-holographic-energy",
        "name": "Holographic Energy",
        "shader_type": "holographic",
        "base_color": "#0a0a1a",
        "secondary_color": "#7c3aed",
        "emissive_color": "#06b6d4",
        "metallic": 0.0,
        "roughness": 0.0,
        "emissive_intensity": 1.2,
        "opacity": 0.72,
        "rim_light": True,
        "toon_steps": 3,
        "is_preset": True,
    },
    {
        "id": "preset-matte-clay",
        "name": "Matte Clay",
        "shader_type": "matte",
        "base_color": "#a87c6a",
        "secondary_color": "#c9a882",
        "emissive_color": "#000000",
        "metallic": 0.0,
        "roughness": 0.95,
        "emissive_intensity": 0.0,
        "opacity": 1.0,
        "rim_light": False,
        "toon_steps": 3,
        "is_preset": True,
    },
    {
        "id": "preset-scifi-pbr",
        "name": "Sci-Fi PBR",
        "shader_type": "pbr",
        "base_color": "#1e293b",
        "secondary_color": "#334155",
        "emissive_color": "#7c3aed",
        "metallic": 0.75,
        "roughness": 0.3,
        "emissive_intensity": 0.25,
        "opacity": 1.0,
        "rim_light": True,
        "toon_steps": 3,
        "is_preset": True,
    },
]


class MaterialProfile(BaseModel):
    id: str
    name: str
    shader_type: str = "pbr"
    base_color: str = "#1e293b"
    secondary_color: str = "#334155"
    emissive_color: str = "#06b6d4"
    metallic: float = 0.5
    roughness: float = 0.5
    emissive_intensity: float = 0.2
    opacity: float = 1.0
    rim_light: bool = False
    toon_steps: int = 3
    is_preset: bool = False
    created_at: str = ""
    updated_at: str = ""
