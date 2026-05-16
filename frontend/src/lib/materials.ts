export type ShaderType = "toon" | "pbr" | "metallic" | "holographic" | "matte" | "emissive";

export interface MaterialProfile {
  id: string;
  name: string;
  shader_type: ShaderType;
  base_color: string;
  secondary_color: string;
  emissive_color: string;
  metallic: number;
  roughness: number;
  emissive_intensity: number;
  opacity: number;
  rim_light: boolean;
  toon_steps: number;
  is_preset: boolean;
  created_at: string;
  updated_at: string;
}

export const SHADER_LABELS: Record<ShaderType, string> = {
  toon: "Toon",
  pbr: "PBR",
  metallic: "Metallic",
  holographic: "Holographic",
  matte: "Matte",
  emissive: "Emissive",
};

export const SHADER_TYPES: ShaderType[] = ["toon", "pbr", "metallic", "holographic", "matte", "emissive"];

export async function listMaterials(): Promise<MaterialProfile[]> {
  const res = await fetch("/api/materials");
  if (!res.ok) throw new Error("Failed to fetch materials");
  return res.json();
}

export async function createMaterial(data: Partial<MaterialProfile>): Promise<MaterialProfile> {
  const res = await fetch("/api/materials/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to create material");
  }
  return res.json();
}

export async function updateMaterial(id: string, data: Partial<MaterialProfile>): Promise<MaterialProfile> {
  const res = await fetch(`/api/materials/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to update material");
  }
  return res.json();
}

export async function deleteMaterial(id: string): Promise<void> {
  const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to delete material");
  }
}

export async function activateMaterial(id: string): Promise<MaterialProfile> {
  const res = await fetch(`/api/materials/${id}/activate`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to activate material");
  return res.json();
}
