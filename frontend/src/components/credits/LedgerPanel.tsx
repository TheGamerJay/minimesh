import { LedgerEntry } from "../../lib/credits";

const CAT_COLOR: Record<string, string> = {
  generation: "text-cyan-400",
  rigging: "text-violet-400",
  animation: "text-amber-400",
  materials: "text-fuchsia-400",
  exports: "text-emerald-400",
  bonus: "text-green-400",
  admin: "text-slate-400",
};

export default function LedgerPanel({ entries }: { entries: LedgerEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-xs text-slate-600 text-center py-6">
        No transactions yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {entries.map((e) => (
        <div
          key={e.id}
          className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02]"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-slate-300 truncate">{e.description}</span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono ${CAT_COLOR[e.category] ?? "text-slate-500"}`}>
                {e.category}
              </span>
              <span className="text-[10px] text-slate-600">
                {new Date(e.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-3">
            <span
              className={`text-sm font-mono font-bold tabular-nums ${e.amount < 0 ? "text-red-400" : "text-emerald-400"}`}
            >
              {e.amount > 0 ? "+" : ""}{e.amount}
            </span>
            <span className="text-[10px] font-mono text-slate-600">→ {e.balance_after}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
