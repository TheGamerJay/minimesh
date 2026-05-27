import { useEffect, useState } from "react";
import { getAuditLogs, SystemAuditLog } from "../../lib/admin";

const CATEGORIES = ["auth", "generation", "normalization", "export", "delete", "worker", "repair", "thumbnail"];

const CAT_COLOR: Record<string, string> = {
  auth:          "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  generation:    "text-violet-400 bg-violet-500/10 border-violet-500/20",
  normalization: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  export:        "text-amber-400 bg-amber-500/10 border-amber-500/20",
  delete:        "text-red-400 bg-red-500/10 border-red-500/20",
  worker:        "text-slate-300 bg-slate-500/10 border-slate-500/20",
  repair:        "text-pink-400 bg-pink-500/10 border-pink-500/20",
  thumbnail:     "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

function LogRow({ entry }: { entry: SystemAuditLog }) {
  const color = CAT_COLOR[entry.category] || "text-slate-400 bg-slate-500/10 border-slate-500/20";
  const time = new Date(entry.created_at).toLocaleString();
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className={`shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded border ${color} mt-0.5`}>
        {entry.category}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono text-slate-300 truncate">{entry.action}</p>
        <p className="text-[9px] text-slate-600 truncate">{entry.message}</p>
      </div>
      <span className="text-[9px] text-slate-600 font-mono shrink-0 text-right">{time}</span>
    </div>
  );
}

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAuditLogs(150, filter || undefined)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Audit Log</h3>
        <div className="flex flex-wrap gap-1 ml-auto">
          <button
            onClick={() => setFilter("")}
            className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
              filter === "" ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-white/10 text-slate-500 hover:text-slate-300"
            }`}
          >
            all
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
                filter === c ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-white/10 text-slate-500 hover:text-slate-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto flex flex-col">
        {loading ? (
          <p className="text-slate-500 font-mono text-xs py-4 animate-pulse">Loading audit logs…</p>
        ) : logs.length === 0 ? (
          <p className="text-slate-500 font-mono text-xs py-4">No audit events{filter ? ` for category "${filter}"` : ""} recorded yet.</p>
        ) : (
          logs.map((e) => <LogRow key={e.id} entry={e} />)
        )}
      </div>
    </div>
  );
}
