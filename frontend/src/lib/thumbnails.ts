const BASE = "/api/thumbnails";

export interface ThumbnailRenderJob {
  id: string;
  asset_id: string;
  version: number;
  status: "queued" | "processing" | "completed" | "failed";
  provider: string;
  render_type: string;
  output_image: string;
  message: string;
  fallback: boolean;
  created_at: string;
  updated_at: string;
}

export const RENDER_TYPES = [
  { value: "preview", label: "Preview", description: "Standard angled preview shot" },
  { value: "turntable", label: "Turntable", description: "Front-facing rotation preview" },
  { value: "material_preview", label: "Material Preview", description: "Close-up material shot" },
] as const;

export async function renderThumbnail(assetId: string, renderType = "preview"): Promise<ThumbnailRenderJob> {
  const res = await fetch(`${BASE}/render/${assetId}?render_type=${renderType}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Render thumbnail failed (${res.status})`);
  }
  return res.json();
}

export async function captureViewerThumbnail(assetId: string, dataUrl: string): Promise<{ thumbnail_url: string }> {
  const res = await fetch(`${BASE}/capture/${assetId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data_url: dataUrl }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Capture thumbnail failed (${res.status})`);
  }
  return res.json();
}

export async function getThumbnailJob(jobId: string): Promise<ThumbnailRenderJob> {
  const res = await fetch(`${BASE}/${jobId}`);
  if (!res.ok) throw new Error(`Get thumbnail job failed (${res.status})`);
  return res.json();
}

export async function listThumbnailJobs(assetId?: string): Promise<ThumbnailRenderJob[]> {
  const url = assetId ? `${BASE}?asset_id=${assetId}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`List thumbnail jobs failed (${res.status})`);
  return res.json();
}
