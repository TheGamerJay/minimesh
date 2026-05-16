export interface Job {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  mode: string;
  style_direction: string;
  rig_intent: string;
  target_quality: string;
  texture_style: string;
  provider: string;
  image_count: number;
  created_at: string;
  updated_at: string;
  result_path?: string | null;
  error?: string | null;
  // Phase 14 — real provider fields
  external_job_id?: string | null;
  preview_url?: string | null;
  model_url?: string | null;
  model_downloaded?: boolean;
  glb_path?: string | null;
  progress?: number;
  // Phase 15 — provider fallback chain
  provider_attempts?: string[];
}

export async function createJob(): Promise<Job> {
  const res = await fetch("/api/jobs/generate", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Failed to create job");
  return data;
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`/api/jobs/${jobId}`);
  if (!res.ok) throw new Error("Job not found");
  return res.json();
}

export async function listJobs(): Promise<Job[]> {
  const res = await fetch("/api/jobs");
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}
