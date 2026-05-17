const BASE = "/api/asset-qa";

export interface AssetQAIssue {
  id: string;
  severity: "info" | "warning" | "critical";
  category: string;
  title: string;
  description: string;
  suggestion: string;
  detected_at: string;
}

export interface AssetQAReport {
  asset_id: string;
  score: number;
  status: "healthy" | "needs_work" | "problematic";
  issues: AssetQAIssue[];
  strengths: string[];
  recommendations: string[];
  generated_at: string;
}

export function qaStatusColor(status: string): string {
  if (status === "healthy") return "emerald";
  if (status === "problematic") return "red";
  return "amber";
}

export function qaStatusLabel(status: string): string {
  if (status === "healthy") return "HEALTHY";
  if (status === "problematic") return "PROBLEMATIC";
  return "NEEDS WORK";
}

export function severityColor(severity: string): string {
  if (severity === "critical") return "red";
  if (severity === "warning") return "amber";
  return "blue";
}

export async function runAssetQA(assetId: string): Promise<AssetQAReport> {
  const res = await fetch(`${BASE}/run/${assetId}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `QA analysis failed (${res.status})`);
  }
  return res.json();
}

export async function getAssetQA(assetId: string): Promise<AssetQAReport | null> {
  const res = await fetch(`${BASE}/${assetId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Get QA report failed (${res.status})`);
  return res.json();
}
