import { useState, useEffect, useCallback } from "react";
import {
  ProjectSummary,
  listProjects,
  createProject,
  duplicateProject,
  deleteProject,
  activateProject,
} from "../lib/library";
import ProjectCard from "../components/library/ProjectCard";
import CreateProjectModal from "../components/library/CreateProjectModal";

export default function ProjectManager({
  onBack,
  onActivated,
}: {
  onBack: () => void;
  onActivated?: (project: ProjectSummary) => void;
}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await listProjects());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(name: string, template: string) {
    setCreating(true);
    setError(null);
    try {
      await createProject(name, template);
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  async function handleActivate(projectId: string) {
    setError(null);
    try {
      const activated = await activateProject(projectId);
      await load();
      onActivated?.(activated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to activate project");
    }
  }

  async function handleDuplicate(projectId: string) {
    setError(null);
    try {
      await duplicateProject(projectId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to duplicate project");
    }
  }

  async function handleDelete(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteProject(projectId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete project");
    }
  }

  const activeProject = projects.find((p) => p.is_active);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm font-mono"
          >
            ← Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-violet-400 text-lg">⊞</span>
            <span className="font-semibold text-slate-100">Project Library</span>
          </div>
          {activeProject && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-xs text-cyan-400 font-mono">{activeProject.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-violet-500/30 text-violet-400 bg-violet-500/5">
            Phase 11 — Project Library
          </span>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm px-4 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-400 hover:border-cyan-400/70 hover:bg-cyan-500/5 transition-all duration-150 font-semibold"
          >
            + New Project
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="glass rounded-xl p-12 flex items-center justify-center">
              <span className="text-slate-500 font-mono text-sm animate-pulse">
                Loading projects...
              </span>
            </div>
          ) : projects.length === 0 ? (
            <div className="glass rounded-xl p-12 flex flex-col items-center gap-4 text-center">
              <span className="text-4xl text-slate-700">⊞</span>
              <div>
                <p className="text-slate-300 font-semibold">No projects yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Create your first MiniMesh project to get started.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 text-sm px-5 py-2 rounded-lg border border-cyan-500/40 text-cyan-400 hover:border-cyan-400/70 hover:bg-cyan-500/5 transition-all duration-150 font-semibold"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
                  Projects ({projects.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {projects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onOpen={() => handleActivate(p.id)}
                      onActivate={() => handleActivate(p.id)}
                      onDuplicate={() => handleDuplicate(p.id)}
                      onDelete={() => handleDelete(p.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateProjectModal
          creating={creating}
          onConfirm={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
