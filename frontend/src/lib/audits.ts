export type AuditSeverity = "info" | "warning" | "critical";
export type AuditStatus = "unhealthy" | "needs_attention" | "production_ready";

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  category: string;
  title: string;
  description: string;
  suggestion: string;
  created_at: string;
}

export interface PipelineSummaryItem {
  category: string;
  status: "healthy" | "warning" | "missing" | "failed";
  detail: string;
}

export interface ProjectAudit {
  id: string;
  score: number;
  status: AuditStatus;
  issues: AuditIssue[];
  strengths: string[];
  recommendations: string[];
  pipeline_summary: PipelineSummaryItem[];
  created_at: string;
}

export async function runAudit(): Promise<ProjectAudit> {
  const res = await fetch("/api/audits/run", { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Audit failed");
  }
  return res.json();
}

export async function getLatestAudit(): Promise<ProjectAudit | null> {
  const res = await fetch("/api/audits/latest");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch latest audit");
  return res.json();
}

export async function listAudits(): Promise<ProjectAudit[]> {
  const res = await fetch("/api/audits");
  if (!res.ok) throw new Error("Failed to fetch audit history");
  return res.json();
}
