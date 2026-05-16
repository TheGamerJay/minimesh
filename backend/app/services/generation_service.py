import json
from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.generation import (
    VALID_MODES,
    VALID_RIG_INTENTS,
    VALID_STYLE_DIRECTIONS,
    VALID_QUALITY,
    VALID_TEXTURE_STYLES,
    GenerationConfig,
    GenerationConfigUpdate,
)
from app.services.project_context import get_generation_config_path


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_or_create_config() -> GenerationConfig:
    config_file = get_generation_config_path()
    if config_file.exists():
        try:
            data = json.loads(config_file.read_text(encoding="utf-8"))
            return GenerationConfig(**data)
        except Exception:
            pass

    now = _now()
    config = GenerationConfig(created_at=now, updated_at=now)
    _persist(config)
    return config


def update_config(update: GenerationConfigUpdate) -> GenerationConfig:
    config = get_or_create_config()

    if update.mode is not None:
        if update.mode not in VALID_MODES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid mode '{update.mode}'. Allowed: {', '.join(sorted(VALID_MODES))}",
            )
        config.mode = update.mode

    if update.style_direction is not None:
        if update.style_direction not in VALID_STYLE_DIRECTIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid style_direction '{update.style_direction}'.",
            )
        config.style_direction = update.style_direction

    if update.rig_intent is not None:
        if update.rig_intent not in VALID_RIG_INTENTS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid rig_intent '{update.rig_intent}'.",
            )
        config.rig_intent = update.rig_intent

    if update.target_quality is not None:
        if update.target_quality not in VALID_QUALITY:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid target_quality '{update.target_quality}'.",
            )
        config.target_quality = update.target_quality

    if update.texture_style is not None:
        if update.texture_style not in VALID_TEXTURE_STYLES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid texture_style '{update.texture_style}'.",
            )
        config.texture_style = update.texture_style

    if update.notes is not None:
        config.notes = update.notes

    config.updated_at = _now()
    _persist(config)
    return config


def _persist(config: GenerationConfig) -> None:
    config_file = get_generation_config_path()
    config_file.parent.mkdir(parents=True, exist_ok=True)
    config_file.write_text(
        json.dumps(config.model_dump(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
