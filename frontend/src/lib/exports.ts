export interface ExportFile {
  filename: string;
  path: string;
  type: string;
  size: number;
  created_at: string;
}

export interface ExportManifest {
  job_id: string;
  export_id: string;
  provider: string;
  mode: string;
  export_type: string;
  files: ExportFile[];
  created_at: string;
}

export async function createExport(jobId: string): Promise<ExportManifest> {
  const res = await fetch(`/api/exports/${jobId}/create`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Failed to create export");
  return data;
}

export async function getJobExports(jobId: string): Promise<ExportManifest[]> {
  const res = await fetch(`/api/exports/job/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch exports");
  return res.json();
}

export async function getExport(exportId: string): Promise<ExportManifest> {
  const res = await fetch(`/api/exports/${exportId}`);
  if (!res.ok) throw new Error("Export not found");
  return res.json();
}

export function downloadExport(exportId: string): void {
  const link = document.createElement("a");
  link.href = `/api/exports/${exportId}/download`;
  link.download = "minimesh_export.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
