import { useState } from "react";
import type { ProviderDetail, ProviderTestResult } from "../../lib/providers";
import { testProvider, setProviderEnabled } from "../../lib/providers";
import ProviderHealthBadge from "./ProviderHealthBadge";

const CAP_ICONS: Record<string, string> = {
  generation: "⬡",
  rigging: "⚙",
  animation: "▶",
  textures: "◉",
};

const CAP_LABELS: Record<string, string> = {
  generation: "Generation",
  rigging: "Rigging",
  animation: "Animation",
  textures: "Textures",
};

interface Props {
  provider: ProviderDetail;
  onRefresh: () => void;
}

export default function ProviderCard({ provider, onRefresh }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ProviderTestResult | null>(null);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMock = provider.name === "mock";
  const caps = Object.entries(provider.capabilities) as [keyof typeof provider.capabilities, boolean][];

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const result = await testProvider(provider.name);
      setTestResult(result);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    setError(null);
    try {
      await setProviderEnabled(provider.name, !provider.enabled);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className={[
      "glass rounded-xl p-5 flex flex-col gap-4 transition-all duration-200",
      !provider.enabled && !isMock ? "opacity-60" : "",
    ].join(" ")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100 text-sm">{provider.display_name}</span>
            {provider.stub && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700 text-slate-500 bg-slate-800/50">
                STUB
              </span>
            )}
            {isMock && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-violet-700/40 text-violet-500 bg-violet-900/20">
                FALLBACK
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{provider.description}</p>
        </div>
        <ProviderHealthBadge status={provider.health_status} />
      </div>

      {/* API Key + Priority */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={[
          "text-[10px] font-mono px-2 py-0.5 rounded border",
          provider.api_key_present
            ? "border-emerald-700/40 text-emerald-500 bg-emerald-900/20"
            : "border-slate-700 text-slate-600 bg-slate-800/30",
        ].join(" ")}>
          {provider.api_key_present ? "● Key Present" : "○ No Key"}
        </span>
        <span className="text-[10px] font-mono text-slate-600">
          Priority #{provider.priority_order + 1}
        </span>
        <span className={[
          "text-[10px] font-mono px-2 py-0.5 rounded border",
          provider.enabled
            ? "border-cyan-700/40 text-cyan-500 bg-cyan-900/20"
            : "border-slate-700 text-slate-600 bg-slate-800/30",
        ].join(" ")}>
          {provider.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-2">
        {caps.map(([cap, supported]) => (
          <span
            key={cap}
            className={[
              "text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1",
              supported
                ? "border-violet-700/40 text-violet-400 bg-violet-900/10"
                : "border-slate-800 text-slate-700",
            ].join(" ")}
          >
            <span>{CAP_ICONS[cap]}</span>
            {CAP_LABELS[cap]}
          </span>
        ))}
      </div>

      {/* Test result */}
      {testResult && (
        <div className={[
          "rounded-lg border px-3 py-2 text-xs font-mono",
          testResult.status === "healthy" ? "border-emerald-700/40 text-emerald-400 bg-emerald-900/10" :
          testResult.status === "degraded" ? "border-amber-700/40 text-amber-400 bg-amber-900/10" :
          "border-red-700/40 text-red-400 bg-red-900/10",
        ].join(" ")}>
          <div className="flex items-center justify-between gap-2">
            <span>{testResult.message}</span>
            {testResult.latency_ms !== null && testResult.latency_ms !== undefined && (
              <span className="text-slate-600">{testResult.latency_ms} ms</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-400 font-mono">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1 border-t border-white/5">
        <button
          onClick={handleTest}
          disabled={testing}
          className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? "Testing..." : "Test Provider"}
        </button>
        {!isMock && (
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={[
              "text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
              provider.enabled
                ? "border-slate-700 text-slate-400 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5"
                : "border-emerald-700/40 text-emerald-400 hover:border-emerald-400/60 hover:bg-emerald-500/5",
            ].join(" ")}
          >
            {toggling ? "..." : provider.enabled ? "Disable" : "Enable"}
          </button>
        )}
      </div>
    </div>
  );
}
