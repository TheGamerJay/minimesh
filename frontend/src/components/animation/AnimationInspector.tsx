import { AnimationClip, AnimationJob } from "../../lib/animations";

interface AnimationInspectorProps {
  animJob: AnimationJob | null;
  selectedClip: AnimationClip | null;
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

export default function AnimationInspector({
  animJob,
  selectedClip,
}: AnimationInspectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Animation Inspector
      </div>

      {selectedClip && (
        <div>
          <div className="text-[10px] font-mono text-slate-500 mb-2">
            Selected Clip
          </div>
          <div className="flex flex-col">
            <InfoRow label="name" value={selectedClip.name} />
            <InfoRow label="clip_type" value={selectedClip.clip_type} />
            <InfoRow label="duration" value={`${selectedClip.duration_seconds}s`} />
            <InfoRow
              label="compatible"
              value={selectedClip.compatible_rig_types.join(", ")}
            />
          </div>
        </div>
      )}

      {animJob ? (
        <div>
          <div className="text-[10px] font-mono text-slate-500 mb-2">
            Animation Job
          </div>
          <div className="flex flex-col">
            <InfoRow label="job_id" value={animJob.id.slice(0, 8) + "…"} />
            <InfoRow label="clip_id" value={animJob.clip_id} />
            <InfoRow label="provider" value={animJob.provider} />
            <InfoRow label="status" value={animJob.status} />
            {animJob.message && (
              <InfoRow
                label="message"
                value={
                  animJob.message.length > 60
                    ? animJob.message.slice(0, 60) + "…"
                    : animJob.message
                }
              />
            )}
          </div>

          {animJob.status !== "completed" && (
            <div className="mt-2 text-[10px] text-slate-500 font-mono">
              {animJob.status === "queued" && "Waiting for animation worker..."}
              {animJob.status === "processing" &&
                "Retargeting motion clip..."}
              {animJob.status === "failed" && (
                <span className="text-red-400">
                  {animJob.error ?? "Failed"}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-slate-600">
          Select a clip and click Preview Clip to start.
        </p>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
        <div className="text-[10px] font-mono text-slate-700">── Phase 9+ ──</div>
        <div className="px-2 py-1.5 rounded border border-white/4 text-[10px] text-slate-600">
          Real motion retargeting
        </div>
        <div className="px-2 py-1.5 rounded border border-white/4 text-[10px] text-slate-600">
          Mesh deformation / skinning
        </div>
        <div className="px-2 py-1.5 rounded border border-white/4 text-[10px] text-slate-600">
          Motion capture import
        </div>
        <div className="px-2 py-1.5 rounded border border-white/4 text-[10px] text-slate-600">
          Export animated GLTF / FBX
        </div>
      </div>
    </div>
  );
}
