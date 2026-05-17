import { useState, useRef, useCallback } from "react";
import ExportPanel from "../components/ExportPanel";
import MeshViewer from "../components/viewer/MeshViewer";
import { captureViewerThumbnail } from "../lib/thumbnails";
import ModelStatsPanel from "../components/viewer/ModelStatsPanel";
import ViewerInspector from "../components/viewer/ViewerInspector";
import ViewerSettingsPanel from "../components/viewer/ViewerSettingsPanel";
import ViewerStatusBar from "../components/viewer/ViewerStatusBar";
import ViewerToolbar from "../components/viewer/ViewerToolbar";
import ProviderStatusPanel from "../components/providers/ProviderStatusPanel";
import { ModelStats } from "../components/viewer/RealModelViewer";
import { EnvironmentPreset } from "../lib/viewerEnvironments";
import { Job } from "../lib/jobs";

type MaterialMode = "solid" | "wireframe" | "toon";

interface Viewer3DProps {
  job: Job | null;
  onBack: () => void;
  onOpenRigStudio?: (job: Job) => void;
  overrideGlbUrl?: string | null;
  versionLabel?: string | null;
}

export default function Viewer3D({ job, onBack, onOpenRigStudio, overrideGlbUrl, versionLabel }: Viewer3DProps) {
  // Existing state
  const [materialMode, setMaterialMode] = useState<MaterialMode>("solid");
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Phase 17 state
  const [environment, setEnvironment] = useState<EnvironmentPreset>("studio_dark");
  const [exposure, setExposure] = useState(1.0);
  const [turntableActive, setTurntableActive] = useState(false);
  const [turntableSpeed, setTurntableSpeed] = useState(1.2);
  const [cameraPreset, setCameraPreset] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);
  const [glbNormalized, setGlbNormalized] = useState(false);
  const [glbError, setGlbError] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const screenshotRef = useRef<(() => void) | null>(null);
  const captureRef = useRef<(() => string) | null>(null);
  const [capturingThumb, setCapturingThumb] = useState(false);

  const isMock = !overrideGlbUrl && (!job || job.provider === "mock");
  const glbUrl = overrideGlbUrl ?? (job?.glb_path ? `/export-packages/jobs/${job.id}/model.glb` : null);
  const glbLoaded = !glbError && !!glbUrl && (overrideGlbUrl ? true : job?.model_downloaded === true);

  const handleModelStats = useCallback((stats: ModelStats) => {
    setModelStats(stats);
  }, []);

  const handleGlbNormalized = useCallback(() => {
    setGlbNormalized(true);
  }, []);

  const handleGlbError = useCallback(() => {
    setGlbError(true);
  }, []);

  const handleCameraPreset = useCallback((preset: string) => {
    setCameraPreset(preset);
  }, []);

  const handleCameraPresetDone = useCallback(() => {
    setCameraPreset(null);
  }, []);

  async function handleCaptureAsThumbnail() {
    const assetId = job?.asset_id;
    if (!assetId || !captureRef.current) return;
    setCapturingThumb(true);
    try {
      const dataUrl = captureRef.current();
      await captureViewerThumbnail(assetId, dataUrl);
    } catch {
      // silently fail — thumbnail capture is non-critical
    }
    setCapturingThumb(false);
  }

  // State badges row
  const badges: { label: string; color: string }[] = [];
  if (glbLoaded && !glbError) badges.push({ label: "REAL MODEL", color: "emerald" });
  else if (glbError) badges.push({ label: "FALLBACK PREVIEW", color: "red" });
  else badges.push({ label: "MOCK PREVIEW", color: "yellow" });
  if (glbNormalized) badges.push({ label: "NORMALIZED", color: "cyan" });
  if (turntableActive) badges.push({ label: "TURNTABLE ACTIVE", color: "violet" });
  if (versionLabel) badges.push({ label: versionLabel, color: "cyan" });

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-[52px] shrink-0 border-b border-white/5 px-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-cyan-400 transition-colors font-mono shrink-0"
        >
          ← Back
        </button>
        <div className="h-4 w-px bg-white/8" />
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
          <span className="font-bold tracking-tight">MiniMesh</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">3D Preview</span>
        </div>

        {/* State badges */}
        <div className="flex items-center gap-1.5 ml-2 flex-wrap">
          {badges.map((b) => (
            <div
              key={b.label}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono font-bold
                ${b.color === "emerald" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : ""}
                ${b.color === "cyan" ? "border-cyan-500/30 bg-cyan-500/5 text-cyan-400" : ""}
                ${b.color === "violet" ? "border-violet-500/30 bg-violet-500/5 text-violet-400" : ""}
                ${b.color === "yellow" ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-500/80" : ""}
                ${b.color === "red" ? "border-red-500/30 bg-red-500/5 text-red-400" : ""}
              `}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    b.color === "emerald" ? "#34d399" :
                    b.color === "cyan" ? "#22d3ee" :
                    b.color === "violet" ? "#a78bfa" :
                    b.color === "red" ? "#f87171" : "#f59e0b",
                }}
              />
              {b.label}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Stats toggle */}
          <button
            onClick={() => setShowStats((v) => !v)}
            className={[
              "text-[10px] font-mono px-2 py-1 rounded-lg border transition-all",
              showStats
                ? "border-violet-500/40 text-violet-400 bg-violet-500/5"
                : "border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15",
            ].join(" ")}
          >
            Stats
          </button>

          {/* Providers toggle */}
          <button
            onClick={() => setShowProviders((v) => !v)}
            className={[
              "text-[10px] font-mono px-2 py-1 rounded-lg border transition-all",
              showProviders
                ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/5"
                : "border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15",
            ].join(" ")}
          >
            Providers
          </button>

          {job?.asset_id && glbLoaded && (
            <button
              onClick={handleCaptureAsThumbnail}
              disabled={capturingThumb}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:border-cyan-400/50 hover:bg-cyan-500/5 transition-all disabled:opacity-50"
            >
              {capturingThumb ? "Saving…" : "Capture as Thumbnail"}
            </button>
          )}

          {job?.status === "completed" && onOpenRigStudio && (
            <button
              onClick={() => onOpenRigStudio(job)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/40 text-violet-300 text-xs font-semibold hover:border-violet-400/60 hover:bg-violet-500/5 transition-all"
            >
              Open Rig Studio →
            </button>
          )}

          <span className="text-xs font-mono text-slate-700">Phase 24</span>
        </div>
      </header>

      {/* Provider panel */}
      {showProviders && (
        <div className="shrink-0 border-b border-white/5 bg-black/20 px-5 py-3">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Provider Status</p>
          <ProviderStatusPanel />
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <ViewerSettingsPanel
          environment={environment}
          exposure={exposure}
          turntableSpeed={turntableSpeed}
          showGrid={showGrid}
          onEnvironment={setEnvironment}
          onExposure={setExposure}
          onTurntableSpeed={setTurntableSpeed}
          onGridToggle={() => setShowGrid((v) => !v)}
        />
      )}

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Viewport column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ViewerToolbar
            materialMode={materialMode}
            autoRotate={autoRotate}
            showGrid={showGrid}
            showSkeleton={showSkeleton}
            turntableActive={turntableActive}
            environment={environment}
            showSettings={showSettings}
            onResetCamera={() => setResetTrigger((t) => t + 1)}
            onMaterialMode={setMaterialMode}
            onAutoRotateToggle={() => setAutoRotate((v) => !v)}
            onGridToggle={() => setShowGrid((v) => !v)}
            onSkeletonToggle={() => setShowSkeleton((v) => !v)}
            onTurntableToggle={() => setTurntableActive((v) => !v)}
            onCameraPreset={handleCameraPreset}
            onEnvironment={setEnvironment}
            onScreenshot={() => screenshotRef.current?.()}
            onToggleSettings={() => setShowSettings((v) => !v)}
          />

          {/* Canvas */}
          <div className="flex-1 relative">
            <MeshViewer
              materialMode={materialMode}
              autoRotate={autoRotate}
              showGrid={showGrid}
              resetTrigger={resetTrigger}
              showSkeleton={showSkeleton}
              modelUrl={glbLoaded ? glbUrl : null}
              modelType={glbLoaded ? "glb" : null}
              glbFailed={glbError}
              environment={environment}
              exposure={exposure}
              turntableActive={turntableActive}
              turntableSpeed={turntableSpeed}
              cameraPreset={cameraPreset}
              onCameraPresetDone={handleCameraPresetDone}
              screenshotRef={screenshotRef}
              captureRef={captureRef}
              onModelStats={handleModelStats}
              onGlbError={handleGlbError}
              onGlbNormalized={handleGlbNormalized}
            />

            {/* Bottom overlay label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-white/8 bg-black/60 text-slate-600 backdrop-blur-sm">
                {glbError
                  ? "GLB failed to load — fallback preview active"
                  : glbLoaded
                  ? `Real GLB · ${glbNormalized ? "normalized" : "loading…"} · Meshy AI`
                  : "Placeholder preview mesh"}
              </span>
            </div>

            {/* Stats overlay */}
            {showStats && (
              <div className="absolute top-3 right-3 w-56 bg-black/80 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden">
                <ModelStatsPanel
                  stats={modelStats}
                  job={job}
                  glbLoaded={glbLoaded}
                  normalized={glbNormalized}
                  fileSize={job?.model_downloaded ? undefined : 0}
                />
              </div>
            )}
          </div>

          <ExportPanel job={job} />

          <ViewerStatusBar
            isMock={isMock}
            job={job}
            glbLoaded={glbLoaded}
            turntableActive={turntableActive}
            normalized={glbNormalized}
            glbError={glbError}
            environment={environment}
          />
        </div>

        {/* Right inspector */}
        <ViewerInspector job={job} materialMode={materialMode} glbLoaded={glbLoaded} />
      </div>
    </div>
  );
}
