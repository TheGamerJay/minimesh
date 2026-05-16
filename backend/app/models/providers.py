from __future__ import annotations
from pydantic import BaseModel


class ProviderCapabilities(BaseModel):
    generation: bool = False
    rigging: bool = False
    animation: bool = False
    textures: bool = False


class ProviderDetail(BaseModel):
    name: str
    display_name: str
    description: str
    stub: bool = False
    enabled: bool = True
    api_key_present: bool = False
    capabilities: ProviderCapabilities = ProviderCapabilities()
    priority_order: int = 99
    health_status: str = "unknown"
    health_message: str = ""


class ProviderTestResult(BaseModel):
    provider: str
    status: str
    message: str
    latency_ms: int | None = None


# Legacy — kept for backwards compat with existing code paths
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
