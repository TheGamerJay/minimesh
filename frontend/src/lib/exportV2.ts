const BASE = "/api/export-v2";

export interface AssetExportPackage {
  id: string;
  asset_id: string;
  asset_name: string;
  export_type: string;
  version_exported: number;
  version_label: string;
  included_files: string[];
  manifest_path: string;
  zip_path: string;
  zip_size: number;
  normalized: boolean;
  has_textures: boolean;
  has_inspection: boolean;
  has_thumbnail: boolean;
  created_at: string;
}

export const EXPORT_TYPES = [
  {
    value: "glb_package",
    label: "GLB Package",
    description: "Model file + manifest. Clean minimal delivery.",
    includes: ["model", "thumbnail", "manifest"],
  },
  {
    value: "game_ready",
    label: "Game Ready",
    description: "Model + all project textures + thumbnail + manifest.",
    includes: ["model", "textures", "thumbnail", "manifest"],
  },
  {
    value: "texture_bundle",
    label: "Texture Bundle",
    description: "Project textures only + manifest.",
    includes: ["textures", "manifest"],
  },
  {
    value: "inspection_bundle",
    label: "Inspection Bundle",
    description: "Model + inspection report + manifest.",
    includes: ["model", "inspection", "manifest"],
  },
  {
    value: "full_project_bundle",
    label: "Full Project Bundle",
    description: "All available files — model, textures, thumbnail, inspection.",
    includes: ["model", "textures", "thumbnail", "inspection", "manifest"],
  },
] as const;

export const VERSION_OPTIONS = [
  { value: "latest", label: "Latest Version", description: "Current version of the asset" },
  { value: "original", label: "Original", description: "First imported/registered version" },
  { value: "normalized", label: "Normalized", description: "Blender-normalized version (if available)" },
] as const;

export function formatPackageSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function createExportPackage(
  assetId: string,
  exportType: string,
  versionLabel: string,
): Promise<AssetExportPackage> {
  const res = await fetch(`${BASE}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset_id: assetId, export_type: exportType, version_label: versionLabel }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Create export package failed (${res.status})`);
  }
  return res.json();
}

export async function getExportPackage(packageId: string): Promise<AssetExportPackage> {
  const res = await fetch(`${BASE}/${packageId}`);
  if (!res.ok) throw new Error(`Get export package failed (${res.status})`);
  return res.json();
}

export async function listExportPackages(assetId?: string): Promise<AssetExportPackage[]> {
  const url = assetId ? `${BASE}?asset_id=${assetId}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`List export packages failed (${res.status})`);
  return res.json();
}

export function getPackageDownloadUrl(packageId: string): string {
  return `${BASE}/${packageId}/download`;
}
