from __future__ import annotations
from fastapi import APIRouter
from app.models.audit import ProjectAudit
from app.services import audit_service

router = APIRouter(prefix="/api/audits", tags=["audits"])


@router.post("/run", response_model=ProjectAudit, status_code=201)
async def run_audit():
    return audit_service.run_audit()


@router.get("/latest", response_model=ProjectAudit)
async def get_latest_audit():
    return audit_service.get_latest_audit()


@router.get("", response_model=list[ProjectAudit])
async def list_audits():
    return audit_service.list_audits()
