import { useEffect, useState } from "react";
import {
  ExportManifest,
  createExport,
  downloadExport,
  getJobExports,
} from "../lib/exports";
import { Job } from "../lib/jobs";
import { isCreditError } from "../lib/credits";
import { useCredits } from "../lib/creditContext";
import InsufficientCreditsModal from "./credits/InsufficientCreditsModal";

interface ExportPanelProps {
  job: Job | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportPanel({ job }: ExportPanelProps) {
  const { refresh: refreshCredits } = useCredits();
  const [exports, setExports] = useState<ExportManifest[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creditErrorMsg, setCreditErrorMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isCompleted = job?.status === "completed";
  const isMock = !job || job.provider === "mock";

  useEffect(() => {
    if (job?.id) {
      getJobExports(job.id)
        .then(setExports)
        .catch(() => {});
    }
  }, [job?.id]);

  async function handleCreate() {
    if (!job) return;
    setCreateError(null);
    setIsCreating(true);
    try {
      const manifest = await createExport(job.id);
      refreshCredits();
      setExports((prev) => [manifest, ...prev]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      if (isCreditError(msg)) {
        setCreditErrorMsg(msg);
      } else {
        setCreateError(msg);
      }
    } finally {
      setIsCreating(false);
    }
  }

  function handleDownload(exportId: string) {
    setDownloadingId(exportId);
    downloadExport(exportId);
    setTimeout(() => setDownloadingId(null), 2000);
  }

  const zipFile = (manifest: ExportManifest) =>
    manifest.files.find((f) => f.type === "zip_bundle");

  return (
    <div className="shrink-0 border-t border-white/5 bg-black/25 flex flex-col">
      {creditErrorMsg && (
        <InsufficientCreditsModal
          message={creditErrorMsg}
          onClose={() => { setCreditErrorMsg(null); refreshCredits(); }}
        />
      )}
      {/* ── Header row ── */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Exports
          </h3>
          {exports.length > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800 text-slate-600">
              {exports.length}
            </span>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={!isCompleted || isCreating}
          className={[
            "text-[11px] font-mono px-3 py-1 rounded-lg border transition-all duration-150",
            isCompleted && !isCreating
              ? "border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/5 cursor-pointer"
              : "border-slate-800 text-slate-700 cursor-not-allowed",
          ].join(" ")}
        >
          {isCreating ? "Creating…" : (
            <span className="flex items-center gap-1.5">
              Create Export Package
              <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-cyan-500/20 text-cyan-500/60">5 cr</span>
            </span>
          )}
        </button>
      </div>

      {/* ── Mock notice ── */}
      {isMock && isCompleted && (
        <div className="mx-4 mb-2 px-2.5 py-1.5 rounded-lg border border-yellow-500/15 bg-yellow-500/5">
          <p className="text-[9px] font-mono text-yellow-600 leading-relaxed">
            Placeholder export package generated. Real GLB / FBX / OBJ exports will arrive in future phases.
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {createError && (
        <p className="mx-4 mb-2 text-[10px] font-mono text-red-400">{createError}</p>
      )}

      {/* ── Export list ── */}
      <div className="overflow-y-auto max-h-44 px-4 pb-3 flex flex-col gap-2">
        {exports.length === 0 ? (
          <p className="text-[10px] font-mono text-slate-700 py-1">
            {isCompleted
              ? "No exports generated yet."
              : "Complete a job to enable exports."}
          </p>
        ) : (
          exports.map((exp) => {
            const zip = zipFile(exp);
            const isDownloading = downloadingId === exp.export_id;

            return (
              <div
                key={exp.export_id}
                className="glass rounded-lg px-3 py-2.5 flex items-center gap-3"
              >
                {/* Info */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-slate-300">
                    {exp.export_type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-slate-600">
                      {exp.files.length} files
                    </span>
                    {zip && (
                      <span className="text-[9px] font-mono text-slate-600">
                        {formatBytes(zip.size)}
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-700">
                      {new Date(exp.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Download */}
                <button
                  onClick={() => handleDownload(exp.export_id)}
                  disabled={isDownloading}
                  className={[
                    "shrink-0 text-[10px] font-mono px-2.5 py-1 rounded border transition-all duration-150",
                    isDownloading
                      ? "border-slate-800 text-slate-600"
                      : "border-emerald-500/30 text-emerald-400 hover:border-emerald-400/60 hover:bg-emerald-500/5 cursor-pointer",
                  ].join(" ")}
                >
                  {isDownloading ? "…" : "⬇ ZIP"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
