from __future__ import annotations
from pydantic import BaseModel

VALID_SEVERITIES = {"info", "warning", "critical"}
VALID_CATEGORIES = {"references", "generation", "rigging", "animation", "exports", "modules"}
VALID_STATUSES = {"unhealthy", "needs_attention", "production_ready"}


class AuditIssue(BaseModel):
    id: str
    severity: str  # info | warning | critical
    category: str  # references | generation | rigging | animation | exports | modules
    title: str
    description: str
    suggestion: str
    created_at: str


class PipelineSummaryItem(BaseModel):
    category: str
    status: str  # healthy | warning | missing | failed
    detail: str


class ProjectAudit(BaseModel):
    id: str
    score: int
    status: str  # unhealthy | needs_attention | production_ready
    issues: list[AuditIssue]
    strengths: list[str]
    recommendations: list[str]
    pipeline_summary: list[PipelineSummaryItem]
    created_at: str
