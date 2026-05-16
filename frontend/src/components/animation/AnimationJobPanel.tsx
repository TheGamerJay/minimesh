import { AnimationJob } from "../../lib/animations";

interface AnimationJobPanelProps {
  animJobs: AnimationJob[];
  activeAnimJobId: string | null;
  onSelect: (aj: AnimationJob) => void;
}

function statusColor(status: string) {
  if (status === "completed") return "text-emerald-400";
  if (status === "failed") return "text-red-400";
  if (status === "processing") return "text-cyan-400";
  return "text-yellow-400";
}

export default function AnimationJobPanel({
  animJobs,
  activeAnimJobId,
  onSelect,
}: AnimationJobPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Anim History
      </div>

      {animJobs.length === 0 ? (
        <p className="text-[11px] text-slate-600">No animation jobs yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
          {animJobs.map((aj) => (
            <button
              key={aj.id}
              onClick={() => onSelect(aj)}
              className={[
                "text-left px-3 py-2 rounded-lg border text-[10px] transition-all font-mono",
                activeAnimJobId === aj.id
                  ? "border-cyan-500/30 bg-cyan-500/5"
                  : "border-white/5 hover:border-white/10",
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-slate-400">{aj.clip_id}</span>
                <span className={statusColor(aj.status)}>{aj.status}</span>
              </div>
              <div className="text-slate-600">{aj.id.slice(0, 12)}…</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
