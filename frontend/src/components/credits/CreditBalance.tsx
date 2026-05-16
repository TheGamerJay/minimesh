import { useState } from "react";
import { mockAddCredits } from "../../lib/credits";
import { useCredits } from "../../lib/creditContext";

export default function CreditBalance({ onNavigate }: { onNavigate?: () => void }) {
  const { balance, refresh } = useCredits();
  const [adding, setAdding] = useState(false);

  async function handleQuickAdd() {
    setAdding(true);
    try {
      await mockAddCredits(500);
      refresh();
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  }

  if (balance === null) return null;

  const color =
    balance >= 200 ? "text-emerald-400" : balance >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onNavigate}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-all duration-150"
      >
        <span className="text-xs">⬡</span>
        <span className={`text-xs font-mono font-bold tabular-nums ${color}`}>{balance}</span>
        <span className="text-[10px] text-slate-600">cr</span>
      </button>
      <button
        onClick={handleQuickAdd}
        disabled={adding}
        title="Add 500 dev credits"
        className="px-2 py-1 rounded-lg border border-violet-500/20 text-violet-400 text-[10px] font-mono hover:border-violet-400/40 hover:bg-violet-500/5 transition-all duration-150 disabled:opacity-50"
      >
        {adding ? "…" : "+500"}
      </button>
    </div>
  );
}
