import { MaterialProfile, SHADER_LABELS, ShaderType } from "../../lib/materials";

const SHADER_DOT: Record<ShaderType, string> = {
  toon: "bg-cyan-400",
  pbr: "bg-violet-400",
  metallic: "bg-amber-400",
  holographic: "bg-fuchsia-400",
  matte: "bg-orange-400",
  emissive: "bg-emerald-400",
};

export default function MaterialPresetGrid({
  materials,
  activeId,
  onSelect,
}: {
  materials: MaterialProfile[];
  activeId: string;
  onSelect: (m: MaterialProfile) => void;
}) {
  const presets = materials.filter((m) => m.is_preset);
  const custom = materials.filter((m) => !m.is_preset);

  function MatCard({ m }: { m: MaterialProfile }) {
    const isActive = m.id === activeId;
    const shader = m.shader_type as ShaderType;
    return (
      <button
        onClick={() => onSelect(m)}
        className={[
          "text-left rounded-lg border p-3 flex flex-col gap-2 transition-all duration-150",
          isActive
            ? "border-cyan-500/50 bg-cyan-500/5"
            : "border-white/6 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
        ].join(" ")}
      >
        {/* Color swatch */}
        <div
          className="w-full h-8 rounded-md"
          style={{
            background: `linear-gradient(135deg, ${m.base_color} 0%, ${m.secondary_color} 60%, ${m.emissive_color} 100%)`,
            opacity: m.opacity,
          }}
        />
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SHADER_DOT[shader]}`} />
          <span className="text-xs font-semibold text-slate-200 truncate">{m.name}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{SHADER_LABELS[shader]}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto h-full py-1">
      <div>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-1">
          Presets
        </p>
        <div className="flex flex-col gap-1.5">
          {presets.map((m) => <MatCard key={m.id} m={m} />)}
        </div>
      </div>
      {custom.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-1">
            Custom
          </p>
          <div className="flex flex-col gap-1.5">
            {custom.map((m) => <MatCard key={m.id} m={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}
