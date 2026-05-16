import type { ProviderDetail } from "../../lib/providers";

const HEALTH_STYLES: Record<string, { dot: string; text: string; border: string; bg: string }> = {
  healthy:  { dot: "bg-emerald-400", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
  degraded: { dot: "bg-amber-400 animate-pulse", text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5" },
  offline:  { dot: "bg-red-500", text: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/5" },
  disabled: { dot: "bg-slate-600", text: "text-slate-500", border: "border-slate-700", bg: "bg-slate-800/30" },
  unknown:  { dot: "bg-slate-600", text: "text-slate-500", border: "border-slate-700", bg: "bg-slate-800/30" },
};

const HEALTH_LABELS: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  offline: "Offline",
  disabled: "Disabled",
  unknown: "Unknown",
};

export default function ProviderHealthBadge({
  status,
}: {
  status: ProviderDetail["health_status"];
}) {
  const s = HEALTH_STYLES[status] ?? HEALTH_STYLES.unknown;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border",
        s.text, s.border, s.bg,
      ].join(" ")}
    >
      <span className={["w-1.5 h-1.5 rounded-full flex-shrink-0", s.dot].join(" ")} />
      {HEALTH_LABELS[status] ?? status}
    </span>
  );
}
