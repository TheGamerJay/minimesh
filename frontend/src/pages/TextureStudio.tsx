import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  TextureAsset,
  TextureType,
  TEXTURE_TYPES,
  listTextures,
  deleteTexture,
  assignTextures,
  textureUrl,
} from "../lib/textures";
import {
  UVAnalysis,
  TextureValidationResult,
  BakeJob,
  getUVAnalysis,
  validateTextures,
  listBakeJobs,
} from "../lib/bakes";
import { Job } from "../lib/jobs";
import MeshViewer from "../components/viewer/MeshViewer";
import TextureLibrary from "../components/textures/TextureLibrary";
import TextureSlotInspector from "../components/textures/TextureSlotInspector";
import TextureAssignmentBar from "../components/textures/TextureAssignmentBar";
import UVInspectorPanel from "../components/textures/UVInspectorPanel";
import TextureValidationPanel from "../components/textures/TextureValidationPanel";
import BakeJobPanel from "../components/textures/BakeJobPanel";

interface Props {
  onBack: () => void;
  job?: Job | null;
}

export default function TextureStudio({ onBack, job }: Props) {
  const [textures, setTextures] = useState<TextureAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<Partial<Record<TextureType, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase 19: UV & Bake state
  const [showBakePanel, setShowBakePanel] = useState(false);
  const [uvAnalysis, setUvAnalysis] = useState<UVAnalysis | null>(null);
  const [uvLoading, setUvLoading] = useState(false);
  const [validation, setValidation] = useState<TextureValidationResult | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [bakeJobs, setBakeJobs] = useState<BakeJob[]>([]);

  const assetId = job?.asset_id ?? null;
  const glbUrl = job?.glb_path ? `/export-packages/jobs/${job.id}/model.glb` : null;
  const glbLoaded = !!glbUrl && job?.model_downloaded === true;

  const load = useCallback(async () => {
    try {
      const data = await listTextures();
      setTextures(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load bake job history on mount
  useEffect(() => {
    listBakeJobs(assetId ?? undefined).then(setBakeJobs).catch(() => {});
  }, [assetId]);

  // Load UV analysis when asset is available
  useEffect(() => {
    if (!assetId) { setUvAnalysis(null); return; }
    setUvLoading(true);
    getUVAnalysis(assetId)
      .then(setUvAnalysis)
      .catch(() => setUvAnalysis(null))
      .finally(() => setUvLoading(false));
  }, [assetId]);

  // Run texture validation whenever assignments change
  const assignedRecord = useMemo(
    () => Object.fromEntries(Object.entries(assigned).filter(([, v]) => !!v)) as Record<string, string>,
    [assigned]
  );
  const assignedKey = useMemo(() => JSON.stringify(assignedRecord), [assignedRecord]);
  useEffect(() => {
    if (Object.keys(assignedRecord).length === 0) { setValidation(null); return; }
    setValidationLoading(true);
    validateTextures(assignedRecord)
      .then(setValidation)
      .catch(() => setValidation(null))
      .finally(() => setValidationLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedKey]);

  // Build id → asset map for quick lookup
  const textureMap = useMemo(() =>
    Object.fromEntries(textures.map((t) => [t.id, t])),
    [textures]
  );

  // Build textureUrls for live viewer: slot → URL
  const textureUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    for (const [slot, id] of Object.entries(assigned)) {
      const asset = textureMap[id];
      if (asset) urls[slot] = textureUrl(asset);
    }
    return urls;
  }, [assigned, textureMap]);

  function handleUploaded(asset: TextureAsset) {
    setTextures((prev) => [asset, ...prev]);
  }

  async function handleDelete(id: string) {
    await deleteTexture(id);
    setTextures((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) setSelectedId(null);
    setAssigned((prev) => {
      const next = { ...prev };
      for (const [slot, tid] of Object.entries(next)) {
        if (tid === id) delete next[slot as TextureType];
      }
      return next;
    });
  }

  function handleAssign(textureId: string, slotType: string) {
    if (!TEXTURE_TYPES.includes(slotType as TextureType)) return;
    setAssigned((prev) => ({ ...prev, [slotType as TextureType]: textureId }));
    setSaved(false);
  }

  function handleRemoveSlot(slot: TextureType) {
    setAssigned((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    if (Object.keys(assigned).length === 0) return;
    setSaving(true);
    try {
      await assignTextures(
        job?.id ?? "standalone",
        assigned,
        job?.asset_id ?? undefined,
      );
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message ?? "Save failed");
    }
    setSaving(false);
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-[52px] shrink-0 border-b border-white/5 px-5 flex items-center gap-4">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-cyan-400 transition-colors font-mono">
          ← Back
        </button>
        <div className="h-4 w-px bg-white/8" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">T</div>
          <span className="font-bold tracking-tight">MiniMesh</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">Texture Studio</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {glbLoaded ? (
            <span className="text-[10px] font-mono px-2 py-1 rounded border border-emerald-500/30 text-emerald-400">
              Real GLB
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-1 rounded border border-yellow-500/20 text-yellow-600">
              Placeholder
            </span>
          )}

          {/* Phase 19: UV & Bake toggle */}
          <button
            onClick={() => setShowBakePanel((v) => !v)}
            className={[
              "px-2.5 py-1 rounded text-[10px] font-mono transition-colors border",
              showBakePanel
                ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                : "bg-gray-800/40 text-slate-500 border-gray-700/30 hover:text-slate-300",
            ].join(" ")}
          >
            UV & Bake{showBakePanel ? " ▲" : " ▼"}
          </button>

          <span className="text-xs font-mono text-slate-700">Phase 19</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: texture library */}
        {loading ? (
          <div className="w-56 shrink-0 border-r border-white/5 flex items-center justify-center">
            <span className="text-[11px] text-slate-600 font-mono">Loading…</span>
          </div>
        ) : (
          <TextureLibrary
            textures={textures}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            onAssign={handleAssign}
            onUploaded={handleUploaded}
          />
        )}

        {/* Center: live viewer + assignment bar + UV/Bake panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative min-h-0">
            <MeshViewer
              materialMode="solid"
              autoRotate={false}
              showGrid={true}
              resetTrigger={0}
              modelUrl={glbLoaded ? glbUrl : null}
              modelType={glbLoaded ? "glb" : null}
              textureUrls={textureUrls}
              environment="studio_dark"
            />

            {/* Overlay */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-white/8 bg-black/60 text-slate-600 backdrop-blur-sm">
                {glbLoaded
                  ? `Real GLB · ${Object.keys(textureUrls).length} texture(s) applied`
                  : "Placeholder mesh · assign textures to see live preview"}
              </span>
            </div>

            {/* Assigned texture count badge */}
            {Object.keys(assigned).length > 0 && (
              <div className="absolute top-3 left-3 px-2 py-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono text-cyan-400 backdrop-blur-sm">
                {Object.keys(assigned).length} slot{Object.keys(assigned).length !== 1 ? "s" : ""} assigned
              </div>
            )}
          </div>

          {/* Assignment bar */}
          <TextureAssignmentBar
            assignedTextures={assigned}
            textureMap={textureMap}
            onRemoveSlot={handleRemoveSlot}
            onSave={handleSave}
            saving={saving}
            saved={saved}
          />

          {/* Phase 19: UV & Bake panel */}
          {showBakePanel && (
            <div className="shrink-0 h-52 border-t border-white/5 flex overflow-hidden">
              <UVInspectorPanel analysis={uvAnalysis} loading={uvLoading} assetId={assetId} />
              <TextureValidationPanel validation={validation} loading={validationLoading} />
              <BakeJobPanel
                assetId={assetId}
                jobs={bakeJobs}
                onJobCreated={(job) => setBakeJobs((prev) => [job, ...prev])}
                onJobUpdated={(updated) =>
                  setBakeJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
                }
              />
            </div>
          )}
        </div>

        {/* Right: slot inspector */}
        <TextureSlotInspector
          assignedTextures={assigned}
          textureMap={textureMap}
          onAssignSlot={handleAssign}
          onRemoveSlot={handleRemoveSlot}
          availableTextures={textures}
        />
      </div>
    </div>
  );
}
