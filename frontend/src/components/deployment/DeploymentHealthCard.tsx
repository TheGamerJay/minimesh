interface Props {
  label: string;
  status: "ok" | "warning" | "error" | "unknown";
  detail?: string;
}

const STATUS_DOT: Record<string, string> = {
  ok:      "bg-emerald-400",
  warning: "bg-amber-400",
  error:   "bg-red-400",
  unknown: "bg-slate-600",
};

const STATUS_TEXT: Record<string, string> = {
  ok:      "text-emerald-400",
  warning: "text-amber-400",
  error:   "text-red-400",
  unknown: "text-slate-500",
};

const STATUS_LABEL: Record<string, string> = {
  ok:      "OK",
  warning: "WARNING",
  error:   "FAIL",
  unknown: "UNKNOWN",
};

export default function DeploymentHealthCard({ label, status, detail }: Props) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <span className={`ml-auto text-[9px] font-mono font-bold ${STATUS_TEXT[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      {detail && (
        <p className="text-[10px] text-slate-500 font-mono pl-4">{detail}</p>
      )}
    </div>
  );
}
