export interface UVAnalysis {
  has_uvs: boolean;
  uv_channel_count: number;
  overlapping_uvs: boolean;
  estimated_uv_coverage: number;
  warnings: string[];
}

export interface BakeJob {
  id: string;
  asset_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  bake_type: string;
  provider: string;
  output_maps: string[];
  progress: number;
  message: string;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface TextureValidationResult {
  warnings: string[];
  suggestions: string[];
  ready: boolean;
}

export const BAKE_TYPES = [
  { value: "full_pbr",  label: "Full PBR",  maps: ["albedo", "normal", "roughness", "metallic", "ao", "emissive"] },
  { value: "albedo",    label: "Albedo",    maps: ["albedo"] },
  { value: "normal",    label: "Normal",    maps: ["normal"] },
  { value: "roughness", label: "Roughness", maps: ["roughness"] },
  { value: "ao",        label: "AO",        maps: ["ao"] },
  { value: "emissive",  label: "Emissive",  maps: ["emissive"] },
] as const;

export async function getUVAnalysis(assetId: string): Promise<UVAnalysis> {
  const res = await fetch(`/api/bakes/uv/${assetId}`);
  if (!res.ok) throw new Error("Failed to fetch UV analysis");
  return res.json();
}

export async function validateTextures(
  assignedTextures: Record<string, string>
): Promise<TextureValidationResult> {
  const res = await fetch("/api/bakes/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assigned_textures: assignedTextures }),
  });
  if (!res.ok) throw new Error("Validation failed");
  return res.json();
}

export async function createBakeJob(assetId: string, bakeType: string): Promise<BakeJob> {
  const res = await fetch("/api/bakes/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset_id: assetId, bake_type: bakeType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Create failed" }));
    throw new Error(err.detail ?? "Failed to create bake job");
  }
  return res.json();
}

export async function getBakeJob(jobId: string): Promise<BakeJob> {
  const res = await fetch(`/api/bakes/${jobId}`);
  if (!res.ok) throw new Error("Bake job not found");
  return res.json();
}

export async function listBakeJobs(assetId?: string): Promise<BakeJob[]> {
  const url = assetId ? `/api/bakes?asset_id=${assetId}` : "/api/bakes";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to list bake jobs");
  return res.json();
}
