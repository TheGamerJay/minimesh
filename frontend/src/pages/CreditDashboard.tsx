import { useState, useEffect, useCallback } from "react";
import {
  CreditWallet,
  LedgerEntry,
  PricingConfig,
  getWallet,
  getLedger,
  getPricing,
  mockAddCredits,
} from "../lib/credits";
import { useCredits } from "../lib/creditContext";
import LedgerPanel from "../components/credits/LedgerPanel";
import PricingPanel from "../components/credits/PricingPanel";

const MOCK_AMOUNTS = [100, 500, 1000];

function WalletSummary({ wallet }: { wallet: CreditWallet }) {
  const color =
    wallet.balance >= 200 ? "text-emerald-400" : wallet.balance >= 50 ? "text-amber-400" : "text-red-400";
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
            Balance
          </span>
          <span className={`text-5xl font-black tabular-nums ${color}`}>{wallet.balance}</span>
          <span className="text-xs text-slate-600 mt-0.5">credits</span>
        </div>
        <div className="flex flex-col gap-2 ml-auto">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Total Spent</span>
            <span className="font-mono font-bold text-red-400 tabular-nums">{wallet.total_spent}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Total Added</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">{wallet.total_added}</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">
            Updated {new Date(wallet.updated_at).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CreditDashboard({ onBack }: { onBack: () => void }) {
  const { refresh: refreshGlobal } = useCredits();
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, l, p] = await Promise.all([getWallet(), getLedger(), getPricing()]);
      setWallet(w);
      setLedger(l);
      setPricing(p);
    } catch {
      setError("Failed to load credit data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleMockAdd(amount: number) {
    setAdding(true);
    setError(null);
    try {
      const w = await mockAddCredits(amount);
      setWallet(w);
      refreshGlobal();
      const l = await getLedger();
      setLedger(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add credits");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col">
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
            <span className="font-semibold text-slate-100">Credits & Usage</span>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
          Phase 13 — Local Credit Wallet
        </span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="glass rounded-xl p-12 flex items-center justify-center">
              <span className="text-slate-500 font-mono text-sm animate-pulse">Loading...</span>
            </div>
          ) : (
            <>
              {wallet && <WalletSummary wallet={wallet} />}

              {/* Mock checkout */}
              <div className="glass rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    Mock Checkout
                  </h3>
                  <span className="text-[10px] font-mono text-amber-500/70 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded">
                    Development only
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Add mock credits to your local development wallet. This simulates future Stripe checkout.
                </p>
                <div className="flex gap-3">
                  {MOCK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleMockAdd(amt)}
                      disabled={adding}
                      className="flex-1 py-3 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-bold hover:border-violet-400/60 hover:bg-violet-500/5 transition-all duration-150 disabled:opacity-50"
                    >
                      +{amt} Credits
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing table */}
              {pricing && (
                <div className="glass rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    Action Pricing
                  </h3>
                  <PricingPanel pricing={pricing} />
                </div>
              )}

              {/* Ledger */}
              <div className="glass rounded-xl p-5 flex flex-col gap-4">
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  Transaction Ledger ({ledger.length})
                </h3>
                <LedgerPanel entries={ledger} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
