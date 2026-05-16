import { ENVIRONMENT_PRESETS, EnvironmentPreset } from "../../lib/viewerEnvironments";

type MaterialMode = "solid" | "wireframe" | "toon";

const CAMERA_VIEWS = ["front", "back", "left", "right", "top", "iso"] as const;

interface ViewerToolbarProps {
  materialMode: MaterialMode;
  autoRotate: boolean;
  showGrid: boolean;
  showSkeleton?: boolean;
  turntableActive: boolean;
  environment: EnvironmentPreset;
  showSettings: boolean;
  onResetCamera: () => void;
  onMaterialMode: (m: MaterialMode) => void;
  onAutoRotateToggle: () => void;
  onGridToggle: () => void;
  onSkeletonToggle?: () => void;
  onTurntableToggle: () => void;
  onCameraPreset: (preset: string) => void;
  onEnvironment: (preset: EnvironmentPreset) => void;
  onScreenshot: () => void;
  onToggleSettings: () => void;
}

function ToolBtn({
  label,
  icon,
  active,
  onClick,
  title,
}: {
  label: string;
  icon?: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      className={[
        "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono border transition-all duration-150",
        active
          ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
          : "border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300",
      ].join(" ")}
    >
      {icon && <span className="text-sm leading-none">{icon}</span>}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/8 mx-0.5 shrink-0" />;
}

export default function ViewerToolbar({
  materialMode,
  autoRotate,
  showGrid,
  showSkeleton,
  turntableActive,
  environment,
  showSettings,
  onResetCamera,
  onMaterialMode,
  onAutoRotateToggle,
  onGridToggle,
  onSkeletonToggle,
  onTurntableToggle,
  onCameraPreset,
  onEnvironment,
  onScreenshot,
  onToggleSettings,
}: ViewerToolbarProps) {
  return (
    <div className="h-11 border-b border-white/5 bg-black/40 px-3 flex items-center gap-1.5 shrink-0 overflow-x-auto">
      {/* Reset */}
      <ToolBtn label="Reset" icon="↺" onClick={onResetCamera} title="Reset Camera" />

      <Divider />

      {/* Camera presets */}
      {CAMERA_VIEWS.map((view) => (
        <button
          key={view}
          onClick={() => onCameraPreset(view)}
          title={`${view.charAt(0).toUpperCase() + view.slice(1)} view`}
          className="px-2 py-1 rounded text-[10px] font-mono border border-white/8 text-slate-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-all duration-150 uppercase"
        >
          {view === "iso" ? "Iso" : view.slice(0, 1).toUpperCase() + view.slice(1, 2)}
        </button>
      ))}

      <Divider />

      {/* Material modes */}
      <ToolBtn label="Solid" icon="◉" active={materialMode === "solid"} onClick={() => onMaterialMode("solid")} />
      <ToolBtn label="Wire" icon="△" active={materialMode === "wireframe"} onClick={() => onMaterialMode("wireframe")} title="Wireframe" />
      <ToolBtn label="Toon" icon="◈" active={materialMode === "toon"} onClick={() => onMaterialMode("toon")} />

      <Divider />

      {/* Environment picker */}
      <div className="relative group">
        <button
          title="Environment"
          className={[
            "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono border transition-all duration-150",
            "border-white/8 text-slate-500 hover:border-violet-500/30 hover:text-violet-400",
          ].join(" ")}
        >
          <span className="text-sm">◑</span>
          <span className="hidden sm:inline">Env</span>
        </button>
        <div className="absolute top-full left-0 mt-1 z-50 hidden group-hover:flex flex-col bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[130px]">
          {(Object.keys(ENVIRONMENT_PRESETS) as EnvironmentPreset[]).map((key) => (
            <button
              key={key}
              onClick={() => onEnvironment(key)}
              className={[
                "px-3 py-2 text-left text-xs font-mono transition-colors",
                environment === key
                  ? "text-cyan-400 bg-cyan-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
              ].join(" ")}
            >
              {environment === key && <span className="mr-1">✓</span>}
              {ENVIRONMENT_PRESETS[key].label}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Rotation + Grid */}
      <ToolBtn label="Rotate" icon="↻" active={autoRotate} onClick={onAutoRotateToggle} title="Auto Rotate" />
      <ToolBtn label="Turntable" icon="⟳" active={turntableActive} onClick={onTurntableToggle} />
      <ToolBtn label="Grid" icon="⊞" active={showGrid} onClick={onGridToggle} />

      {onSkeletonToggle && (
        <>
          <Divider />
          <ToolBtn label="Skeleton" icon="⊛" active={!!showSkeleton} onClick={onSkeletonToggle} />
        </>
      )}

      <Divider />

      {/* Screenshot */}
      <button
        onClick={onScreenshot}
        title="Screenshot (PNG)"
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono border border-white/8 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400 transition-all duration-150"
      >
        <span className="text-sm">⊙</span>
        <span className="hidden sm:inline">Shot</span>
      </button>

      {/* Settings */}
      <ToolBtn label="Settings" icon="⚙" active={showSettings} onClick={onToggleSettings} />

      <span className="ml-auto text-[10px] font-mono text-slate-700 hidden lg:block shrink-0">
        Drag · Scroll · Right-drag
      </span>
    </div>
  );
}
