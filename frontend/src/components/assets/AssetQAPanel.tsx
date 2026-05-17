import { useState } from "react";
import { AssetQAReport, AssetQAIssue, runAssetQA, qaStatusLabel } from "../../lib/assetQA";

interface Props {
  assetId: string;
  report: AssetQAReport | null;
  onReportUpdated: (report: AssetQAReport) => void;
}

const SEVERITY_ORDER = ["critical", "warning", "info"];

const SEVERITY_STYLE: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  warning:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  info:     "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

const STATUS_STYLE: Record<string, { ring: string; score: string; badge: string }> = {
  healthy:     { ring: "stroke-emerald-500", score: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  needs_work:  { ring: "stroke-amber-500",   score: "text-amber-400",   badge: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
  problematic: { ring: "stroke-red-500",     score: "text-red-400",     badge: "bg-red-500/10 border-red-500/30 text-red-400" },
};

function ScoreRing({ score, status }: { score: number; status: string }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.needs_work;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1f2937" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          className={style.ring}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="text-center z-10">
        <div className={`text-xl font-bold leading-none ${style.score}`}>{score}</div>
        <div className="text-[9px] text-gray-600 mt-0.5">/ 100</div>
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: AssetQAIssue }) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLE[issue.severity] ?? SEVERITY_STYLE.info;

  return (
    <div
      className="rounded-lg border border-gray-700/40 bg-gray-800/30 overflow-hidden cursor-pointer"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${style} shrink-0`}>
          {issue.severity.toUpperCase()}
        </span>
        <span className="text-xs text-gray-300 flex-1 min-w-0 truncate">{issue.title}</span>
        <svg
          className={`w-3 h-3 text-gray-500 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-gray-700/40 pt-2">
          <p className="text-[11px] text-gray-400 leading-relaxed">{issue.description}</p>
          <div className="flex items-start gap-1.5">
            <span className="text-[10px] text-violet-400 shrink-0">→</span>
            <p className="text-[10px] text-violet-300 leading-relaxed">{issue.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssetQAPanel({ assetId, report, onReportUpdated }: Props) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRunQA() {
    setRunning(true);
    setError(null);
    try {
      const r = await runAssetQA(assetId);
      onReportUpdated(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "QA failed");
    }
    setRunning(false);
  }

  const statusStyle = report ? (STATUS_STYLE[report.status] ?? STATUS_STYLE.needs_work) : null;

  const sortedIssues = report
    ? [...report.issues].sort(
        (a, b) =>
          SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
      )
    : [];

  const criticalCount = sortedIssues.filter((i) => i.severity === "critical").length;
  const warningCount = sortedIssues.filter((i) => i.severity === "warning").length;

  return (
    <div className="p-4 space-y-4">
      {/* Disclaimer */}
      <div className="rounded-lg bg-gray-800/40 border border-gray-700/30 px-3 py-2 text-[11px] text-gray-500 leading-relaxed">
        QA analysis provides guidance only. Automatic repair systems will arrive in future phases.
      </div>

      {/* Score + status */}
      {report && statusStyle && (
        <div className="flex items-center gap-3">
          <ScoreRing score={report.score} status={report.status} />
          <div className="space-y-1.5">
            <span className={`text-[11px] font-mono px-2 py-1 rounded border inline-block ${statusStyle.badge}`}>
              {qaStatusLabel(report.status)}
            </span>
            <div className="text-[10px] text-gray-500">
              {criticalCount > 0 && <span className="text-red-400">{criticalCount} critical</span>}
              {criticalCount > 0 && warningCount > 0 && <span className="text-gray-600"> · </span>}
              {warningCount > 0 && <span className="text-amber-400">{warningCount} warnings</span>}
              {criticalCount === 0 && warningCount === 0 && (
                <span className="text-gray-500">{report.issues.length} notes</span>
              )}
            </div>
            <div className="text-[10px] text-gray-600">
              {new Date(report.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Run button */}
      <button
        onClick={handleRunQA}
        disabled={running}
        className="w-full py-2 rounded bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {running ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Analyzing…
          </span>
        ) : report ? "Re-run QA Analysis" : "Run QA Analysis"}
      </button>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{error}</div>
      )}

      {!report && !running && (
        <div className="text-center text-xs text-gray-600 py-4">
          No QA report yet. Run analysis to score this asset.
        </div>
      )}

      {/* Issues */}
      {sortedIssues.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Issues ({sortedIssues.length})
          </div>
          {sortedIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {/* Strengths */}
      {report && report.strengths.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Strengths</div>
          <div className="space-y-1">
            {report.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-gray-400">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Recommendations</div>
          <div className="space-y-1">
            {report.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-gray-400">
                <span className="text-violet-400 shrink-0 mt-0.5">→</span>
                {r}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
