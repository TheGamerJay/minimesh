interface Props {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: "cyan" | "violet" | "emerald" | "amber" | "red" | "slate";
}

const COLOR_MAP: Record<string, string> = {
  cyan:    "text-cyan-400",
  violet:  "text-violet-400",
  emerald: "text-emerald-400",
  amber:   "text-amber-400",
  red:     "text-red-400",
  slate:   "text-slate-400",
};

export default function AdminOverviewCard({ icon, label, value, sub, color = "cyan" }: Props) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`text-base ${COLOR_MAP[color]}`}>{icon}</span>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-bold font-mono ${COLOR_MAP[color]}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 font-mono">{sub}</p>}
    </div>
  );
}
