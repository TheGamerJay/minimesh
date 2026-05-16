export interface RigModule {
  id: string;
  name: string;
  module_type: string;
  description: string;
  compatible_rig_types: string[];
  required_bones: string[];
  created_at: string;
}

export interface AttachmentSocket {
  id: string;
  socket_name: string;
  parent_bone: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  attachment_type: string;
}

export interface TransformState {
  id: string;
  name: string;
  description: string;
  active_modules: string[];
  transform_behavior: string;
}

export interface ModuleAssignment {
  rig_job_id: string;
  assigned_modules: RigModule[];
  incompatible_modules: (RigModule & { incompatibility_reason: string })[];
  compatible_sockets: AttachmentSocket[];
  transform_states: TransformState[];
}

export async function getModules(): Promise<RigModule[]> {
  const res = await fetch("/api/modules");
  if (!res.ok) throw new Error("Failed to fetch modules");
  return res.json();
}

export async function getSockets(): Promise<AttachmentSocket[]> {
  const res = await fetch("/api/modules/sockets");
  if (!res.ok) throw new Error("Failed to fetch sockets");
  return res.json();
}

export async function assignModules(
  rig_job_id: string,
  module_ids: string[]
): Promise<ModuleAssignment> {
  const res = await fetch("/api/modules/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rig_job_id, module_ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? "Failed to assign modules"
    );
  }
  return res.json();
}

export async function getRigModules(
  rig_job_id: string
): Promise<ModuleAssignment> {
  const res = await fetch(`/api/modules/rig/${rig_job_id}`);
  if (!res.ok) throw new Error("Failed to fetch rig modules");
  return res.json();
}
