export interface GenerationConfig {
  mode: string;
  style_direction: string;
  rig_intent: string;
  target_quality: string;
  texture_style: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface GenerationConfigPayload {
  mode?: string;
  style_direction?: string;
  rig_intent?: string;
  target_quality?: string;
  texture_style?: string;
  notes?: string;
}

export const MODE_LABELS: Record<string, string> = {
  two_d_anime_sheet: "2D Anime Sheet",
  three_d_model: "3D Model",
  clay_sculpt: "Clay Sculpt",
  toy_figurine: "Toy / Figurine",
  game_ready_character: "Game-Ready Character",
  cinematic_high_poly: "Cinematic High-Poly",
  low_poly_mobile: "Low-Poly Mobile",
  prop_only: "Prop Only",
};

export const STYLE_LABELS: Record<string, string> = {
  anime: "Anime",
  realistic: "Realistic",
  stylized: "Stylized",
  clay: "Clay",
  toy: "Toy",
  game: "Game",
  cinematic: "Cinematic",
};

export const RIG_LABELS: Record<string, string> = {
  none: "None",
  humanoid: "Humanoid",
  creature: "Creature",
  wings: "Wings",
  weapon_prop: "Weapon / Prop",
  vehicle_prop: "Vehicle / Prop",
};

export const QUALITY_LABELS: Record<string, string> = {
  draft: "Draft",
  standard: "Standard",
  high: "High",
};

export const TEXTURE_LABELS: Record<string, string> = {
  flat: "Flat",
  painted: "Painted",
  pbr: "PBR",
  toon: "Toon",
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function getGenerationConfig(): Promise<GenerationConfig> {
  const data = await request<{ config: GenerationConfig }>("/api/generation/config");
  return data.config;
}

export async function updateGenerationConfig(
  payload: GenerationConfigPayload
): Promise<GenerationConfig> {
  const data = await request<{ config: GenerationConfig }>("/api/generation/config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.config;
}
