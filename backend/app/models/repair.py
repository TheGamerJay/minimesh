from pydantic import BaseModel


class RepairAction(BaseModel):
    action_type: str
    label: str
    description: str
    priority: int
    issue_ids: list[str] = []
    navigation: bool = False


class RepairPlan(BaseModel):
    asset_id: str
    actions: list[RepairAction]
    generated_at: str
    qa_score: int | None = None
    qa_status: str | None = None


class RepairActionResult(BaseModel):
    action_type: str
    status: str  # triggered | navigation | failed
    message: str
    job_id: str | None = None
