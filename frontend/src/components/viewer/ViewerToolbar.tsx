type MaterialMode = "solid" | "wireframe" | "toon";

interface ViewerToolbarProps {
  materialMode: MaterialMode;
  autoRotate: boolean;
  showGrid: boolean;
  showSkeleton?: boolean;
  onResetCamera: () => void;
  onMaterialMode: (m: MaterialMode) => void;
  onAutoRotateToggle: () => void;
  onGridToggle: () => void;
  onSkeletonToggle?: () => void;
}

function ToolBtn({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={[
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all duration-150",
        active
          ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
          : "border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300",
      ].join(" ")}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function ViewerToolbar({
  materialMode,
  autoRotate,
  showGrid,
  showSkeleton,
  onResetCamera,
  onMaterialMode,
  onAutoRotateToggle,
  onGridToggle,
  onSkeletonToggle,
}: ViewerToolbarProps) {
  return (
    <div className="h-11 border-b border-white/5 bg-black/40 px-4 flex items-center gap-2 shrink-0">
      {/* Camera */}
      <ToolBtn label="Reset Camera" icon="↺" onClick={onResetCamera} />

      <div className="w-px h-5 bg-white/8 mx-1" />

      {/* Material modes */}
      <ToolBtn
        label="Solid"
        icon="◉"
        active={materialMode === "solid"}
        onClick={() => onMaterialMode("solid")}
      />
      <ToolBtn
        label="Wireframe"
        icon="△"
        active={materialMode === "wireframe"}
        onClick={() => onMaterialMode("wireframe")}
      />
      <ToolBtn
        label="Toon"
        icon="◈"
        active={materialMode === "toon"}
        onClick={() => onMaterialMode("toon")}
      />

      <div className="w-px h-5 bg-white/8 mx-1" />

      {/* Rotation + Grid */}
      <ToolBtn
        label="Auto Rotate"
        icon="↻"
        active={autoRotate}
        onClick={onAutoRotateToggle}
      />
      <ToolBtn
        label="Grid"
        icon="⊞"
        active={showGrid}
        onClick={onGridToggle}
      />

      {onSkeletonToggle && (
        <>
          <div className="w-px h-5 bg-white/8 mx-1" />
          <ToolBtn
            label="Skeleton"
            icon="⊛"
            active={!!showSkeleton}
            onClick={onSkeletonToggle}
          />
        </>
      )}

      <span className="ml-auto text-[10px] font-mono text-slate-700 hidden md:block">
        Drag to orbit · Scroll to zoom · Right-drag to pan
      </span>
    </div>
  );
}
