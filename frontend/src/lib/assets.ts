export interface AssetVersion {
  version: number;
  file_path: string;
  created_at: string;
  provider: string;
}

export interface GeneratedAsset {
  id: string;
  project_id: string;
  source_job_id: string;
  provider: string;
  asset_type: string; // glb | gltf | obj | fbx
  file_path: string;
  name: string;
  preview_image: string | null;
  thumbnail: string | null;
  polygon_count: number | null;
  file_size: number;
  created_at: string;
  updated_at: string;
  version: number;
  tags: string[];
  versions: AssetVersion[];
  material_count?: number | null;
  has_uvs?: boolean | null;
  // Phase 26 — QA fields
  qa_score?: number | null;
  qa_status?: string | null;
  qa_last_checked?: string | null;
}

export async function listAssets(): Promise<GeneratedAsset[]> {
  const res = await fetch("/api/assets");
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
}

export async function getAsset(assetId: string): Promise<GeneratedAsset> {
  const res = await fetch(`/api/assets/${assetId}`);
  if (!res.ok) throw new Error("Asset not found");
  return res.json();
}

export async function deleteAsset(assetId: string): Promise<void> {
  const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete asset");
}

export async function duplicateAsset(assetId: string): Promise<GeneratedAsset> {
  const res = await fetch(`/api/assets/${assetId}/duplicate`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to duplicate asset");
  return res.json();
}

export async function renameAsset(assetId: string, name: string): Promise<GeneratedAsset> {
  const res = await fetch(`/api/assets/${assetId}/rename`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to rename asset");
  return res.json();
}

export async function tagAsset(assetId: string, tags: string[]): Promise<GeneratedAsset> {
  const res = await fetch(`/api/assets/${assetId}/tags`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) throw new Error("Failed to update tags");
  return res.json();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function assetDownloadUrl(asset: GeneratedAsset): string {
  return `/export-packages/jobs/${asset.source_job_id}/model.${asset.asset_type}`;
}
