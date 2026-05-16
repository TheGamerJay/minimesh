import { useEffect, useState } from "react";
import { Job, listJobs } from "../lib/jobs";
import { MODE_LABELS } from "../lib/generation";

const STATUS_STYLES: Record<string, string> = {
  queued: "text-yellow-400 border-yellow-500/25 bg-yellow-500/5",
  processing: "text-cyan-400 border-cyan-500/25 bg-cyan-500/5",
  completed: "text-emerald-400 border-emerald-500/25 bg-emerald-500/5",
  failed: "text-red-400 border-red-500/25 bg-red-500/5",
};

const STATUS_DOTS: Record<string, string> = {
  queued: "bg-yellow-400 animate-pulse",
  processing: "bg-cyan-400 animate-pulse",
  completed: "bg-emerald-400",
  failed: "bg-red-400",
};

export default function JobHistoryPanel({ refreshKey }: { refreshKey: number }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listJobs()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading || jobs.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Job History
      </h2>
      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="glass rounded-xl px-5 py-4 flex flex-col gap-2.5"
          >
            {/* Status row */}
            <div className="flex items-center gap-3">
              <span
                className={[
                  "flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border",
                  STATUS_STYLES[job.status] ?? STATUS_STYLES.queued,
                ].join(" ")}
              >
                <span
                  className={[
                    "w-1.5 h-1.5 rounded-full",
                    STATUS_DOTS[job.status] ?? STATUS_DOTS.queued,
                  ].join(" ")}
                />
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              <span className="text-xs text-slate-300">
                {MODE_LABELS[job.mode] ?? job.mode}
              </span>
              <span className="ml-auto text-[10px] text-slate-600 font-mono">
                {job.image_count} image{job.image_count !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-700 font-mono">
                {new Date(job.created_at).toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-slate-700">
                provider: {job.provider}
              </span>
            </div>

            {/* Result */}
            {job.status === "completed" && job.result_path && (
              <p className="text-[10px] font-mono text-emerald-600">
                Result: {job.result_path}
              </p>
            )}

            {/* Error */}
            {job.status === "failed" && job.error && (
              <p className="text-[10px] font-mono text-red-500">{job.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
