export interface AnimationClip {
  id: string;
  name: string;
  clip_type: string;
  duration_seconds: number;
  compatible_rig_types: string[];
  description: string;
}

export interface AnimationJob {
  id: string;
  source_rig_job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  clip_id: string;
  provider: string;
  output_files: string[];
  message: string;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAnimationClips(): Promise<AnimationClip[]> {
  const res = await fetch("/api/animations/clips");
  if (!res.ok) throw new Error("Failed to fetch animation clips");
  return res.json();
}

export async function createAnimationJob(
  source_rig_job_id: string,
  clip_id: string
): Promise<AnimationJob> {
  const res = await fetch("/api/animations/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_rig_job_id, clip_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? "Failed to create animation job"
    );
  }
  return res.json();
}

export async function getAnimationJob(
  animation_job_id: string
): Promise<AnimationJob> {
  const res = await fetch(`/api/animations/${animation_job_id}`);
  if (!res.ok) throw new Error("Failed to fetch animation job");
  return res.json();
}

export async function listAnimationJobs(): Promise<AnimationJob[]> {
  const res = await fetch("/api/animations");
  if (!res.ok) throw new Error("Failed to fetch animation jobs");
  return res.json();
}
