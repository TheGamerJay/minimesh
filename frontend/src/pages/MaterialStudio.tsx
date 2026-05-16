import { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  MaterialProfile,
  listMaterials,
  createMaterial,
  activateMaterial,
} from "../lib/materials";
import { isCreditError } from "../lib/credits";
import { useCredits } from "../lib/creditContext";
import InsufficientCreditsModal from "../components/credits/InsufficientCreditsModal";
import EnvironmentLights from "../components/viewer/EnvironmentLights";
import PlaceholderMesh from "../components/viewer/PlaceholderMesh";
import MaterialPresetGrid from "../components/materials/MaterialPresetGrid";
import MaterialInspector from "../components/materials/MaterialInspector";
import MaterialToolbar from "../components/materials/MaterialToolbar";
import ActiveMaterialBar from "../components/materials/ActiveMaterialBar";

function MaterialCanvas({ profile }: { profile: MaterialProfile | null }) {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ position: [0, 1.1, 4.2], fov: 44 }}
        shadows
      >
        <color attach="background" args={["#0c0c14"]} />
        <EnvironmentLights />
        <PlaceholderMesh materialMode="solid" materialProfile={profile} />
        <gridHelper args={[12, 24, "#1e293b", "#0f172a"]} position={[0, -0.42, 0]} />
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.8}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.5}
          maxDistance={22}
          makeDefault
        />
      </Canvas>
    </div>
  );
}

function randomHex(): string {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
  );
}

export default function MaterialStudio({ onBack }: { onBack: () => void }) {
  const { refresh: refreshCredits } = useCredits();
  const [materials, setMaterials] = useState<MaterialProfile[]>([]);
  const [selected, setSelected] = useState<MaterialProfile | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [_saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditErrorMsg, setCreditErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await listMaterials();
      setMaterials(list);
      if (!selected && list.length > 0) {
        setSelected(list[0]);
        setActiveId(list[0].id);
      }
    } catch {
      setError("Failed to load materials");
    }
  }, [selected]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(m: MaterialProfile) {
    setSelected({ ...m });
    setActiveId(m.id);
  }

  function handleChange(patch: Partial<MaterialProfile>) {
    if (!selected) return;
    setSelected((prev) => prev ? { ...prev, ...patch } : prev);
  }

  function handleReset() {
    if (!selected) return;
    const original = materials.find((m) => m.id === selected.id);
    if (original) setSelected({ ...original });
  }

  async function handleSavePreset() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createMaterial({
        ...selected,
        name: `${selected.name} (Custom)`,
        is_preset: false,
        id: undefined as unknown as string,
      });
      refreshCredits();
      await load();
      setSelected(created);
      setActiveId(created.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      if (isCreditError(msg)) {
        setCreditErrorMsg(msg);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createMaterial({
        ...selected,
        name: `${selected.name} Copy`,
        is_preset: false,
        id: undefined as unknown as string,
      });
      refreshCredits();
      await load();
      setSelected(created);
      setActiveId(created.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to duplicate";
      if (isCreditError(msg)) {
        setCreditErrorMsg(msg);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleRandomize() {
    if (!selected) return;
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            base_color: randomHex(),
            secondary_color: randomHex(),
            emissive_color: randomHex(),
            metallic: parseFloat(Math.random().toFixed(2)),
            roughness: parseFloat(Math.random().toFixed(2)),
            emissive_intensity: parseFloat((Math.random() * 1.5).toFixed(2)),
          }
        : prev
    );
  }

  async function handleApplyToProject() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await activateMaterial(selected.id);
      setActiveId(selected.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply material");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-slate-100 overflow-hidden">
      {creditErrorMsg && (
        <InsufficientCreditsModal
          message={creditErrorMsg}
          onClose={() => { setCreditErrorMsg(null); refreshCredits(); }}
        />
      )}
      {/* Header */}
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
          <span className="text-sm text-slate-400">Material Studio</span>
        </div>
        <div className="ml-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-violet-500/20 bg-violet-500/5">
          <span className="text-[10px] font-mono text-violet-400">
            Preview shaders · real UV/PBR baking in future phases
          </span>
        </div>
        <span className="ml-auto text-xs font-mono text-slate-700">Material Studio — Phase 12</span>
      </header>

      {/* Toolbar */}
      {selected && (
        <MaterialToolbar
          material={selected}
          onReset={handleReset}
          onSavePreset={handleSavePreset}
          onDuplicate={handleDuplicate}
          onRandomize={handleRandomize}
        />
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 text-xs text-red-400 flex-shrink-0">
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — preset browser */}
        <div className="w-52 shrink-0 border-r border-white/5 px-3 py-3 overflow-hidden flex flex-col">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3 flex-shrink-0">
            Materials
          </p>
          <MaterialPresetGrid
            materials={materials}
            activeId={activeId}
            onSelect={handleSelect}
          />
        </div>

        {/* Center — 3D viewport */}
        <div className="flex-1 relative">
          <MaterialCanvas profile={selected} />
          {/* Overlay label */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-white/8 bg-black/60 text-slate-600 backdrop-blur-sm">
              Placeholder preview mesh · {selected?.shader_type ?? "—"} shader
            </span>
          </div>
        </div>

        {/* Right — inspector */}
        <div className="w-64 shrink-0 border-l border-white/5 px-4 py-3 overflow-hidden flex flex-col">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3 flex-shrink-0">
            {selected?.name ?? "No material selected"}
          </p>
          {selected ? (
            <MaterialInspector material={selected} onChange={handleChange} />
          ) : (
            <p className="text-xs text-slate-600">Select a material to inspect.</p>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      {selected && (
        <ActiveMaterialBar
          material={selected}
          onActivate={handleApplyToProject}
        />
      )}
    </div>
  );
}
