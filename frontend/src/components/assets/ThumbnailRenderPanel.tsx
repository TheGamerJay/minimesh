import { useState } from "react";
import { ThumbnailRenderJob, renderThumbnail, RENDER_TYPES } from "../../lib/thumbnails";
import ThumbnailJobPanel from "./ThumbnailJobPanel";
import { GeneratedAsset } from "../../lib/assets";

interface Props {
  asset: GeneratedAsset;
  jobs: ThumbnailRenderJob[];
  onJobCreated: (job: ThumbnailRenderJob) => void;
  onJobUpdate: (job: ThumbnailRenderJob) => void;
}

export default function ThumbnailRenderPanel({ asset, jobs, onJobCreated, onJobUpdate }: Props) {
  const [renderType, setRenderType] = useState<string>("preview");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentThumbnail = asset.thumbnail || asset.preview_image;

  async function handleRender() {
    setRunning(true);
    setError(null);
    try {
      const job = await renderThumbnail(asset.id, renderType);
      onJobCreated(job);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Render failed");
    }
    setRunning(false);
  }

  return (
    <div className="p-4 space-y-4">
      {/* Disclaimer */}
      <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 px-3 py-2 text-[11px] text-violet-400/80 leading-relaxed">
        Rendered thumbnails use Blender preview rendering. Full cinematic rendering workflows will arrive in future phases.
      </div>

      {/* Current thumbnail */}
      {currentThumbnail && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Current Thumbnail</div>
          <div className="h-32 rounded-lg overflow-hidden bg-gray-900 border border-gray-700/40 flex items-center justify-center">
            <img
              src={currentThumbnail}
              alt={asset.name}
              className="h-full w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </div>
      )}

      {/* Render type selector */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Render Type</div>
        <div className="space-y-1">
          {RENDER_TYPES.map((rt) => (
            <button
              key={rt.value}
              onClick={() => setRenderType(rt.value)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                renderType === rt.value
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                  : "border-gray-700/40 bg-gray-800/30 text-gray-400 hover:text-gray-300 hover:border-gray-600"
              }`}
            >
              <div className="font-medium">{rt.label}</div>
              <div className="text-[10px] opacity-60">{rt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Render button */}
      <button
        onClick={handleRender}
        disabled={running}
        className="w-full py-2 rounded bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {running ? "Starting render…" : jobs.length > 0 ? "Re-render Thumbnail" : "Render Thumbnail"}
      </button>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{error}</div>
      )}

      {/* Job history */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Render Jobs ({jobs.length})
          </div>
          {jobs.slice(0, 4).map((job) => (
            <ThumbnailJobPanel
              key={job.id}
              job={job}
              onJobUpdate={onJobUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
