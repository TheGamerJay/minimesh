import { useState, useEffect, useCallback } from "react";
import { ProjectAudit, PipelineSummaryItem, runAudit, getLatestAudit, listAudits } from "../lib/audits";
import { listAssets, GeneratedAsset } from "../lib/assets";
import { getAssetQA, AssetQAReport } from "../lib/assetQA";
import AssetHealthBadge from "../components/assets/AssetHealthBadge";
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

interface AssetQASummary {
  asset: GeneratedAsset;
  report: AssetQAReport | null;
}

function AssetQAOverview({ summaries }: { summaries: AssetQASummary[] }) {
  const problematic = summaries.filter((s) => s.report?.status === "problematic");
  const needsWork = summaries.filter((s) => s.report?.status === "needs_work");
  const healthy = summaries.filter((s) => s.report?.status === "healthy");
  const unanalyzed = summaries.filter((s) => !s.report);

  const allRecs: string[] = [];
  const seen = new Set<string>();
  for (const s of summaries) {
    if (!s.report) continue;
    for (const r of s.report.recommendations) {
      if (!seen.has(r)) { seen.add(r); allRecs.push(r); }
    }
  }

  if (summaries.length === 0) return null;

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Asset QA Overview</h3>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          {problematic.length > 0 && <span className="text-red-400">{problematic.length} problematic</span>}
          {needsWork.length > 0 && <span className="text-amber-400">{needsWork.length} needs work</span>}
          {healthy.length > 0 && <span className="text-emerald-400">{healthy.length} healthy</span>}
          {unanalyzed.length > 0 && <span className="text-slate-600">{unanalyzed.length} unanalyzed</span>}
        </div>
      </div>

      {/* Asset rows — prioritize problematic first */}
      <div className="flex flex-col gap-2">
        {[...problematic, ...needsWork, ...healthy, ...unanalyzed].map(({ asset, report }) => (
          <div
            key={asset.id}
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-200 font-medium truncate">{asset.name}</div>
              <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                {asset.asset_type.toUpperCase()} · {asset.provider}
              </div>
            </div>
            {report ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-sm font-bold ${
                  report.status === "healthy" ? "text-emerald-400" :
                  report.status === "problematic" ? "text-red-400" : "text-amber-400"
                }`}>{report.score}</span>
                <AssetHealthBadge status={report.status} score={report.score} size="xs" />
              </div>
            ) : (
              <span className="text-[10px] font-mono text-slate-600 shrink-0">not analyzed</span>
            )}
          </div>
        ))}
      </div>

      {/* Consolidated recommendations */}
      {allRecs.length > 0 && (
        <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Consolidated Repair Recommendations
          </div>
          <div className="flex flex-col gap-1">
            {allRecs.slice(0, 8).map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
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

export default function QualityDashboard({ onBack }: { onBack: () => void }) {
  const [audit, setAudit] = useState<ProjectAudit | null>(null);
  const [history, setHistory] = useState<ProjectAudit[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [assetQaSummaries, setAssetQaSummaries] = useState<AssetQASummary[]>([]);

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

    // Load asset QA summaries independently
    (async () => {
      try {
        const assets = await listAssets();
        const summaries = await Promise.all(
          assets.map(async (asset) => ({
            asset,
            report: await getAssetQA(asset.id).catch(() => null),
          }))
        );
        setAssetQaSummaries(summaries);
      } catch {
        // non-critical
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

          {/* Asset QA Overview — always shown when data is available */}
          <AssetQAOverview summaries={assetQaSummaries} />

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
