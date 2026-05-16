from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.library import ProjectDetails, ProjectSummary
from app.services import library_service

router = APIRouter(prefix="/api/library", tags=["library"])


class CreateProjectRequest(BaseModel):
    name: str
    template: str = "blank"


@router.get("/projects", response_model=list[ProjectSummary])
async def list_projects():
    return library_service.list_projects()


@router.post("/projects/create", response_model=ProjectSummary, status_code=201)
async def create_project(body: CreateProjectRequest):
    return library_service.create_project(body.name, body.template)


@router.post("/projects/{project_id}/duplicate", response_model=ProjectSummary, status_code=201)
async def duplicate_project(project_id: str):
    return library_service.duplicate_project(project_id)


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: str):
    library_service.delete_project(project_id)


@router.post("/projects/{project_id}/activate", response_model=ProjectSummary)
async def activate_project(project_id: str):
    return library_service.activate_project(project_id)


@router.get("/projects/{project_id}", response_model=ProjectDetails)
async def get_project(project_id: str):
    return library_service.get_project_details(project_id)
