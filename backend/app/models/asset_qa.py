from __future__ import annotations
from pydantic import BaseModel

VALID_QA_SEVERITIES = {"info", "warning", "critical"}
VALID_QA_CATEGORIES = {"geometry", "materials", "textures", "uv", "scale", "rigging", "export"}
VALID_QA_STATUSES = {"healthy", "needs_work", "problematic"}

# Score thresholds
SCORE_HEALTHY = 85
SCORE_NEEDS_WORK = 60


class AssetQAIssue(BaseModel):
    id: str
    severity: str       # info | warning | critical
    category: str       # geometry | materials | textures | uv | scale | rigging | export
    title: str
    description: str
    suggestion: str
    detected_at: str


class AssetQAReport(BaseModel):
    asset_id: str
    score: int = 100    # 0–100
    status: str = "needs_work"   # healthy | needs_work | problematic
    issues: list[AssetQAIssue] = []
    strengths: list[str] = []
    recommendations: list[str] = []
    generated_at: str
