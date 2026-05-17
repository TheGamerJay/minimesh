import { useEffect, useRef, useState } from "react";
import { ThumbnailRenderJob, getThumbnailJob } from "../../lib/thumbnails";

interface Props {
  job: ThumbnailRenderJob;
  onJobUpdate: (job: ThumbnailRenderJob) => void;
}

const STATUS_STYLES: Record<string, string> = {
  queued:     "bg-gray-700/60 text-gray-400",
  processing: "bg-amber-500/15 text-amber-400",
  completed:  "bg-emerald-500/15 text-emerald-400",
  failed:     "bg-red-500/15 text-red-400",
};

export default function ThumbnailJobPanel({ job: initialJob, onJobUpdate }: Props) {
  const [job, setJob] = useState(initialJob);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function update(j: ThumbnailRenderJob) {
    setJob(j);
    onJobUpdate(j);
  }

  useEffect(() => { setJob(initialJob); }, [initialJob.id]);

  useEffect(() => {
    if (job.status === "completed" || job.status === "failed") return;
    intervalRef.current = setInterval(async () => {
      try {
        const fresh = await getThumbnailJob(job.id);
        update(fresh);
        if (fresh.status === "completed" || fresh.status === "failed") {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {}
    }, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [job.id, job.status]);

  const isRunning = job.status === "queued" || job.status === "processing";

  return (
    <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${STATUS_STYLES[job.status] ?? STATUS_STYLES.queued}`}>
          {isRunning && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1 align-middle" />
          )}
          {job.status.toUpperCase()}
        </span>

        {job.status === "completed" && (
          job.fallback ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
              FALLBACK
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400">
              BLENDER
            </span>
          )
        )}

        <span className="ml-auto text-[10px] text-gray-600 capitalize">{job.render_type}</span>
      </div>

      {job.status === "completed" && job.output_image && (
        <div className="h-28 rounded overflow-hidden bg-gray-900 flex items-center justify-center">
          <img
            src={job.output_image}
            alt="Rendered thumbnail"
            className="h-full w-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {job.status === "failed" && job.message && (
        <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 font-mono line-clamp-2">
          {job.message}
        </div>
      )}

      <div className="text-[10px] text-gray-600">
        {new Date(job.created_at).toLocaleString()}
      </div>
    </div>
  );
}
