import { useState } from "react";
import { BakeJob, BAKE_TYPES, createBakeJob, getBakeJob } from "../../lib/bakes";

interface Props {
  assetId: string | null;
  jobs: BakeJob[];
  onJobCreated: (job: BakeJob) => void;
  onJobUpdated: (job: BakeJob) => void;
}

const STATUS_COLORS: Record<string, string> = {
  queued:     "text-yellow-500",
  processing: "text-cyan-400",
  completed:  "text-emerald-400",
  failed:     "text-red-400",
};

export default function BakeJobPanel({ assetId, jobs, onJobCreated, onJobUpdated }: Props) {
  const [bakeType, setBakeType] = useState("full_pbr");
  const [creating, setCreating] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!assetId) { setError("No asset selected — open a job or select an asset first."); return; }
    setCreating(true);
    setError(null);
    try {
      const job = await createBakeJob(assetId, bakeType);
      onJobCreated(job);
      startPolling(job.id);
    } catch (e: any) {
      setError(e.message ?? "Failed to create bake job");
    }
    setCreating(false);
  }

  function startPolling(jobId: string) {
    setPollingId(jobId);
    const interval = setInterval(async () => {
      try {
        const updated = await getBakeJob(jobId);
        onJobUpdated(updated);
        if (updated.status === "completed" || updated.status === "failed") {
          clearInterval(interval);
          setPollingId(null);
        }
      } catch {
        clearInterval(interval);
        setPollingId(null);
      }
    }, 2000);
  }

  return (
    <div className="flex-1 min-w-0 p-3 space-y-3 overflow-y-auto">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Bake Jobs</span>

      {/* Create */}
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          <select
            value={bakeType}
            onChange={(e) => setBakeType(e.target.value)}
            className="flex-1 bg-gray-800/60 border border-gray-700/40 rounded px-2 py-1 text-[10px] text-gray-300 outline-none"
          >
            {BAKE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={creating || !!pollingId || !assetId}
            className={[
              "px-2.5 py-1 rounded text-[10px] font-medium transition-colors",
              creating || pollingId
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : assetId
                ? "bg-violet-600 hover:bg-violet-500 text-white"
                : "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700/30",
            ].join(" ")}
          >
            {creating ? "…" : "Bake Preview"}
          </button>
        </div>
        {error && <p className="text-[9px] font-mono text-red-400">{error}</p>}
        <p className="text-[9px] font-mono text-slate-700 leading-relaxed">
          Mock bake provider active — real baking arrives in a future phase.
        </p>
      </div>

      {/* Job list */}
      {jobs.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {jobs.map((job) => (
            <div key={job.id} className="rounded border border-gray-700/30 bg-gray-800/20 p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-400 uppercase">{job.bake_type.replace("_", " ")}</span>
                <span className={["text-[9px] font-mono capitalize", STATUS_COLORS[job.status] ?? "text-slate-500"].join(" ")}>
                  {job.status}
                </span>
              </div>
              {job.status === "processing" && (
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                </div>
              )}
              {job.status === "completed" && job.output_maps.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {job.output_maps.map((m) => (
                    <span key={m} className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {m}
                    </span>
                  ))}
                </div>
              )}
              {job.message && (
                <p className="text-[9px] font-mono text-slate-600 truncate">{job.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
