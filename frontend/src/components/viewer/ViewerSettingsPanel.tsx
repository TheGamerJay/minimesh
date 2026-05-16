import { EnvironmentPreset, ENVIRONMENT_PRESETS } from "../../lib/viewerEnvironments";

interface Props {
  environment: EnvironmentPreset;
  exposure: number;
  turntableSpeed: number;
  showGrid: boolean;
  onEnvironment: (v: EnvironmentPreset) => void;
  onExposure: (v: number) => void;
  onTurntableSpeed: (v: number) => void;
  onGridToggle: () => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono text-slate-300">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded appearance-none bg-gray-700 accent-cyan-400 cursor-pointer"
      />
    </div>
  );
}

export default function ViewerSettingsPanel({
  environment,
  exposure,
  turntableSpeed,
  showGrid,
  onEnvironment,
  onExposure,
  onTurntableSpeed,
  onGridToggle,
}: Props) {
  return (
    <div className="shrink-0 border-b border-white/5 bg-black/30 px-4 py-3 space-y-4">
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Viewer Settings</p>

      {/* Environment */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Environment</span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(ENVIRONMENT_PRESETS) as EnvironmentPreset[]).map((key) => (
            <button
              key={key}
              onClick={() => onEnvironment(key)}
              className={[
                "px-2.5 py-1 rounded text-[10px] font-mono border transition-all",
                environment === key
                  ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
                  : "border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15",
              ].join(" ")}
            >
              {ENVIRONMENT_PRESETS[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <SliderRow
          label="Exposure"
          value={exposure}
          min={0.1}
          max={3}
          step={0.05}
          display={`${exposure.toFixed(2)}×`}
          onChange={onExposure}
        />
        <SliderRow
          label="Turntable Speed"
          value={turntableSpeed}
          min={0.3}
          max={5}
          step={0.1}
          display={`${turntableSpeed.toFixed(1)}×`}
          onChange={onTurntableSpeed}
        />
      </div>

      {/* Grid toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showGrid}
          onChange={onGridToggle}
          className="accent-cyan-400"
        />
        <span className="text-[10px] font-mono text-slate-400">Show Grid</span>
      </label>
    </div>
  );
}
