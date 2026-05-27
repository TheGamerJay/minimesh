import { useEffect, useState } from "react";
import { getProviderUsage, ProviderUsage } from "../../lib/admin";

function ProviderRow({ p }: { p: ProviderUsage }) {
  const total = p.generation_jobs + p.inspection_jobs + p.normalize_jobs + p.thumbnail_jobs;
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-200 font-mono">{p.provider}</span>
        <span className="ml-auto text-[10px] font-mono text-slate-500">{total} total</span>
        {p.failed_jobs > 0 && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            {p.failed_jobs} failed
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {p.generation_jobs > 0 && (
          <span className="text-[9px] font-mono text-cyan-400/80">gen:{p.generation_jobs}</span>
        )}
        {p.inspection_jobs > 0 && (
          <span className="text-[9px] font-mono text-violet-400/80">inspect:{p.inspection_jobs}</span>
        )}
        {p.normalize_jobs > 0 && (
          <span className="text-[9px] font-mono text-emerald-400/80">norm:{p.normalize_jobs}</span>
        )}
        {p.thumbnail_jobs > 0 && (
          <span className="text-[9px] font-mono text-amber-400/80">thumb:{p.thumbnail_jobs}</span>
        )}
      </div>
    </div>
  );
}

export default function ProviderUsagePanel() {
  const [providers, setProviders] = useState<ProviderUsage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProviderUsage()
      .then(setProviders)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">{error}</div>
  );

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-1">
      <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Provider Usage</h3>
      {providers.length === 0 ? (
        <p className="text-slate-500 font-mono text-xs">No provider activity recorded.</p>
      ) : (
        providers.map((p) => <ProviderRow key={p.provider} p={p} />)
      )}
    </div>
  );
}
