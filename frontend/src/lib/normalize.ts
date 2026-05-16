const BASE = "/api/normalize";

export interface NormalizeJob {
  id: string;
  asset_id: string;
  source_version: number;
  output_version: number;
  status: "queued" | "processing" | "completed" | "failed";
  provider: string;
  normalization_scale: number;
  original_bounds: Record<string, number>;
  normalized_bounds: Record<string, number>;
  message: string;
  fallback_normalized: boolean;
  created_at: string;
  updated_at: string;
}

export function normalizedGlbUrl(job: NormalizeJob): string {
  return `/export-packages/normalized/${job.id}/normalized.glb`;
}

export async function runNormalize(assetId: string): Promise<NormalizeJob> {
  const res = await fetch(`${BASE}/run/${assetId}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Run normalize failed (${res.status})`);
  }
  return res.json();
}

export async function getNormalizeJob(jobId: string): Promise<NormalizeJob> {
  const res = await fetch(`${BASE}/${jobId}`);
  if (!res.ok) throw new Error(`Get normalize job failed (${res.status})`);
  return res.json();
}

export async function listNormalizeJobs(assetId?: string): Promise<NormalizeJob[]> {
  const url = assetId ? `${BASE}?asset_id=${assetId}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`List normalize jobs failed (${res.status})`);
  return res.json();
}
