export interface ProviderConfig {
  provider_name: string;
  enabled: boolean;
  api_key_present: boolean;
  supports_generation: boolean;
  supports_rigging: boolean;
  supports_animation: boolean;
  supports_textures: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActiveProvider {
  provider: string;
  is_real: boolean;
}

export async function getProviderStatus(): Promise<ProviderConfig[]> {
  const res = await fetch("/api/providers/status");
  if (!res.ok) throw new Error("Failed to fetch provider status");
  return res.json();
}

export async function getActiveProvider(): Promise<ActiveProvider> {
  const res = await fetch("/api/providers/active");
  if (!res.ok) throw new Error("Failed to fetch active provider");
  return res.json();
}
