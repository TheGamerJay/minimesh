import { ModelStats } from "./RealModelViewer";
import { formatFileSize } from "../../lib/assets";
import { Job } from "../../lib/jobs";
import { MODE_LABELS } from "../../lib/generation";

interface Props {
  stats: ModelStats | null;
  job: Job | null;
  glbLoaded: boolean;
  normalized: boolean;
  fileSize?: number;
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/4">
      <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{label}</span>
      <span className={["text-[11px] font-mono", accent ?? "text-slate-300"].join(" ")}>{value}</span>
    </div>
  );
}

export default function ModelStatsPanel({ stats, job, glbLoaded, normalized, fileSize }: Props) {
  if (!glbLoaded || !stats) {
    // Placeholder stats for mock preview
    return (
      <div className="p-3 space-y-0.5">
        <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">Model Statistics</div>
        <StatRow label="Source" value="Placeholder mesh" />
        <StatRow label="Meshes" value="~6" />
        <StatRow label="Materials" value="1" />
        <StatRow label="Triangles" value="~1 400" />
        <StatRow label="Format" value="Geometric" />
        {job && (
          <>
            <StatRow label="Mode" value={MODE_LABELS[job.mode] ?? job.mode} />
            <StatRow label="Provider" value={job.provider} />
          </>
        )}
        <div className="mt-2 px-2 py-1.5 rounded border border-yellow-500/15 bg-yellow-500/5">
          <p className="text-[9px] font-mono text-yellow-600">Estimated values — placeholder preview</p>
        </div>
      </div>
    );
  }

  const { x, y, z } = stats.boundingBoxSize;

  return (
    <div className="p-3 space-y-0.5">
      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">Model Statistics</div>
      <StatRow label="Source" value="Real GLB" accent="text-emerald-400" />
      <StatRow label="Meshes" value={String(stats.meshCount)} />
      <StatRow label="Materials" value={String(stats.materialCount)} />
      <StatRow
        label="Triangles"
        value={stats.triangleEstimate > 0 ? stats.triangleEstimate.toLocaleString() : "—"}
      />
      <StatRow
        label="Bounding Box"
        value={`${x} × ${y} × ${z}`}
      />
      {fileSize != null && fileSize > 0 && (
        <StatRow label="File Size" value={formatFileSize(fileSize)} />
      )}
      <StatRow label="Format" value="GLB / glTF 2.0" />
      <StatRow label="Normalized" value={normalized ? "Yes" : "No"} accent={normalized ? "text-emerald-400" : "text-slate-500"} />
      {job && (
        <>
          <StatRow label="Mode" value={MODE_LABELS[job.mode] ?? job.mode} />
          <StatRow label="Provider" value={job.provider} accent="text-emerald-400" />
        </>
      )}
    </div>
  );
}
