import { useState, useEffect, useCallback } from "react";
import type { ProviderDetail } from "../lib/providers";
import { getProviderStatus } from "../lib/providers";
import ProviderCard from "../components/providers/ProviderCard";
import ProviderPriorityEditor from "../components/providers/ProviderPriorityEditor";

export default function ProviderSettings({ onBack }: { onBack: () => void }) {
  const [providers, setProviders] = useState<ProviderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getProviderStatus();
      setProviders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = providers.filter((p) => p.enabled && !p.stub).length;
  const realCount = providers.filter((p) => p.enabled && !p.stub && p.name !== "mock").length;

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
            <span className="text-cyan-400 text-lg">⬡</span>
            <span className="font-semibold text-slate-100">Provider Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-600">
            {realCount > 0 ? `${realCount} real provider${realCount !== 1 ? "s" : ""} active` : "Mock only"}
          </span>
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
            Phase 15 — Provider Registry
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="glass rounded-xl p-10 flex items-center justify-center">
              <span className="text-slate-500 font-mono text-sm animate-pulse">
                Loading providers...
              </span>
            </div>
          ) : (
            <>
              {/* Summary strip */}
              <div className="glass rounded-xl px-5 py-4 flex items-center gap-6 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Registered</span>
                  <span className="text-lg font-bold text-slate-200">{providers.length}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Active</span>
                  <span className="text-lg font-bold text-cyan-400">{activeCount}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Real APIs</span>
                  <span className="text-lg font-bold text-emerald-400">{realCount}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Stubs</span>
                  <span className="text-lg font-bold text-slate-500">
                    {providers.filter((p) => p.stub).length}
                  </span>
                </div>
                <div className="ml-auto">
                  <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs">
                    Stubs are placeholders for future provider integrations. Add an API key in{" "}
                    <span className="font-mono text-slate-500">.env</span> to activate a real provider.
                  </p>
                </div>
              </div>

              {/* Provider cards */}
              <div>
                <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
                  Registered Providers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {providers.map((p) => (
                    <ProviderCard key={p.name} provider={p} onRefresh={load} />
                  ))}
                </div>
              </div>

              {/* Priority editor */}
              <div>
                <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
                  Fallback Chain
                </h2>
                <ProviderPriorityEditor providers={providers} onRefresh={load} />
              </div>

              {/* Info panel */}
              <div className="glass rounded-xl p-5 flex flex-col gap-3">
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  How Provider Selection Works
                </h3>
                <div className="flex flex-col gap-2 text-[12px] text-slate-400 leading-relaxed">
                  <p>
                    When a generation job starts, MiniMesh walks the priority list from top to bottom.
                    The first provider that is <span className="text-slate-300">enabled</span>,{" "}
                    <span className="text-slate-300">not a stub</span>, supports the task, and has a{" "}
                    <span className="text-slate-300">valid API key</span> is used.
                  </p>
                  <p>
                    If that provider fails during submit, it is logged as{" "}
                    <span className="font-mono text-amber-500/80">{"<name>_failed"}</span> in the job's
                    attempt chain and the next provider is tried. Mock is always the final fallback.
                  </p>
                  <p>
                    To activate Meshy: add{" "}
                    <span className="font-mono text-cyan-500/80">MESHY_API_KEY=your_key</span> to your{" "}
                    <span className="font-mono text-slate-300">.env</span> file and restart the backend.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
