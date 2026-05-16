import { ProjectAudit } from "../../lib/audits";

const STATUS_COLOR: Record<string, string> = {
  production_ready: "text-emerald-400",
  needs_attention: "text-amber-400",
  unhealthy: "text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  production_ready: "Production Ready",
  needs_attention: "Needs Attention",
  unhealthy: "Unhealthy",
};

export default function AuditHistoryPanel({
  audits,
  currentId,
}: {
  audits: ProjectAudit[];
  currentId: string;
}) {
  if (audits.length === 0) return null;

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4">
      <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Audit History
      </h3>
      <div className="flex flex-col gap-2">
        {audits.map((a) => (
          <div
            key={a.id}
            className={[
              "rounded-lg px-4 py-2.5 flex items-center justify-between border transition-colors",
              a.id === currentId
                ? "border-cyan-500/30 bg-cyan-500/5"
                : "border-white/5 bg-white/[0.02]",
            ].join(" ")}
          >
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-semibold tabular-nums ${STATUS_COLOR[a.status]}`}>
                {a.score} — {STATUS_LABEL[a.status]}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(a.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-red-400 font-mono">
                {a.issues.filter((i) => i.severity === "critical").length} crit
              </span>
              <span className="text-xs text-amber-400 font-mono">
                {a.issues.filter((i) => i.severity === "warning").length} warn
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
