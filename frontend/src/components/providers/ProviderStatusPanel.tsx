import { useEffect, useState } from "react";
import { ProviderCapabilities, ProviderConfig, getProviderStatus } from "../../lib/providers";

const CAP_LABELS: { key: keyof ProviderCapabilities; label: string }[] = [
  { key: "generation", label: "Generation" },
  { key: "textures", label: "Textures" },
  { key: "rigging", label: "Rigging" },
  { key: "animation", label: "Animation" },
];

function ProviderRow({ config }: { config: ProviderConfig }) {
  const statusColor = config.enabled
    ? "text-emerald-400"
    : config.api_key_present
    ? "text-amber-400"
    : "text-slate-600";

  const statusLabel = config.enabled
    ? "Connected"
    : config.api_key_present
    ? "Key set — checking"
    : "No API key";

  return (
    <div className="flex flex-col gap-2 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-200 capitalize">
            {config.display_name}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/8 text-slate-500">
            image-to-3D
          </span>
        </div>
        <span className={`text-[10px] font-mono ${statusColor}`}>{statusLabel}</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {CAP_LABELS.map(({ key, label }) => {
          const supported = config.capabilities[key];
          return (
            <span
              key={label}
              className={[
                "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                supported
                  ? "border-cyan-500/20 text-cyan-500/70 bg-cyan-500/5"
                  : "border-slate-800 text-slate-700",
              ].join(" ")}
            >
              {supported ? "✓" : "—"} {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function ProviderStatusPanel() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProviderStatus()
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-[10px] font-mono text-slate-600 px-1 animate-pulse">
        Loading provider status…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {providers.map((p) => (
        <ProviderRow key={p.name} config={p} />
      ))}
      {providers.length === 0 && (
        <p className="text-[10px] font-mono text-slate-600">No providers configured.</p>
      )}
    </div>
  );
}
