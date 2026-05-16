import { useState } from "react";
import { GLBInspectionReport, runInspection } from "../../lib/inspections";

interface Props {
  assetId: string;
  report: GLBInspectionReport | null;
  onRefresh: (report: GLBInspectionReport) => void;
}

function fmt(n: number): string {
  return n.toLocaleString();
}

function fmtBytes(n: number): string {
  if (n === 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function BoolBadge({ value, trueLabel = "Yes", falseLabel = "No" }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${value ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-700/60 text-gray-500"}`}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

export default function InspectionPanel({ assetId, report, onRefresh }: Props) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const r = await runInspection(assetId);
      onRefresh(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Inspection failed");
    }
    setRunning(false);
  }

  if (!report) {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-4 text-center">
          <div className="text-xs text-gray-500 mb-3">No inspection report yet. Run inspection to extract real mesh metadata.</div>
          <button
            onClick={handleRun}
            disabled={running}
            className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {running ? "Inspecting…" : "Run Inspection"}
          </button>
        </div>
        {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{error}</div>}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Source badge */}
      <div className="flex items-center gap-2">
        {report.fallback_estimate ? (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
            FALLBACK ESTIMATE
          </span>
        ) : (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400">
            REAL — Blender {report.blender_version}
          </span>
        )}
        <button
          onClick={handleRun}
          disabled={running}
          className="ml-auto text-[10px] px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-50"
        >
          {running ? "…" : "Re-inspect"}
        </button>
      </div>

      {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{error}</div>}

      {/* Mesh stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Objects", fmt(report.object_count)],
          ["Meshes", fmt(report.mesh_count)],
          ["Triangles", fmt(report.estimated_triangles)],
          ["Materials", fmt(report.material_count)],
          ["File Size", fmtBytes(report.file_size)],
        ].map(([label, value]) => (
          <div key={label} className="rounded bg-gray-800/40 border border-gray-700/30 px-3 py-2">
            <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
            <div className="text-sm font-mono text-gray-200">{value}</div>
          </div>
        ))}
      </div>

      {/* Boolean flags */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Features</div>
        <div className="flex flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>UVs</span>
            <BoolBadge value={report.has_uvs} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Armature</span>
            <BoolBadge value={report.has_armature} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Animations</span>
            <BoolBadge value={report.has_animations} />
          </div>
        </div>
      </div>

      {/* Bounding box */}
      <div>
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bounding Box</div>
        <div className="rounded bg-gray-800/40 border border-gray-700/30 px-3 py-2 text-xs font-mono text-gray-300 space-y-0.5">
          <div>W <span className="text-gray-100">{report.bounding_box.width.toFixed(3)}</span></div>
          <div>H <span className="text-gray-100">{report.bounding_box.height.toFixed(3)}</span></div>
          <div>D <span className="text-gray-100">{report.bounding_box.depth.toFixed(3)}</span></div>
        </div>
      </div>

      {/* Object names */}
      {report.object_names.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Objects ({report.object_names.length})
          </div>
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {report.object_names.map((n) => (
              <div key={n} className="text-xs font-mono text-gray-400 bg-gray-800/30 rounded px-2 py-0.5 truncate">{n}</div>
            ))}
          </div>
        </div>
      )}

      {/* Material names */}
      {report.material_names.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Materials ({report.material_names.length})
          </div>
          <div className="space-y-0.5 max-h-20 overflow-y-auto">
            {report.material_names.map((n) => (
              <div key={n} className="text-xs font-mono text-gray-400 bg-gray-800/30 rounded px-2 py-0.5 truncate">{n}</div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-600">
        Generated {new Date(report.generated_at).toLocaleString()}
      </div>
    </div>
  );
}
