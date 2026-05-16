import { useState, useEffect, useCallback } from "react";
import { ProjectAudit, PipelineSummaryItem, runAudit, getLatestAudit, listAudits } from "../lib/audits";
import AuditScoreCard from "../components/audit/AuditScoreCard";
import AuditIssueList from "../components/audit/AuditIssueList";
import AuditRecommendations from "../components/audit/AuditRecommendations";
import AuditStrengthsPanel from "../components/audit/AuditStrengthsPanel";
import AuditHistoryPanel from "../components/audit/AuditHistoryPanel";

const PIPELINE_STATUS_COLOR: Record<string, string> = {
  healthy: "text-emerald-400",
  warning: "text-amber-400",
  missing: "text-slate-500",
  failed: "text-red-400",
};

const PIPELINE_STATUS_DOT: Record<string, string> = {
  healthy: "bg-emerald-400",
  warning: "bg-amber-400",
  missing: "bg-slate-600",
  failed: "bg-red-400",
};

function PipelineSummaryBar({ items }: { items: PipelineSummaryItem[] }) {
  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-3">
      <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Pipeline Health
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.category}
            className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 flex flex-col gap-1"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${PIPELINE_STATUS_DOT[item.status]}`}
              />
              <span className="text-xs font-semibold text-slate-200">{item.category}</span>
            </div>
            <span className={`text-xs font-mono ${PIPELINE_STATUS_COLOR[item.status]}`}>
              {item.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QualityDashboard({ onBack }: { onBack: () => void }) {
  const [audit, setAudit] = useState<ProjectAudit | null>(null);
  const [history, setHistory] = useState<ProjectAudit[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const all = await listAudits();
      setHistory(all);
    } catch {
      // history is non-critical
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingLatest(true);
      try {
        const latest = await getLatestAudit();
        if (latest) {
          setAudit(latest);
          setHistory(await listAudits());
        }
      } catch {
        // no audit yet
      } finally {
        setLoadingLatest(false);
      }
    })();
  }, []);

  async function handleRunAudit() {
    setRunning(true);
    setError(null);
    try {
      const result = await runAudit();
      setAudit(result);
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm font-mono"
          >
            ← Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-violet-400 text-lg">◈</span>
            <span className="font-semibold text-slate-100">Quality Checker</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-violet-500/30 text-violet-400 bg-violet-500/5">
            Phase 10 — Audit Engine
          </span>
          <button
            onClick={handleRunAudit}
            disabled={running}
            className={[
              "text-sm px-4 py-1.5 rounded-lg border transition-all duration-150 font-semibold",
              running
                ? "border-slate-700 text-slate-600 cursor-not-allowed"
                : "border-cyan-500/40 text-cyan-400 hover:border-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/5",
            ].join(" ")}
          >
            {running ? "Running..." : "Run Audit"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loadingLatest && !audit && (
            <div className="glass rounded-xl p-10 flex items-center justify-center">
              <span className="text-slate-500 font-mono text-sm animate-pulse">
                Loading audit data...
              </span>
            </div>
          )}

          {/* Empty state */}
          {!loadingLatest && !audit && (
            <div className="glass rounded-xl p-12 flex flex-col items-center gap-4 text-center">
              <span className="text-4xl text-slate-700">◈</span>
              <div>
                <p className="text-slate-300 font-semibold">No audits yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Run an audit to analyze your pipeline health and get repair suggestions.
                </p>
              </div>
              <button
                onClick={handleRunAudit}
                disabled={running}
                className="mt-2 text-sm px-5 py-2 rounded-lg border border-cyan-500/40 text-cyan-400 hover:border-cyan-400/70 hover:bg-cyan-500/5 transition-all duration-150 font-semibold"
              >
                {running ? "Running..." : "Run First Audit"}
              </button>
            </div>
          )}

          {/* Audit results */}
          {audit && (
            <>
              <AuditScoreCard audit={audit} />
              <PipelineSummaryBar items={audit.pipeline_summary} />
              <AuditIssueList issues={audit.issues} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <AuditStrengthsPanel strengths={audit.strengths} />
                <AuditRecommendations recommendations={audit.recommendations} />
              </div>
              <AuditHistoryPanel audits={history} currentId={audit.id} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
