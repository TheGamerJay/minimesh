export interface EditOperation {
  id: string;
  asset_id: string;
  operation_type: string;
  brush_type: string;
  strength: number;
  radius: number;
  position: number[];
  status: "queued" | "processing" | "completed" | "failed";
  provider: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export const SCULPT_TOOLS = [
  { id: "clay",    label: "Clay",    description: "Build up surface volume" },
  { id: "smooth",  label: "Smooth",  description: "Relax and soften surface" },
  { id: "inflate", label: "Inflate", description: "Push surface outward" },
  { id: "pinch",   label: "Pinch",   description: "Pull surface toward center" },
  { id: "move",    label: "Move",    description: "Translate a surface region" },
  { id: "mirror",  label: "Mirror",  description: "Symmetric editing across axis" },
] as const;

export const FALLOFF_TYPES = ["sphere", "gaussian", "flat"] as const;

export async function createEditOperation(params: {
  asset_id: string;
  operation_type: string;
  brush_type: string;
  strength: number;
  radius: number;
  position?: number[];
}): Promise<EditOperation> {
  const res = await fetch("/api/edits/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Create failed" }));
    throw new Error(err.detail ?? "Failed to create edit operation");
  }
  return res.json();
}

export async function getEditOperation(operationId: string): Promise<EditOperation> {
  const res = await fetch(`/api/edits/${operationId}`);
  if (!res.ok) throw new Error("Edit operation not found");
  return res.json();
}

export async function listEditOperations(assetId?: string): Promise<EditOperation[]> {
  const url = assetId ? `/api/edits?asset_id=${assetId}` : "/api/edits";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to list edit operations");
  return res.json();
}
