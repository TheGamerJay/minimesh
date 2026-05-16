import { useState, useEffect } from "react";
import {
  EditOperation,
  createEditOperation,
  getEditOperation,
  listEditOperations,
} from "../lib/edits";
import { Job } from "../lib/jobs";
import MeshViewer from "../components/viewer/MeshViewer";
import SculptToolbar from "../components/editing/SculptToolbar";
import BrushSettingsPanel, { BrushSettings } from "../components/editing/BrushSettingsPanel";
import EditHistoryPanel from "../components/editing/EditHistoryPanel";
import EditOperationPanel from "../components/editing/EditOperationPanel";

interface Props {
  onBack: () => void;
  job?: Job | null;
}

export default function SculptStudio({ onBack, job }: Props) {
  const [activeTool, setActiveTool] = useState("clay");
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    radius: 20,
    strength: 0.5,
    symmetry: false,
    falloff: "sphere",
  });
  const [showGizmo, setShowGizmo] = useState(false);
  const [operations, setOperations] = useState<EditOperation[]>([]);
  const [lastOp, setLastOp] = useState<EditOperation | null>(null);
  const [applying, setApplying] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assetId = job?.asset_id ?? null;
  const glbUrl = job?.glb_path ? `/export-packages/jobs/${job.id}/model.glb` : null;
  const glbLoaded = !!glbUrl && job?.model_downloaded === true;

  // Load edit history on mount
  useEffect(() => {
    listEditOperations(assetId ?? undefined).then(setOperations).catch(() => {});
  }, [assetId]);

  async function handleApply() {
    if (!assetId) {
      setError("No asset selected — open a job from Generated Assets first.");
      return;
    }
    setApplying(true);
    setError(null);
    try {
      const op = await createEditOperation({
        asset_id: assetId,
        operation_type: activeTool,
        brush_type: activeTool,
        strength: brushSettings.strength,
        radius: brushSettings.radius,
      });
      setLastOp(op);
      setOperations((prev) => [op, ...prev]);
      startPolling(op.id);
    } catch (e: any) {
      setError(e.message ?? "Failed to create edit operation");
    }
    setApplying(false);
  }

  function startPolling(opId: string) {
    setPollingId(opId);
    const interval = setInterval(async () => {
      try {
        const updated = await getEditOperation(opId);
        setLastOp(updated);
        setOperations((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o))
        );
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
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-[52px] shrink-0 border-b border-white/5 px-5 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-cyan-400 transition-colors font-mono"
        >
          ← Back
        </button>
        <div className="h-4 w-px bg-white/8" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
          <span className="font-bold tracking-tight">MiniMesh</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">Sculpt Studio</span>
        </div>

        <div className="ml-4 px-3 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-[10px] font-mono text-yellow-600 hidden md:block">
          Sculpt Studio uses mock edit operations only — real deformation arrives in future phases
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowGizmo((v) => !v)}
            className={[
              "px-2.5 py-1 rounded text-[10px] font-mono transition-colors border",
              showGizmo
                ? "bg-cyan-600/20 text-cyan-300 border-cyan-500/40"
                : "bg-gray-800/40 text-slate-500 border-gray-700/30 hover:text-slate-300",
            ].join(" ")}
          >
            Gizmo{showGizmo ? " ▲" : " ▼"}
          </button>

          {glbLoaded ? (
            <span className="text-[10px] font-mono px-2 py-1 rounded border border-emerald-500/30 text-emerald-400">
              Real GLB
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-1 rounded border border-yellow-500/20 text-yellow-600">
              Placeholder
            </span>
          )}

          <span className="text-xs font-mono text-slate-700">Phase 20</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: tool selector + brush settings */}
        <div className="w-44 shrink-0 border-r border-white/5 flex flex-col overflow-y-auto">
          <SculptToolbar activeTool={activeTool} onSelect={setActiveTool} />
          <BrushSettingsPanel settings={brushSettings} onChange={setBrushSettings} />
        </div>

        {/* Center: viewer + timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas area */}
          <div className="flex-1 relative min-h-0">
            <MeshViewer
              materialMode="solid"
              autoRotate={false}
              showGrid={true}
              resetTrigger={0}
              modelUrl={glbLoaded ? glbUrl : null}
              modelType={glbLoaded ? "glb" : null}
              environment="studio_dark"
              editMode={showGizmo}
            />

            {/* Edit mode badge */}
            <div className="absolute top-3 left-3 flex gap-2 items-center pointer-events-none">
              <span className="px-2 py-1 rounded border border-violet-500/30 bg-black/60 text-[10px] font-mono text-violet-300 backdrop-blur-sm">
                SCULPT · {activeTool.toUpperCase()}
              </span>
              {pollingId && (
                <span className="px-2 py-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono text-cyan-400 backdrop-blur-sm animate-pulse">
                  APPLYING…
                </span>
              )}
              {showGizmo && (
                <span className="px-2 py-1 rounded border border-cyan-500/20 bg-black/60 text-[10px] font-mono text-cyan-600 backdrop-blur-sm">
                  GIZMO
                </span>
              )}
            </div>

            {/* Brush cursor hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-white/8 bg-black/60 text-slate-600 backdrop-blur-sm">
                {showGizmo
                  ? "Transform gizmo active (visual only — no real transforms yet)"
                  : "Brush preview · assign a real GLB asset to apply edit operations"}
              </span>
            </div>

            {/* Error notice */}
            {error && (
              <div className="absolute top-12 left-3 px-3 py-1.5 rounded border border-red-500/30 bg-black/70 text-[10px] font-mono text-red-400 backdrop-blur-sm max-w-xs">
                {error}
              </div>
            )}
          </div>

          {/* Edit history timeline */}
          <EditHistoryPanel operations={operations} />
        </div>

        {/* Right: operation inspector */}
        <EditOperationPanel
          operation={lastOp}
          activeTool={activeTool}
          brushSettings={brushSettings}
          assetId={assetId}
          onApply={handleApply}
          applying={applying || !!pollingId}
        />
      </div>
    </div>
  );
}
