import { FALLOFF_TYPES } from "../../lib/edits";

export interface BrushSettings {
  radius: number;
  strength: number;
  symmetry: boolean;
  falloff: string;
}

interface Props {
  settings: BrushSettings;
  onChange: (next: BrushSettings) => void;
}

export default function BrushSettingsPanel({ settings, onChange }: Props) {
  return (
    <div className="p-3 border-t border-white/5 space-y-3">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
        Brush
      </span>

      {/* Radius */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-[10px] font-mono text-slate-500">Radius</span>
          <span className="text-[10px] font-mono text-slate-300">{settings.radius}</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={settings.radius}
          onChange={(e) => onChange({ ...settings, radius: Number(e.target.value) })}
          className="w-full h-1 rounded-full appearance-none bg-gray-700 accent-violet-500"
        />
      </div>

      {/* Strength */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-[10px] font-mono text-slate-500">Strength</span>
          <span className="text-[10px] font-mono text-slate-300">{settings.strength.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.strength}
          onChange={(e) => onChange({ ...settings, strength: Number(e.target.value) })}
          className="w-full h-1 rounded-full appearance-none bg-gray-700 accent-violet-500"
        />
      </div>

      {/* Symmetry toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-500">Symmetry</span>
        <button
          onClick={() => onChange({ ...settings, symmetry: !settings.symmetry })}
          className={[
            "px-2 py-0.5 rounded text-[10px] font-mono border transition-colors",
            settings.symmetry
              ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
              : "bg-gray-800/40 text-slate-600 border-gray-700/30",
          ].join(" ")}
        >
          {settings.symmetry ? "ON" : "OFF"}
        </button>
      </div>

      {/* Pressure — placeholder */}
      <div className="flex items-center justify-between opacity-35">
        <span className="text-[10px] font-mono text-slate-500">Pressure</span>
        <span className="text-[10px] font-mono text-slate-700">— future</span>
      </div>

      {/* Falloff */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono text-slate-500 block">Falloff</span>
        <div className="flex gap-1">
          {FALLOFF_TYPES.map((f) => (
            <button
              key={f}
              onClick={() => onChange({ ...settings, falloff: f })}
              className={[
                "flex-1 py-0.5 rounded text-[9px] font-mono border transition-colors capitalize",
                settings.falloff === f
                  ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                  : "bg-gray-800/40 text-slate-600 border-gray-700/30 hover:text-slate-400",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
