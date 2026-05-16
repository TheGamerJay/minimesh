export interface RigProfile {
  id: string;
  name: string;
  rig_type: string;
  description: string;
  expected_bones: string[];
  supports_animation: boolean;
}

export interface RigBone {
  name: string;
  position: [number, number, number];
  parent: string | null;
}

export interface RigJob {
  id: string;
  source_job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  rig_type: string;
  provider: string;
  skeleton_data: { bones: RigBone[] } | null;
  outputs: string[];
  message: string;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export async function getRigProfiles(): Promise<RigProfile[]> {
  const res = await fetch("/api/rigs/profiles");
  if (!res.ok) throw new Error("Failed to fetch rig profiles");
  return res.json();
}

export async function createRigJob(
  source_job_id: string,
  rig_type: string
): Promise<RigJob> {
  const res = await fetch("/api/rigs/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_job_id, rig_type }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to create rig job");
  }
  return res.json();
}

export async function getRigJob(rig_job_id: string): Promise<RigJob> {
  const res = await fetch(`/api/rigs/${rig_job_id}`);
  if (!res.ok) throw new Error("Failed to fetch rig job");
  return res.json();
}

export async function listRigJobs(): Promise<RigJob[]> {
  const res = await fetch("/api/rigs");
  if (!res.ok) throw new Error("Failed to fetch rig jobs");
  return res.json();
}
