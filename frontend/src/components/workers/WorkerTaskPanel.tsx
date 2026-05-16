import { WorkerTask, WORKER_TASK_TYPES } from "../../lib/workers";

interface Props {
  tasks: WorkerTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateTask: (taskType: string) => void;
  creating: boolean;
  selectedTaskType: string;
  onTaskTypeChange: (t: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  queued:    "text-yellow-500",
  running:   "text-cyan-400",
  completed: "text-emerald-400",
  failed:    "text-red-400",
};

const STATUS_DOTS: Record<string, string> = {
  queued:    "bg-yellow-500",
  running:   "bg-cyan-400",
  completed: "bg-emerald-400",
  failed:    "bg-red-400",
};

export default function WorkerTaskPanel({
  tasks, selectedId, onSelect, onCreateTask, creating, selectedTaskType, onTaskTypeChange,
}: Props) {
  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* Create task form */}
      <div className="p-3 border-b border-white/5 shrink-0 space-y-2">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
          Create Task
        </span>
        <select
          value={selectedTaskType}
          onChange={(e) => onTaskTypeChange(e.target.value)}
          className="w-full bg-gray-800/60 border border-gray-700/40 rounded px-2 py-1 text-[10px] text-gray-300 outline-none"
        >
          {WORKER_TASK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <p className="text-[9px] font-mono text-slate-700">
          {WORKER_TASK_TYPES.find((t) => t.value === selectedTaskType)?.description ?? ""}
        </p>
        <button
          onClick={() => onCreateTask(selectedTaskType)}
          disabled={creating}
          className={[
            "w-full py-1.5 rounded text-[10px] font-medium transition-colors",
            creating
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-500 text-white",
          ].join(" ")}
        >
          {creating ? "Queuing…" : "Run Task"}
        </button>
      </div>

      {/* Task queue list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider px-1 block mb-1">
          Queue ({tasks.length})
        </span>
        {tasks.length === 0 ? (
          <p className="text-[10px] font-mono text-slate-700 px-1">
            No tasks yet.
          </p>
        ) : (
          tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onSelect(task.id)}
              className={[
                "w-full text-left rounded border p-2 transition-colors",
                selectedId === task.id
                  ? "border-violet-500/40 bg-violet-600/10"
                  : "border-gray-700/30 bg-gray-800/20 hover:border-gray-600/50",
              ].join(" ")}
            >
              <div className="flex items-center gap-1.5">
                <span className={["w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOTS[task.status] ?? "bg-slate-500", task.status === "running" ? "animate-pulse" : ""].join(" ")} />
                <span className="text-[9px] font-mono text-slate-400 capitalize truncate flex-1">
                  {task.task_type.replace(/_/g, " ")}
                </span>
                <span className={["text-[9px] font-mono shrink-0", STATUS_COLORS[task.status] ?? "text-slate-500"].join(" ")}>
                  {task.status}
                </span>
              </div>
              <p className="text-[8px] font-mono text-slate-700 mt-0.5 pl-3">
                {new Date(task.created_at).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
