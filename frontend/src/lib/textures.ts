export const TEXTURE_TYPES = ["albedo", "normal", "roughness", "metallic", "emissive", "opacity", "ao"] as const;
export type TextureType = (typeof TEXTURE_TYPES)[number];

export const TEXTURE_TYPE_LABELS: Record<TextureType, string> = {
  albedo: "Albedo",
  normal: "Normal",
  roughness: "Roughness",
  metallic: "Metallic",
  emissive: "Emissive",
  opacity: "Opacity",
  ao: "AO",
};

export interface TextureAsset {
  id: string;
  project_id: string;
  name: string;
  texture_type: TextureType;
  filename: string;
  file_size: number;
  resolution: string | null;
  created_at: string;
  tags: string[];
}

export interface MaterialTextureSet {
  id: string;
  asset_id: string | null;
  material_profile_id: string;
  assigned_textures: Partial<Record<TextureType, string>>;  // texture_type → texture_id
  created_at: string;
  updated_at: string;
}

export function textureUrl(asset: TextureAsset): string {
  return `/textures/${asset.filename}`;
}

export async function listTextures(): Promise<TextureAsset[]> {
  const res = await fetch("/api/textures");
  if (!res.ok) throw new Error("Failed to fetch textures");
  return res.json();
}

export async function uploadTexture(
  file: File,
  opts: { texture_type: TextureType; name?: string; tags?: string[] }
): Promise<TextureAsset> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("texture_type", opts.texture_type);
  if (opts.name) fd.append("name", opts.name);
  if (opts.tags?.length) fd.append("tags", opts.tags.join(","));

  const res = await fetch("/api/textures/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}

export async function deleteTexture(textureId: string): Promise<void> {
  const res = await fetch(`/api/textures/${textureId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete texture");
}

export async function assignTextures(
  materialProfileId: string,
  textures: Partial<Record<TextureType, string>>,
  assetId?: string
): Promise<MaterialTextureSet> {
  const res = await fetch("/api/textures/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      material_profile_id: materialProfileId,
      textures,
      asset_id: assetId ?? null,
    }),
  });
  if (!res.ok) throw new Error("Failed to assign textures");
  return res.json();
}

export async function getAssignment(materialProfileId: string): Promise<MaterialTextureSet | null> {
  const res = await fetch(`/api/textures/assignment/${materialProfileId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to get assignment");
  return res.json();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
