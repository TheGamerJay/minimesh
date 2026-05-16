import { MaterialProfile, SHADER_TYPES, SHADER_LABELS, ShaderType } from "../../lib/materials";

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-mono text-slate-500">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 accent-cyan-400 cursor-pointer"
      />
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
        />
        <span className="text-[10px] font-mono text-slate-500 w-16">{value}</span>
      </div>
    </div>
  );
}

export default function MaterialInspector({
  material,
  onChange,
}: {
  material: MaterialProfile;
  onChange: (patch: Partial<MaterialProfile>) => void;
}) {
  const isPreset = material.is_preset;

  return (
    <div className="flex flex-col gap-5 overflow-y-auto h-full py-1">
      {isPreset && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
          Built-in preset — changes apply to preview only. Save as custom to persist.
        </div>
      )}

      {/* Shader type */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Shader Type
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {SHADER_TYPES.map((st) => (
            <button
              key={st}
              onClick={() => onChange({ shader_type: st })}
              className={[
                "px-2 py-1.5 rounded-md border text-[10px] font-mono transition-all duration-150",
                material.shader_type === st
                  ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/5"
                  : "border-white/6 text-slate-500 hover:border-white/15 hover:text-slate-300",
              ].join(" ")}
            >
              {SHADER_LABELS[st as ShaderType]}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Colors</span>
        <ColorRow label="Base Color" value={material.base_color} onChange={(v) => onChange({ base_color: v })} />
        <ColorRow label="Secondary" value={material.secondary_color} onChange={(v) => onChange({ secondary_color: v })} />
        <ColorRow label="Emissive" value={material.emissive_color} onChange={(v) => onChange({ emissive_color: v })} />
      </div>

      {/* Numeric sliders */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Surface</span>
        <SliderRow label="Metallic" value={material.metallic} min={0} max={1} step={0.01} onChange={(v) => onChange({ metallic: v })} />
        <SliderRow label="Roughness" value={material.roughness} min={0} max={1} step={0.01} onChange={(v) => onChange({ roughness: v })} />
        <SliderRow label="Emissive Intensity" value={material.emissive_intensity} min={0} max={2} step={0.05} onChange={(v) => onChange({ emissive_intensity: v })} />
        <SliderRow label="Opacity" value={material.opacity} min={0.1} max={1} step={0.01} onChange={(v) => onChange({ opacity: v })} />
      </div>

      {/* Toon steps (only for toon shader) */}
      {material.shader_type === "toon" && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Toon</span>
          <SliderRow
            label="Toon Steps"
            value={material.toon_steps}
            min={2}
            max={8}
            step={1}
            onChange={(v) => onChange({ toon_steps: Math.round(v) })}
          />
        </div>
      )}

      {/* Rim light toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Rim Light</span>
        <button
          onClick={() => onChange({ rim_light: !material.rim_light })}
          className={[
            "px-3 py-1 rounded-lg border text-xs font-mono transition-all duration-150",
            material.rim_light
              ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/5"
              : "border-white/10 text-slate-500",
          ].join(" ")}
        >
          {material.rim_light ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
