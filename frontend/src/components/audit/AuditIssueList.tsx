import { useState } from "react";
import { AuditIssue, AuditSeverity } from "../../lib/audits";

const SEV_ORDER: AuditSeverity[] = ["critical", "warning", "info"];

const SEV_COLOR: Record<AuditSeverity, string> = {
  critical: "text-red-400 border-red-500/30 bg-red-500/5",
  warning: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  info: "text-sky-400 border-sky-500/30 bg-sky-500/5",
};

const SEV_DOT: Record<AuditSeverity, string> = {
  critical: "bg-red-400",
  warning: "bg-amber-400",
  info: "bg-sky-400",
};

const SEV_LABEL: Record<AuditSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

function IssueRow({ issue }: { issue: AuditIssue }) {
  const [open, setOpen] = useState(false);
  const sev = issue.severity as AuditSeverity;

  return (
    <div
      className={`rounded-lg border px-4 py-3 cursor-pointer select-none transition-all duration-150 ${SEV_COLOR[sev]}`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${SEV_DOT[sev]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{issue.title}</span>
            <span className="text-xs font-mono opacity-60 capitalize">{issue.category}</span>
          </div>
          {open && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-300 leading-relaxed">{issue.description}</p>
              <p className="text-xs text-slate-400 italic leading-relaxed">
                → {issue.suggestion}
              </p>
            </div>
          )}
        </div>
        <span className="text-slate-600 text-xs mt-0.5 flex-shrink-0">{open ? "▲" : "▼"}</span>
      </div>
    </div>
  );
}

export default function AuditIssueList({ issues }: { issues: AuditIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <p className="text-emerald-400 font-semibold">No issues found</p>
        <p className="text-xs text-slate-500 mt-1">Pipeline is clean across all checks.</p>
      </div>
    );
  }

  const grouped = SEV_ORDER.map((sev) => ({
    sev,
    items: issues.filter((i) => i.severity === sev),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-5">
      <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Issues</h3>
      {grouped.map(({ sev, items }) => (
        <div key={sev} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold ${SEV_COLOR[sev].split(" ")[0]}`}>
              {SEV_LABEL[sev]}
            </span>
            <span className="text-xs text-slate-600">({items.length})</span>
          </div>
          {items.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>
      ))}
    </div>
  );
}
