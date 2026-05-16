import { RigJob } from "../../lib/rigs";

interface RigInspectorProps {
  rigJob: RigJob | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-white/4">
      <span className="text-[10px] font-mono text-slate-500 w-24 shrink-0">
        {label}
      </span>
      <span className="text-[10px] font-mono text-slate-300 break-all">
        {value}
      </span>
    </div>
  );
}

export default function RigInspector({ rigJob }: RigInspectorProps) {
  const bones = rigJob?.skeleton_data?.bones ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Rig Inspector
      </div>

      {!rigJob ? (
        <p className="text-[11px] text-slate-600">
          No active rig job. Select a profile and create one.
        </p>
      ) : (
        <>
          <div className="flex flex-col">
            <InfoRow label="rig_job_id" value={rigJob.id.slice(0, 8) + "…"} />
            <InfoRow
              label="source_job"
              value={rigJob.source_job_id.slice(0, 8) + "…"}
            />
            <InfoRow label="rig_type" value={rigJob.rig_type} />
            <InfoRow label="provider" value={rigJob.provider} />
            <InfoRow label="status" value={rigJob.status} />
            {rigJob.message && (
              <InfoRow label="message" value={rigJob.message} />
            )}
          </div>

          {bones.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 mb-2">
                Bones ({bones.length})
              </div>
              <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                {bones.map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center gap-2 py-1 border-b border-white/4"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400/50 shrink-0" />
                    <span className="text-[10px] font-mono text-slate-300 flex-1">
                      {b.name}
                    </span>
                    {b.parent && (
                      <span className="text-[9px] font-mono text-slate-600">
                        → {b.parent}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rigJob.status !== "completed" && (
            <div className="text-[10px] text-slate-500 font-mono">
              {rigJob.status === "queued" && "Waiting for rig worker..."}
              {rigJob.status === "processing" && "Placing bones on mesh..."}
              {rigJob.status === "failed" && (
                <span className="text-red-400">
                  {rigJob.error ?? "Failed"}
                </span>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
        <div className="text-[10px] font-mono text-slate-700">── Phase 8+ ──</div>
        <div className="px-2 py-1.5 rounded border border-white/4 text-[10px] text-slate-600">
          Weight painting
        </div>
        <div className="px-2 py-1.5 rounded border border-white/4 text-[10px] text-slate-600">
          IK / FK controls
        </div>
        <div className="px-2 py-1.5 rounded border border-white/4 text-[10px] text-slate-600">
          Blend shapes
        </div>
      </div>
    </div>
  );
}
