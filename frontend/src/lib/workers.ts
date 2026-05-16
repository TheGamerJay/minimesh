export interface WorkerTask {
  id: string;
  task_type: string;
  provider: string;
  asset_id: string | null;
  status: "queued" | "running" | "completed" | "failed";
  input_files: string[];
  output_files: string[];
  logs: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerHealth {
  worker_online: boolean;
  blender_available: boolean;
  blender_version: string;
  blender_path: string;
  blender_mode: "real" | "mock";
  queue_size: number;
  active_tasks: number;
  last_check: string;
}

export const WORKER_TASK_TYPES = [
  { value: "glb_inspect",    label: "GLB Inspect",    description: "Inspect a GLB asset file structure" },
  { value: "mesh_normalize", label: "Mesh Normalize", description: "Center + scale mesh to 2-unit bounding cube" },
  { value: "uv_check",       label: "UV Check",       description: "Scan UV channels, islands, and coverage" },
  { value: "mock_bake",      label: "Mock Bake",      description: "Simulate a full PBR texture bake" },
  { value: "mock_edit",      label: "Mock Edit",      description: "Simulate a sculpt edit operation" },
  { value: "export_prepare", label: "Export Prepare", description: "Prepare and package asset for export" },
] as const;

export async function getWorkerHealth(): Promise<WorkerHealth> {
  const res = await fetch("/api/workers/health");
  if (!res.ok) throw new Error("Failed to get worker health");
  return res.json();
}

export async function createWorkerTask(
  taskType: string,
  assetId?: string
): Promise<WorkerTask> {
  const res = await fetch("/api/workers/tasks/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_type: taskType, asset_id: assetId ?? null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Create failed" }));
    throw new Error(err.detail ?? "Failed to create worker task");
  }
  return res.json();
}

export async function listWorkerTasks(): Promise<WorkerTask[]> {
  const res = await fetch("/api/workers/tasks");
  if (!res.ok) throw new Error("Failed to list worker tasks");
  return res.json();
}

export async function getWorkerTask(taskId: string): Promise<WorkerTask> {
  const res = await fetch(`/api/workers/tasks/${taskId}`);
  if (!res.ok) throw new Error("Worker task not found");
  return res.json();
}
