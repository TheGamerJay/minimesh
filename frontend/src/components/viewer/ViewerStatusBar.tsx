import { Job } from "../../lib/jobs";

interface ViewerStatusBarProps {
  isMock: boolean;
  job?: Job | null;
  glbLoaded?: boolean;
}

export default function ViewerStatusBar({ isMock, job, glbLoaded }: ViewerStatusBarProps) {
  const hasProgress = !isMock && job?.status === "processing" && typeof job.progress === "number" && job.progress > 0;

  return (
    <div className="h-8 border-t border-white/5 bg-black/30 px-4 flex items-center gap-4 shrink-0">
      <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Preview Mode Active
      </span>

      <span className="text-[10px] font-mono text-slate-600">·</span>

      <span className="text-[10px] font-mono text-slate-500">
        {glbLoaded ? "Real GLB Loaded" : "Placeholder Mesh"}
      </span>

      <span className="text-[10px] font-mono text-slate-600">·</span>

      {isMock ? (
        <span className="text-[10px] font-mono text-yellow-600">
          Mock provider — placeholder preview only
        </span>
      ) : hasProgress ? (
        <span className="text-[10px] font-mono text-cyan-500">
          Meshy generating… {job!.progress}%
        </span>
      ) : (
        <span className="text-[10px] font-mono text-emerald-600">
          Meshy provider active
        </span>
      )}

      <span className="ml-auto text-[10px] font-mono text-slate-700">Phase 14</span>
    </div>
  );
}
