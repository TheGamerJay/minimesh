from fastapi import APIRouter

from app.models.project import ProjectSessionResponse, UpdateSessionRequest
from app.services.project_service import get_or_create_session, update_session_name

router = APIRouter(prefix="/api/project", tags=["project"])


@router.get("/session", response_model=ProjectSessionResponse)
async def get_session():
    session = get_or_create_session()
    return ProjectSessionResponse(success=True, session=session)


@router.patch("/session", response_model=ProjectSessionResponse)
async def patch_session(body: UpdateSessionRequest):
    session = update_session_name(body.name)
    return ProjectSessionResponse(success=True, session=session)
