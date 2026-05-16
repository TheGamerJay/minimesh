const BASE = "/api/inspections";

export interface BoundingBox {
  width: number;
  height: number;
  depth: number;
}

export interface GLBInspectionReport {
  asset_id: string;
  object_count: number;
  mesh_count: number;
  material_count: number;
  estimated_triangles: number;
  bounding_box: BoundingBox;
  object_names: string[];
  material_names: string[];
  has_armature: boolean;
  has_animations: boolean;
  has_uvs: boolean;
  file_size: number;
  generated_at: string;
  fallback_estimate: boolean;
  blender_used: boolean;
  blender_version: string;
  blender_logs: string;
}

export async function runInspection(assetId: string): Promise<GLBInspectionReport> {
  const res = await fetch(`${BASE}/run/${assetId}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Run inspection failed (${res.status})`);
  }
  return res.json();
}

export async function getInspection(assetId: string): Promise<GLBInspectionReport | null> {
  const res = await fetch(`${BASE}/${assetId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Get inspection failed (${res.status})`);
  return res.json();
}
