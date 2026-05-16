import { useEffect, useRef } from "react";
import { WorkerTask } from "../../lib/workers";

interface Props {
  task: WorkerTask | null;
  loading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  queued:    "text-yellow-500",
  running:   "text-cyan-400",
  completed: "text-emerald-400",
  failed:    "text-red-400",
};

export default function WorkerLogViewer({ task, loading }: Props) {
  const logRef = useRef<HTMLPreElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [task?.logs]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Log header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Log Viewer
        </span>
        {task ? (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-600 capitalize">
              {task.task_type.replace(/_/g, " ")}
            </span>
            <span className={["text-[9px] font-mono", STATUS_COLORS[task.status] ?? "text-slate-500"].join(" ")}>
              {task.status}
            </span>
            {task.status === "running" && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </div>
        ) : (
          <span className="text-[9px] font-mono text-slate-700">no task selected</span>
        )}
      </div>

      {/* Log output */}
      <pre
        ref={logRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed bg-black/20 text-slate-400 whitespace-pre-wrap"
      >
        {loading
          ? "Loading logs…"
          : !task
          ? "Select a task from the queue to view its logs."
          : !task.logs
          ? "No logs yet — task may still be initializing."
          : task.logs}
      </pre>
    </div>
  );
}
