import { useState } from "react";
import type { ProviderDetail } from "../../lib/providers";
import { updateProviderPriority } from "../../lib/providers";
import ProviderHealthBadge from "./ProviderHealthBadge";

interface Props {
  providers: ProviderDetail[];
  onRefresh: () => void;
}

export default function ProviderPriorityEditor({ providers, onRefresh }: Props) {
  const [order, setOrder] = useState<string[]>(() =>
    [...providers].sort((a, b) => a.priority_order - b.priority_order).map((p) => p.name)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byName = Object.fromEntries(providers.map((p) => [p.name, p]));

  function move(index: number, dir: -1 | 1) {
    const next = [...order];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setOrder(next);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProviderPriority(order);
      setSaved(true);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          Provider Priority
        </h3>
        <p className="text-[11px] text-slate-600">Fallback order ↓</p>
      </div>

      <div className="flex flex-col gap-2">
        {order.map((name, i) => {
          const p = byName[name];
          if (!p) return null;
          const isFirst = i === 0;
          const isLast = i === order.length - 1;
          return (
            <div
              key={name}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
            >
              <span className="text-xs font-mono text-slate-700 w-4 flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-200 font-medium">{p.display_name}</span>
                  {p.stub && (
                    <span className="text-[9px] font-mono text-slate-600 border border-slate-800 px-1 rounded">
                      STUB
                    </span>
                  )}
                  {name === "mock" && (
                    <span className="text-[9px] font-mono text-violet-600 border border-violet-900/40 px-1 rounded">
                      FALLBACK
                    </span>
                  )}
                </div>
              </div>
              <ProviderHealthBadge status={p.health_status} />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => move(i, -1)}
                  disabled={isFirst}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 disabled:opacity-20 disabled:cursor-default transition-all text-xs"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={isLast}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 disabled:opacity-20 disabled:cursor-default transition-all text-xs"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-4 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Order"}
        </button>
        {saved && (
          <span className="text-xs text-emerald-400 font-mono">Saved ✓</span>
        )}
      </div>
    </div>
  );
}
