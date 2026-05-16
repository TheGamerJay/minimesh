import { useEffect, useRef, useState } from "react";
import { NormalizeJob, getNormalizeJob, normalizedGlbUrl } from "../../lib/normalize";

interface Props {
  job: NormalizeJob;
  onJobUpdate: (job: NormalizeJob) => void;
  onOpenNormalized?: (url: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-gray-700/60 text-gray-400",
  processing: "bg-amber-500/15 text-amber-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
};

function fmtBounds(b: Record<string, number> | undefined): string {
  if (!b || Object.keys(b).length === 0) return "—";
  return `W ${b.width?.toFixed(3) ?? "?"} · H ${b.height?.toFixed(3) ?? "?"} · D ${b.depth?.toFixed(3) ?? "?"}`;
}

export default function NormalizeJobPanel({ job: initialJob, onJobUpdate, onOpenNormalized }: Props) {
  const [job, setJob] = useState(initialJob);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function updateJob(j: NormalizeJob) {
    setJob(j);
    onJobUpdate(j);
  }

  useEffect(() => {
    setJob(initialJob);
  }, [initialJob.id]);

  useEffect(() => {
    if (job.status === "completed" || job.status === "failed") return;
    intervalRef.current = setInterval(async () => {
      try {
        const updated = await getNormalizeJob(job.id);
        updateJob(updated);
        if (updated.status === "completed" || updated.status === "failed") {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {}
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [job.id, job.status]);

  const isRunning = job.status === "queued" || job.status === "processing";
  const isComplete = job.status === "completed";

  return (
    <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-3 space-y-3">
      {/* Status header */}
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${STATUS_STYLES[job.status] ?? STATUS_STYLES.queued}`}>
          {isRunning && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1 align-middle" />}
          {job.status.toUpperCase()}
        </span>

        {isComplete && (
          <>
            {job.fallback_normalized ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                FALLBACK COPY
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400">
                BLENDER
              </span>
            )}
            <span className="text-[10px] text-gray-500 ml-auto">v{job.output_version}</span>
          </>
        )}
      </div>

      {/* Bounds info when complete */}
      {isComplete && (
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span className="text-gray-600">Original</span>
            <span className="font-mono text-[11px]">{fmtBounds(job.original_bounds)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span className="text-gray-600">Normalized</span>
            <span className="font-mono text-[11px] text-cyan-400">{fmtBounds(job.normalized_bounds)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span className="text-gray-600">Scale factor</span>
            <span className="font-mono text-[11px]">×{job.normalization_scale.toFixed(4)}</span>
          </div>
        </div>
      )}

      {/* Open in viewer */}
      {isComplete && onOpenNormalized && (
        <button
          onClick={() => onOpenNormalized(normalizedGlbUrl(job))}
          className="w-full py-1.5 rounded bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-400 text-xs font-medium transition-colors"
        >
          Open Normalized in Viewer
        </button>
      )}

      {/* Failed message */}
      {job.status === "failed" && job.message && (
        <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 font-mono line-clamp-3">
          {job.message}
        </div>
      )}

      <div className="text-[10px] text-gray-600">
        Started {new Date(job.created_at).toLocaleTimeString()}
      </div>
    </div>
  );
}
