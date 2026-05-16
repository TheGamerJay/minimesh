from pydantic import BaseModel

from app.models.upload import ImageMeta


class ModeRequirements(BaseModel):
    mode: str
    requirements: list[str]
    met: list[str]
    missing: list[str]


class Readiness(BaseModel):
    score: int
    status: str  # "not_ready" | "basic_ready" | "strong_ready"
    missing: list[str]
    warnings: list[str]
    strengths: list[str]
    generation_mode_requirements: ModeRequirements


class ProjectSession(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str
    images: list[ImageMeta]
    readiness: Readiness


class ProjectSessionResponse(BaseModel):
    success: bool
    session: ProjectSession


class UpdateSessionRequest(BaseModel):
    name: str
