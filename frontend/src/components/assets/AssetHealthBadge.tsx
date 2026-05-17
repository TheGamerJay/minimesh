import { qaStatusLabel } from "../../lib/assetQA";

interface Props {
  status: string;
  score?: number | null;
  size?: "sm" | "xs";
}

const STATUS_CLASSES: Record<string, string> = {
  healthy:     "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  needs_work:  "bg-amber-500/10 border-amber-500/30 text-amber-400",
  problematic: "bg-red-500/10 border-red-500/30 text-red-400",
};

const DOT_CLASSES: Record<string, string> = {
  healthy:     "bg-emerald-400",
  needs_work:  "bg-amber-400",
  problematic: "bg-red-400",
};

export default function AssetHealthBadge({ status, score, size = "xs" }: Props) {
  const cls = STATUS_CLASSES[status] ?? STATUS_CLASSES.needs_work;
  const dot = DOT_CLASSES[status] ?? DOT_CLASSES.needs_work;
  const textSize = size === "sm" ? "text-[11px]" : "text-[9px]";

  return (
    <span className={`inline-flex items-center gap-1 font-mono px-1.5 py-0.5 rounded border ${cls} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {qaStatusLabel(status)}
      {score != null && <span className="opacity-70">·{score}</span>}
    </span>
  );
}
