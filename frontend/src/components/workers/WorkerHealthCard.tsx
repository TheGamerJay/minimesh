import { WorkerHealth } from "../../lib/workers";

interface Props {
  health: WorkerHealth | null;
  loading: boolean;
  onRefresh: () => void;
}

type OverallStatus = "healthy" | "degraded" | "offline";

const STATUS_STYLES: Record<OverallStatus, string> = {
  healthy:  "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  degraded: "text-amber-400  border-amber-500/30  bg-amber-500/5",
  offline:  "text-red-400    border-red-500/30    bg-red-500/5",
};

function overallStatus(health: WorkerHealth | null): OverallStatus {
  if (!health || !health.worker_online) return "offline";
  if (health.active_tasks > 0 || health.queue_size > 0) return "degraded";
  return "healthy";
}

export default function WorkerHealthCard({ health, loading, onRefresh }: Props) {
  const status = overallStatus(health);

  return (
    <div className="p-3 border-b border-white/5 shrink-0">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Worker Health
        </span>
        <div className="flex items-center gap-2">
          <span className={["text-[9px] font-mono px-1.5 py-0.5 rounded border capitalize", STATUS_STYLES[status]].join(" ")}>
            {status}
          </span>
          <button
            onClick={onRefresh}
            className="text-[9px] font-mono text-slate-600 hover:text-slate-400 transition-colors"
          >
            ↻
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-[10px] font-mono text-slate-600">Checking…</p>
      ) : !health ? (
        <p className="text-[10px] font-mono text-red-500/70">Worker unreachable</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <Row label="Online"  value={health.worker_online ? "Yes" : "No"} good={health.worker_online} />
          <Row label="Mode"    value={health.blender_mode === "real" ? "Blender" : "Mock"} good={health.blender_mode === "real"} />
          <Row label="Queue"   value={String(health.queue_size)}  good={health.queue_size === 0} />
          <Row label="Active"  value={String(health.active_tasks)} good={health.active_tasks === 0} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-slate-600">{label}</span>
      <span className={["text-[9px] font-mono", good ? "text-emerald-400" : "text-amber-400"].join(" ")}>
        {value}
      </span>
    </div>
  );
}
