export interface ModeRequirements {
  mode: string;
  requirements: string[];
  met: string[];
  missing: string[];
}

export interface Readiness {
  score: number;
  status: "not_ready" | "basic_ready" | "strong_ready";
  missing: string[];
  warnings: string[];
  strengths: string[];
  generation_mode_requirements: ModeRequirements;
}

export interface ProjectSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  readiness: Readiness;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function getProjectSession(): Promise<ProjectSession> {
  const data = await request<{ session: ProjectSession }>("/api/project/session");
  return data.session;
}

export async function updateProjectName(name: string): Promise<ProjectSession> {
  const data = await request<{ session: ProjectSession }>("/api/project/session", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return data.session;
}
