import { MaterialProfile, SHADER_LABELS, ShaderType } from "../../lib/materials";

export default function ActiveMaterialBar({
  material,
  onActivate,
}: {
  material: MaterialProfile;
  onActivate: () => void;
}) {
  return (
    <div className="border-t border-white/5 px-4 py-2.5 flex items-center gap-4 bg-black/30 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded"
          style={{
            background: `linear-gradient(135deg, ${material.base_color}, ${material.emissive_color})`,
          }}
        />
        <span className="text-sm font-semibold text-slate-200">{material.name}</span>
        <span className="text-xs font-mono text-slate-500 px-1.5 py-0.5 rounded bg-white/5">
          {SHADER_LABELS[material.shader_type as ShaderType]}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-[10px] text-slate-600 font-mono">
          Material Studio uses preview shaders only. Real texture baking and UV workflows will be added in future phases.
        </span>
        <button
          onClick={onActivate}
          className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/5 transition-all duration-150 font-semibold"
        >
          Apply to Project
        </button>
      </div>
    </div>
  );
}
