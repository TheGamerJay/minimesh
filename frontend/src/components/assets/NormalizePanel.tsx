import { useState } from "react";
import { NormalizeJob, runNormalize } from "../../lib/normalize";
import { GLBInspectionReport } from "../../lib/inspections";
import NormalizeJobPanel from "./NormalizeJobPanel";

interface Props {
  assetId: string;
  inspectionReport: GLBInspectionReport | null;
  jobs: NormalizeJob[];
  onJobCreated: (job: NormalizeJob) => void;
  onJobUpdate: (job: NormalizeJob) => void;
  onOpenNormalized?: (url: string) => void;
}

function BoundsRow({ label, w, h, d }: { label: string; w: number; h: number; d: number }) {
  return (
    <div className="flex items-start justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono text-gray-300 text-[11px]">
        W {w.toFixed(3)} · H {h.toFixed(3)} · D {d.toFixed(3)}
      </span>
    </div>
  );
}

export default function NormalizePanel({
  assetId,
  inspectionReport,
  jobs,
  onJobCreated,
  onJobUpdate,
  onOpenNormalized,
}: Props) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestJob = jobs[0] ?? null;
  const hasActiveJob = latestJob !== null;

  async function handleNormalize() {
    setRunning(true);
    setError(null);
    try {
      const job = await runNormalize(assetId);
      onJobCreated(job);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Normalization failed");
    }
    setRunning(false);
  }

  return (
    <div className="p-4 space-y-4">
      {/* Disclaimer */}
      <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 px-3 py-2 text-[11px] text-cyan-400/80 leading-relaxed">
        Normalization creates a non-destructive versioned copy. Original assets are preserved.
      </div>

      {/* Current bounds (from inspection) */}
      {inspectionReport && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Current Bounds</div>
          <div className="rounded bg-gray-800/40 border border-gray-700/30 px-3 py-2 space-y-1">
            <BoundsRow
              label="Size"
              w={inspectionReport.bounding_box.width}
              h={inspectionReport.bounding_box.height}
              d={inspectionReport.bounding_box.depth}
            />
          </div>
        </div>
      )}

      {/* Target scale info */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Normalization Target</div>
        <div className="rounded bg-gray-800/40 border border-gray-700/30 px-3 py-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Target size</span>
            <span className="font-mono text-gray-300">2-unit bounding cube</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Center</span>
            <span className="font-mono text-gray-300">World origin (0, 0, 0)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Method</span>
            <span className="font-mono text-gray-300">
              {latestJob?.fallback_normalized ? "Copy (fallback)" : "Blender transform + apply"}
            </span>
          </div>
        </div>
      </div>

      {/* Normalize button */}
      <button
        onClick={handleNormalize}
        disabled={running}
        className="w-full py-2 rounded bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {running ? "Starting…" : hasActiveJob ? "Re-normalize" : "Normalize Asset"}
      </button>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{error}</div>
      )}

      {/* Job history */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Normalize Jobs ({jobs.length})
          </div>
          {jobs.slice(0, 3).map((job) => (
            <NormalizeJobPanel
              key={job.id}
              job={job}
              onJobUpdate={onJobUpdate}
              onOpenNormalized={onOpenNormalized}
            />
          ))}
        </div>
      )}
    </div>
  );
}
