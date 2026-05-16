import { useState } from "react";
import ExportPanel from "../components/ExportPanel";
import MeshViewer from "../components/viewer/MeshViewer";
import ViewerInspector from "../components/viewer/ViewerInspector";
import ViewerStatusBar from "../components/viewer/ViewerStatusBar";
import ViewerToolbar from "../components/viewer/ViewerToolbar";
import ProviderStatusPanel from "../components/providers/ProviderStatusPanel";
import { Job } from "../lib/jobs";

type MaterialMode = "solid" | "wireframe" | "toon";

interface Viewer3DProps {
  job: Job | null;
  onBack: () => void;
  onOpenRigStudio?: (job: Job) => void;
}

export default function Viewer3D({ job, onBack, onOpenRigStudio }: Viewer3DProps) {
  const [materialMode, setMaterialMode] = useState<MaterialMode>("solid");
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const isMock = !job || job.provider === "mock";

  // GLB is available when Meshy has downloaded the model file
  const glbUrl = job?.glb_path
    ? `/export-packages/jobs/${job.id}/model.glb`
    : null;

  const glbLoaded = !!glbUrl && job?.model_downloaded === true;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-slate-100 overflow-hidden">
      {/* ── Header ── */}
      <header className="h-[52px] shrink-0 border-b border-white/5 px-5 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-cyan-400 transition-colors font-mono"
        >
          ← Back
        </button>
        <div className="h-4 w-px bg-white/8" />
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            M
          </div>
          <span className="font-bold tracking-tight">MiniMesh</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">3D Preview</span>
        </div>

        {/* Model source badge */}
        {job?.status === "completed" && (
          <div
            className={[
              "flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold",
              glbLoaded
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                : "border-yellow-500/20 bg-yellow-500/5 text-yellow-500/80",
            ].join(" ")}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: glbLoaded ? "#34d399" : "#f59e0b" }} />
            {glbLoaded ? "REAL MODEL" : "MOCK PREVIEW"}
          </div>
        )}

        {/* Mock warning */}
        {isMock && !job && (
          <div className="flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
            <span className="text-yellow-400 text-xs">⚠</span>
            <span className="text-[10px] font-mono text-yellow-500/80">
              Mock provider — placeholder preview
            </span>
          </div>
        )}

        {/* Provider panel toggle */}
        <button
          onClick={() => setShowProviders((v) => !v)}
          className={[
            "ml-4 text-[10px] font-mono px-2 py-1 rounded-lg border transition-all duration-150",
            showProviders
              ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/5"
              : "border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15",
          ].join(" ")}
        >
          Providers
        </button>

        {job?.status === "completed" && onOpenRigStudio && (
          <button
            onClick={() => onOpenRigStudio(job)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/40 text-violet-300 text-xs font-semibold hover:border-violet-400/60 hover:bg-violet-500/5 transition-all"
          >
            Open Rig Studio →
          </button>
        )}

        <span className={[
          "text-xs font-mono text-slate-700",
          job?.status === "completed" && onOpenRigStudio ? "" : "ml-auto",
        ].join(" ")}>
          3D Viewer — Phase 14
        </span>
      </header>

      {/* ── Provider panel (collapsible) ── */}
      {showProviders && (
        <div className="shrink-0 border-b border-white/5 bg-black/20 px-5 py-3">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">
            Provider Status
          </p>
          <ProviderStatusPanel />
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left: viewport ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ViewerToolbar
            materialMode={materialMode}
            autoRotate={autoRotate}
            showGrid={showGrid}
            showSkeleton={showSkeleton}
            onResetCamera={() => setResetTrigger((t) => t + 1)}
            onMaterialMode={setMaterialMode}
            onAutoRotateToggle={() => setAutoRotate((v) => !v)}
            onGridToggle={() => setShowGrid((v) => !v)}
            onSkeletonToggle={() => setShowSkeleton((v) => !v)}
          />

          {/* Canvas area */}
          <div className="flex-1 relative">
            <MeshViewer
              materialMode={materialMode}
              autoRotate={autoRotate}
              showGrid={showGrid}
              resetTrigger={resetTrigger}
              showSkeleton={showSkeleton}
              modelUrl={glbLoaded ? glbUrl : null}
              modelType={glbLoaded ? "glb" : null}
            />

            {/* Model label overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-white/8 bg-black/60 text-slate-600 backdrop-blur-sm">
                {glbLoaded
                  ? "Real GLB model · Meshy AI generation"
                  : "Placeholder preview mesh"}
              </span>
            </div>
          </div>

          {/* Export panel */}
          <ExportPanel job={job} />

          <ViewerStatusBar isMock={isMock} job={job} glbLoaded={glbLoaded} />
        </div>

        {/* ── Right: inspector ── */}
        <ViewerInspector job={job} materialMode={materialMode} glbLoaded={glbLoaded} />
      </div>
    </div>
  );
}
