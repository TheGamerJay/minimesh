export interface ProjectSummary {
  id: string;
  name: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
  mode: string;
  status: string;
  score: number;
  is_active: boolean;
}

export interface ProjectDetails {
  summary: ProjectSummary;
  upload_count: number;
  job_count: number;
  rig_count: number;
  animation_count: number;
  export_count: number;
  audit_score: number | null;
}

export const TEMPLATES = [
  { id: "blank", label: "Blank Project" },
  { id: "character", label: "Character Project" },
  { id: "prop", label: "Prop Project" },
  { id: "creature", label: "Creature Project" },
];

export async function listProjects(): Promise<ProjectSummary[]> {
  const res = await fetch("/api/library/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function createProject(name: string, template = "blank"): Promise<ProjectSummary> {
  const res = await fetch("/api/library/projects/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, template }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to create project");
  }
  return res.json();
}

export async function duplicateProject(projectId: string): Promise<ProjectSummary> {
  const res = await fetch(`/api/library/projects/${projectId}/duplicate`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to duplicate project");
  return res.json();
}

export async function deleteProject(projectId: string): Promise<void> {
  const res = await fetch(`/api/library/projects/${projectId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to delete project");
  }
}

export async function activateProject(projectId: string): Promise<ProjectSummary> {
  const res = await fetch(`/api/library/projects/${projectId}/activate`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to activate project");
  return res.json();
}

export async function getProjectDetails(projectId: string): Promise<ProjectDetails> {
  const res = await fetch(`/api/library/projects/${projectId}`);
  if (!res.ok) throw new Error("Failed to fetch project details");
  return res.json();
}
