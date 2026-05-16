import { ProjectAudit, AuditSeverity } from "../../lib/audits";

const STATUS_LABEL: Record<string, string> = {
  production_ready: "Production Ready",
  needs_attention: "Needs Attention",
  unhealthy: "Unhealthy",
};

const STATUS_COLOR: Record<string, string> = {
  production_ready: "text-emerald-400",
  needs_attention: "text-amber-400",
  unhealthy: "text-red-400",
};

const STATUS_RING: Record<string, string> = {
  production_ready: "#34d399",
  needs_attention: "#fbbf24",
  unhealthy: "#f87171",
};

const SEVERITY_CONFIG: { key: AuditSeverity; label: string; color: string }[] = [
  { key: "critical", label: "Critical", color: "text-red-400" },
  { key: "warning", label: "Warnings", color: "text-amber-400" },
  { key: "info", label: "Info", color: "text-sky-400" },
];

const R = 52;
const CIRC = 2 * Math.PI * R;

export default function AuditScoreCard({ audit }: { audit: ProjectAudit }) {
  const dash = (audit.score / 100) * CIRC;
  const color = STATUS_RING[audit.status];

  const counts = { critical: 0, warning: 0, info: 0 } as Record<AuditSeverity, number>;
  for (const issue of audit.issues) {
    counts[issue.severity as AuditSeverity] = (counts[issue.severity as AuditSeverity] ?? 0) + 1;
  }

  return (
    <div className="glass rounded-xl p-6 flex flex-col sm:flex-row items-center gap-8">
      {/* Circular score */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg width="136" height="136" className="-rotate-90">
          <circle cx="68" cy="68" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="68"
            cy="68"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black tabular-nums" style={{ color }}>
            {audit.score}
          </span>
          <span className="text-xs text-slate-500 font-mono mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Status + breakdown */}
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <p className={`text-xl font-bold ${STATUS_COLOR[audit.status]}`}>
            {STATUS_LABEL[audit.status]}
          </p>
          <p className="text-xs text-slate-500 font-mono mt-1">
            {new Date(audit.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-6">
          {SEVERITY_CONFIG.map(({ key, label, color: c }) => (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <span className={`text-2xl font-black tabular-nums ${c}`}>{counts[key]}</span>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
