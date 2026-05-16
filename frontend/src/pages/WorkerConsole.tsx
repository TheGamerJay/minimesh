import { useState, useEffect, useCallback } from "react";
import {
  WorkerTask,
  WorkerHealth,
  getWorkerHealth,
  createWorkerTask,
  listWorkerTasks,
  getWorkerTask,
} from "../lib/workers";
import WorkerHealthCard from "../components/workers/WorkerHealthCard";
import BlenderStatusPanel from "../components/workers/BlenderStatusPanel";
import WorkerTaskPanel from "../components/workers/WorkerTaskPanel";
import WorkerLogViewer from "../components/workers/WorkerLogViewer";

interface Props {
  onBack: () => void;
}

export default function WorkerConsole({ onBack }: Props) {
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkerTask | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState("glb_inspect");
  const [error, setError] = useState<string | null>(null);

  const refreshHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      setHealth(await getWorkerHealth());
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      setTasks(await listWorkerTasks());
    } catch {}
  }, []);

  // Initial load
  useEffect(() => {
    refreshHealth();
    refreshTasks();
  }, [refreshHealth, refreshTasks]);

  // Poll selected task logs every 2s while it is not terminal
  useEffect(() => {
    if (!selectedTaskId) { setSelectedTask(null); return; }
    if (selectedTask?.status === "completed" || selectedTask?.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const updated = await getWorkerTask(selectedTaskId);
        setSelectedTask(updated);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        if (updated.status === "completed" || updated.status === "failed") {
          clearInterval(interval);
          refreshHealth();
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskId, selectedTask?.status, refreshHealth]);

  async function handleSelectTask(id: string) {
    setSelectedTaskId(id);
    const cached = tasks.find((t) => t.id === id) ?? null;
    setSelectedTask(cached);
    if (cached?.status !== "completed" && cached?.status !== "failed") {
      setLogLoading(true);
      try {
        setSelectedTask(await getWorkerTask(id));
      } catch {}
      setLogLoading(false);
    }
  }

  async function handleCreate(taskType: string) {
    setCreating(true);
    setError(null);
    try {
      const task = await createWorkerTask(taskType);
      setTasks((prev) => [task, ...prev]);
      // Auto-select the new task to show its logs
      setSelectedTaskId(task.id);
      setSelectedTask(task);
    } catch (e: any) {
      setError(e.message ?? "Failed to create task");
    }
    setCreating(false);
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-[52px] shrink-0 border-b border-white/5 px-5 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-cyan-400 transition-colors font-mono"
        >
          ← Back
        </button>
        <div className="h-4 w-px bg-white/8" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
            W
          </div>
          <span className="font-bold tracking-tight">MiniMesh</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">Worker Console</span>
        </div>

        <div className="ml-4 px-3 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-[10px] font-mono text-yellow-600 hidden md:block">
          Safe mock tasks only — real Blender automation arrives in future phases
        </div>

        {error && (
          <div className="ml-2 px-2.5 py-1 rounded border border-red-500/30 text-[10px] font-mono text-red-400 max-w-xs truncate">
            {error}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {health && (
            <span className={[
              "text-[10px] font-mono px-2 py-1 rounded border",
              health.worker_online
                ? "border-emerald-500/30 text-emerald-400"
                : "border-red-500/30 text-red-400",
            ].join(" ")}>
              {health.worker_online ? "Online" : "Offline"}
            </span>
          )}
          <span className="text-xs font-mono text-slate-700">Phase 21</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: health + blender + task queue */}
        <div className="w-72 shrink-0 border-r border-white/5 flex flex-col overflow-hidden">
          <WorkerHealthCard
            health={health}
            loading={healthLoading}
            onRefresh={refreshHealth}
          />
          <BlenderStatusPanel health={health} />
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <WorkerTaskPanel
              tasks={tasks}
              selectedId={selectedTaskId}
              onSelect={handleSelectTask}
              onCreateTask={handleCreate}
              creating={creating}
              selectedTaskType={selectedTaskType}
              onTaskTypeChange={setSelectedTaskType}
            />
          </div>
        </div>

        {/* Right: log viewer + disclaimer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <WorkerLogViewer task={selectedTask} loading={logLoading} />

          {/* Footer disclaimer */}
          <div className="shrink-0 px-4 py-2 border-t border-white/5 bg-gray-900/20">
            <p className="text-[9px] font-mono text-slate-700 leading-relaxed">
              Worker Console currently runs safe mock tasks only. Real Blender mesh automation will
              arrive in future phases. To configure Blender: set{" "}
              <span className="text-slate-600">BLENDER_PATH=/path/to/blender</span> in{" "}
              <span className="text-slate-600">backend/.env</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
