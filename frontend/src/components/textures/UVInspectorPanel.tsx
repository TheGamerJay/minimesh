import { UVAnalysis } from "../../lib/bakes";

interface Props {
  analysis: UVAnalysis | null;
  loading: boolean;
  assetId: string | null;
}

function CoverageBar({ value }: { value: number }) {
  const color = value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-300 shrink-0 w-8 text-right">{value}%</span>
    </div>
  );
}

export default function UVInspectorPanel({ analysis, loading, assetId }: Props) {
  const readinessStatus =
    !analysis ? null
    : analysis.warnings.length === 0 ? "ready"
    : "warning";

  return (
    <div className="flex-1 min-w-0 border-r border-white/5 p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">UV Inspector</span>
        {readinessStatus === "ready" && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ready</span>
        )}
        {readinessStatus === "warning" && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Warning</span>
        )}
      </div>

      {!assetId ? (
        <p className="text-[10px] text-slate-700 font-mono">No asset selected — open from Generated Assets.</p>
      ) : loading ? (
        <p className="text-[10px] text-slate-600 font-mono">Analyzing UVs…</p>
      ) : !analysis ? (
        <p className="text-[10px] text-slate-700 font-mono">UV analysis unavailable.</p>
      ) : (
        <>
          <div className="space-y-2">
            <Row label="UV Channels" value={String(analysis.uv_channel_count)} accent={analysis.uv_channel_count > 0 ? "text-emerald-400" : "text-red-400"} />
            <Row label="Has UVs" value={analysis.has_uvs ? "Yes" : "No"} accent={analysis.has_uvs ? "text-emerald-400" : "text-red-400"} />
            <Row label="Overlapping" value={analysis.overlapping_uvs ? "Yes ⚠" : "None"} accent={analysis.overlapping_uvs ? "text-amber-400" : "text-emerald-400"} />
          </div>

          <div>
            <div className="text-[9px] font-mono text-slate-600 mb-1">UV Coverage</div>
            <CoverageBar value={analysis.estimated_uv_coverage} />
          </div>

          {analysis.warnings.length > 0 && (
            <div className="space-y-1">
              {analysis.warnings.map((w, i) => (
                <div key={i} className="flex gap-1.5 text-[9px] font-mono text-amber-600">
                  <span className="shrink-0">⚠</span><span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <div className="px-2 py-1.5 rounded border border-yellow-500/15 bg-yellow-500/5">
            <p className="text-[9px] font-mono text-yellow-600 leading-relaxed">
              Mock UV analysis — real UV extraction requires GLB parsing in a future phase.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-slate-600">{label}</span>
      <span className={["text-[10px] font-mono", accent ?? "text-slate-300"].join(" ")}>{value}</span>
    </div>
  );
}
