const BASE = "/api/repairs";

export interface RepairAction {
  action_type: string;
  label: string;
  description: string;
  priority: number;
  issue_ids: string[];
  navigation: boolean;
}

export interface RepairPlan {
  asset_id: string;
  actions: RepairAction[];
  generated_at: string;
  qa_score: number | null;
  qa_status: string | null;
}

export interface RepairActionResult {
  action_type: string;
  status: "triggered" | "navigation" | "failed";
  message: string;
  job_id: string | null;
}

export async function getRepairPlan(assetId: string): Promise<RepairPlan> {
  const res = await fetch(`${BASE}/${assetId}/plan`);
  if (!res.ok) throw new Error(`Failed to load repair plan (${res.status})`);
  return res.json();
}

export async function runRepairAction(
  assetId: string,
  actionType: string,
): Promise<RepairActionResult> {
  const res = await fetch(`${BASE}/${assetId}/run/${actionType}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Action failed (${res.status})`);
  }
  return res.json();
}
