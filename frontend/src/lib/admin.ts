export interface AdminUserSummary {
  id: string;
  username: string;
  email: string;
  created_at: string;
  last_login: string | null;
  is_admin: boolean;
  is_legacy: boolean;
  project_count: number;
  asset_count: number;
}

export interface StorageUsage {
  total_users: number;
  total_projects: number;
  total_assets: number;
  total_exports: number;
  total_storage_bytes: number;
}

export interface ProviderUsage {
  provider: string;
  generation_jobs: number;
  inspection_jobs: number;
  normalize_jobs: number;
  thumbnail_jobs: number;
  failed_jobs: number;
}

export interface SystemAuditLog {
  id: string;
  category: string;
  action: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface SystemHealth {
  storage_writable: boolean;
  auth_storage: boolean;
  blender_available: boolean;
  blender_version: string;
  blender_path: string;
  provider_registry: boolean;
  worker_online: boolean;
  queue_size: number;
  active_tasks: number;
  audit_events_7d: number;
}

async function adminFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export function getAdminUsers(): Promise<AdminUserSummary[]> {
  return adminFetch("/api/admin/users");
}

export function getStorageUsage(): Promise<StorageUsage> {
  return adminFetch("/api/admin/storage");
}

export function getProviderUsage(): Promise<ProviderUsage[]> {
  return adminFetch("/api/admin/providers");
}

export function getAuditLogs(limit = 100, category?: string): Promise<SystemAuditLog[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (category) params.set("category", category);
  return adminFetch(`/api/admin/audit-logs?${params}`);
}

export function getSystemHealth(): Promise<SystemHealth> {
  return adminFetch("/api/admin/system-health");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
