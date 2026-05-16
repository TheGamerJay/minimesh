from pydantic import BaseModel

VALID_MODES: set[str] = {
    "two_d_anime_sheet",
    "three_d_model",
    "clay_sculpt",
    "toy_figurine",
    "game_ready_character",
    "cinematic_high_poly",
    "low_poly_mobile",
    "prop_only",
}

VALID_STYLE_DIRECTIONS: set[str] = {
    "anime",
    "realistic",
    "stylized",
    "clay",
    "toy",
    "game",
    "cinematic",
}

VALID_RIG_INTENTS: set[str] = {
    "none",
    "humanoid",
    "creature",
    "wings",
    "weapon_prop",
    "vehicle_prop",
}

VALID_QUALITY: set[str] = {"draft", "standard", "high"}

VALID_TEXTURE_STYLES: set[str] = {"flat", "painted", "pbr", "toon"}


class GenerationConfig(BaseModel):
    mode: str = "three_d_model"
    style_direction: str = "anime"
    rig_intent: str = "humanoid"
    target_quality: str = "standard"
    texture_style: str = "toon"
    notes: str = ""
    created_at: str = ""
    updated_at: str = ""


class GenerationConfigUpdate(BaseModel):
    mode: str | None = None
    style_direction: str | None = None
    rig_intent: str | None = None
    target_quality: str | None = None
    texture_style: str | None = None
    notes: str | None = None


class GenerationConfigResponse(BaseModel):
    success: bool
    config: GenerationConfig
