import { useState } from "react";
import { mockAddCredits, parseCreditError } from "../../lib/credits";
import { useCredits } from "../../lib/creditContext";

export default function InsufficientCreditsModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const { balance, refresh } = useCredits();
  const [adding, setAdding] = useState(false);
  const parsed = parseCreditError(message);

  async function handleAdd(amount: number) {
    setAdding(true);
    try {
      await mockAddCredits(amount);
      refresh();
      onClose();
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 border border-red-500/20">
        <div className="flex items-start gap-3">
          <span className="text-red-400 text-xl mt-0.5">⬡</span>
          <div>
            <h3 className="text-base font-bold text-slate-100">Insufficient Credits</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border border-white/8 bg-white/[0.02] py-3">
            <p className="text-[10px] text-slate-500 mb-1">Current Balance</p>
            <p className="text-xl font-black tabular-nums text-red-400">{balance ?? parsed?.have ?? "—"}</p>
          </div>
          {parsed && (
            <div className="rounded-lg border border-white/8 bg-white/[0.02] py-3">
              <p className="text-[10px] text-slate-500 mb-1">Cost</p>
              <p className="text-xl font-black tabular-nums text-cyan-400">{parsed.need}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-mono text-slate-500 text-center">
            Development mock wallet only
          </p>
          <div className="flex gap-2">
            {[100, 500, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => handleAdd(amt)}
                disabled={adding}
                className="flex-1 py-2 rounded-lg border border-violet-500/30 text-violet-400 text-xs font-semibold hover:border-violet-400/60 hover:bg-violet-500/5 transition-all duration-150 disabled:opacity-50"
              >
                +{amt}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="py-2 rounded-lg border border-white/10 text-slate-400 text-sm hover:border-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
