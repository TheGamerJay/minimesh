import { Job } from "../../lib/jobs";
import { EnvironmentPreset, ENVIRONMENT_PRESETS } from "../../lib/viewerEnvironments";

interface ViewerStatusBarProps {
  isMock: boolean;
  job?: Job | null;
  glbLoaded?: boolean;
  turntableActive?: boolean;
  normalized?: boolean;
  glbError?: boolean;
  environment?: EnvironmentPreset;
}

export default function ViewerStatusBar({
  isMock,
  job,
  glbLoaded,
  turntableActive,
  normalized,
  glbError,
  environment = "studio_dark",
}: ViewerStatusBarProps) {
  const hasProgress =
    !isMock &&
    job?.status === "processing" &&
    typeof job.progress === "number" &&
    job.progress > 0;

  return (
    <div className="h-8 border-t border-white/5 bg-black/30 px-4 flex items-center gap-3 shrink-0 overflow-x-auto">
      <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Preview Active
      </span>

      <span className="text-[10px] font-mono text-slate-700">·</span>

      {/* Model state badge */}
      {glbError ? (
        <span className="text-[10px] font-mono text-red-500 shrink-0">
          GLB failed — fallback preview active
        </span>
      ) : glbLoaded ? (
        <span className="text-[10px] font-mono text-emerald-500 shrink-0">Real GLB Loaded</span>
      ) : (
        <span className="text-[10px] font-mono text-slate-500 shrink-0">Placeholder Mesh</span>
      )}

      {glbLoaded && normalized && (
        <>
          <span className="text-[10px] font-mono text-slate-700">·</span>
          <span className="text-[10px] font-mono text-cyan-600 shrink-0">NORMALIZED</span>
        </>
      )}

      {turntableActive && (
        <>
          <span className="text-[10px] font-mono text-slate-700">·</span>
          <span className="text-[10px] font-mono text-violet-400 shrink-0">TURNTABLE ACTIVE</span>
        </>
      )}

      <span className="text-[10px] font-mono text-slate-700">·</span>

      {isMock ? (
        <span className="text-[10px] font-mono text-yellow-600 shrink-0">
          Mock provider — placeholder preview only
        </span>
      ) : hasProgress ? (
        <span className="text-[10px] font-mono text-cyan-500 shrink-0">
          Meshy generating… {job!.progress}%
        </span>
      ) : (
        <span className="text-[10px] font-mono text-emerald-600 shrink-0">
          Meshy provider active
        </span>
      )}

      <span className="text-[10px] font-mono text-slate-700">·</span>
      <span className="text-[10px] font-mono text-slate-600 shrink-0">
        {ENVIRONMENT_PRESETS[environment]?.label ?? environment}
      </span>

      <span className="ml-auto text-[10px] font-mono text-slate-700 shrink-0">Phase 17</span>
    </div>
  );
}
