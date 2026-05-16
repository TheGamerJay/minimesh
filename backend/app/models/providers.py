from __future__ import annotations
from pydantic import BaseModel


class ProviderConfig(BaseModel):
    provider_name: str
    enabled: bool = False
    api_key_present: bool = False
    supports_generation: bool = False
    supports_rigging: bool = False
    supports_animation: bool = False
    supports_textures: bool = False
    created_at: str = ""
    updated_at: str = ""


class ProviderJobResult(BaseModel):
    provider: str
    external_job_id: str
    preview_url: str | None = None
    model_url: str | None = None
    thumbnail_url: str | None = None
    raw_response: dict = {}
    completed_at: str | None = None
