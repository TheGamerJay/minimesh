import { RigJob } from "../../lib/rigs";

interface RigJobPanelProps {
  rigJobs: RigJob[];
  activeRigJobId: string | null;
  onSelect: (rj: RigJob) => void;
}

function statusColor(status: string) {
  if (status === "completed") return "text-emerald-400";
  if (status === "failed") return "text-red-400";
  if (status === "processing") return "text-cyan-400";
  return "text-yellow-400";
}

export default function RigJobPanel({
  rigJobs,
  activeRigJobId,
  onSelect,
}: RigJobPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Rig History
      </div>
      {rigJobs.length === 0 ? (
        <p className="text-[11px] text-slate-600">No rig jobs yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
          {rigJobs.map((rj) => (
            <button
              key={rj.id}
              onClick={() => onSelect(rj)}
              className={[
                "text-left px-3 py-2 rounded-lg border text-[10px] transition-all font-mono",
                activeRigJobId === rj.id
                  ? "border-cyan-500/30 bg-cyan-500/5"
                  : "border-white/5 hover:border-white/10",
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-slate-400">{rj.rig_type}</span>
                <span className={statusColor(rj.status)}>{rj.status}</span>
              </div>
              <div className="text-slate-600">{rj.id.slice(0, 12)}…</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
