export interface ProviderCapabilities {
  generation: boolean;
  rigging: boolean;
  animation: boolean;
  textures: boolean;
}

export interface ProviderDetail {
  name: string;
  display_name: string;
  description: string;
  stub: boolean;
  enabled: boolean;
  api_key_present: boolean;
  capabilities: ProviderCapabilities;
  priority_order: number;
  health_status: "healthy" | "degraded" | "offline" | "disabled" | "unknown";
  health_message: string;
}

export interface ActiveProvider {
  provider: string;
  is_real: boolean;
  health_status: "healthy" | "degraded" | "offline" | "disabled" | "unknown";
  fallback_provider: string | null;
}

export interface ProviderTestResult {
  provider: string;
  status: "healthy" | "degraded" | "offline" | "disabled";
  message: string;
  latency_ms: number | null;
}

// Legacy type alias kept for backwards compat
export type ProviderConfig = ProviderDetail;

export async function getProviderStatus(): Promise<ProviderDetail[]> {
  const res = await fetch("/api/providers/status");
  if (!res.ok) throw new Error("Failed to fetch provider status");
  return res.json();
}

export async function getActiveProvider(): Promise<ActiveProvider> {
  const res = await fetch("/api/providers/active");
  if (!res.ok) throw new Error("Failed to fetch active provider");
  return res.json();
}

export async function getProviderPriority(): Promise<string[]> {
  const res = await fetch("/api/providers/priority");
  if (!res.ok) throw new Error("Failed to fetch provider priority");
  const data = await res.json();
  return data.priority;
}

export async function updateProviderPriority(priority: string[]): Promise<string[]> {
  const res = await fetch("/api/providers/priority", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority }),
  });
  if (!res.ok) throw new Error("Failed to update provider priority");
  const data = await res.json();
  return data.priority;
}

export async function setProviderEnabled(name: string, enabled: boolean): Promise<void> {
  const res = await fetch(`/api/providers/${name}/enabled`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to update provider");
  }
}

export async function testProvider(name: string): Promise<ProviderTestResult> {
  const res = await fetch(`/api/providers/test/${name}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to test provider");
  return res.json();
}
