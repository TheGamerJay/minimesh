import { useState, useEffect, useCallback } from "react";
import { RepairPlan, RepairAction, getRepairPlan, runRepairAction } from "../../lib/repair";
import { qaStatusLabel } from "../../lib/assetQA";

interface Props {
  assetId: string;
  onNavigateTextureStudio: () => void;
  onNavigateExportManager: () => void;
  onRepairComplete: () => void;
}

const ACTION_ICONS: Record<string, string> = {
  run_inspection:      "◎",
  run_normalize:       "⊡",
  render_thumbnail:    "▣",
  open_texture_studio: "⊞",
  build_export_package:"⊟",
  run_qa:              "◈",
};

const STATUS_BADGE: Record<string, string> = {
  triggered:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  navigation: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  failed:     "text-red-400 bg-red-500/10 border-red-500/20",
};

function ActionCard({
  action,
  onRun,
  running,
  result,
}: {
  action: RepairAction;
  onRun: () => void;
  running: boolean;
  result: string | null;
}) {
  const isNav = action.navigation;

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <span className="text-slate-500 font-mono text-base leading-none mt-0.5 shrink-0">
          {ACTION_ICONS[action.action_type] ?? "›"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-200">{action.label}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{action.description}</div>
          {action.issue_ids.length > 0 && (
            <div className="text-[10px] text-violet-400/70 mt-1 font-mono">
              fixes {action.issue_ids.length} issue{action.issue_ids.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={running}
          className={[
            "flex-1 py-1.5 rounded text-xs font-semibold transition-colors",
            isNav
              ? "border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/5 disabled:opacity-50"
              : "border border-violet-500/30 text-violet-300 hover:bg-violet-500/5 disabled:opacity-50",
          ].join(" ")}
        >
          {running ? (
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              Running…
            </span>
          ) : (
            action.label
          )}
        </button>

        {result && (
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${STATUS_BADGE[result] ?? STATUS_BADGE.failed}`}>
            {result === "triggered" ? "DONE" : result === "navigation" ? "OPEN" : "ERR"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RepairPlanPanel({
  assetId,
  onNavigateTextureStudio,
  onNavigateExportManager,
  onRepairComplete,
}: Props) {
  const [plan, setPlan] = useState<RepairPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getRepairPlan(assetId);
      setPlan(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  async function handleRun(action: RepairAction) {
    if (action.action_type === "open_texture_studio") {
      setResults((r) => ({ ...r, open_texture_studio: "navigation" }));
      onNavigateTextureStudio();
      return;
    }
    if (action.action_type === "build_export_package") {
      setResults((r) => ({ ...r, build_export_package: "navigation" }));
      onNavigateExportManager();
      return;
    }

    setRunningAction(action.action_type);
    try {
      const res = await runRepairAction(assetId, action.action_type);
      setResults((r) => ({ ...r, [action.action_type]: res.status }));
      if (action.action_type === "run_qa") {
        onRepairComplete();
        await loadPlan();
      }
    } catch {
      setResults((r) => ({ ...r, [action.action_type]: "failed" }));
    } finally {
      setRunningAction(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-[11px] font-mono text-slate-600 animate-pulse">
        Building repair plan…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded m-4">
        {error}
      </div>
    );
  }

  if (!plan) return null;

  const scoreColor =
    plan.qa_status === "healthy" ? "text-emerald-400" :
    plan.qa_status === "problematic" ? "text-red-400" : "text-amber-400";

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Disclaimer */}
      <div className="rounded-lg bg-gray-800/40 border border-gray-700/30 px-3 py-2 text-[11px] text-gray-500 leading-relaxed">
        Guided repair only. No mesh edits are performed automatically. Click each action to apply individually.
      </div>

      {/* Current QA status */}
      {plan.qa_score !== null && plan.qa_status && (
        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{plan.qa_score}</span>
          <div>
            <div className={`text-[10px] font-mono font-bold ${scoreColor}`}>
              {qaStatusLabel(plan.qa_status)}
            </div>
            <div className="text-[10px] text-slate-600">current QA score / 100</div>
          </div>
          <button
            onClick={loadPlan}
            className="ml-auto text-[10px] font-mono text-slate-600 hover:text-slate-400 transition-colors"
          >
            ↺ refresh
          </button>
        </div>
      )}

      {/* No QA report yet */}
      {plan.qa_score === null && (
        <div className="text-[11px] text-slate-600 text-center py-2">
          No QA report yet — run "Run QA Again" to generate one.
        </div>
      )}

      {/* Action cards */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Repair Actions ({plan.actions.length})
        </div>
        {plan.actions.map((action) => (
          <ActionCard
            key={action.action_type}
            action={action}
            onRun={() => handleRun(action)}
            running={runningAction === action.action_type}
            result={results[action.action_type] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
