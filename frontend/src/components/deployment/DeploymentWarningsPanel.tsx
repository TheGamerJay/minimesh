interface Props {
  warnings: string[];
}

export default function DeploymentWarningsPanel({ warnings }: Props) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-2">
        <span className="text-emerald-400">✓</span>
        <p className="text-xs text-emerald-400 font-semibold">No deployment warnings.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col gap-2">
      <h3 className="text-[10px] font-mono text-amber-400/70 uppercase tracking-widest">
        Deployment Warnings ({warnings.length})
      </h3>
      {warnings.map((w, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-amber-400 shrink-0 mt-0.5">⚠</span>
          <p className="text-[11px] text-amber-300/80 leading-relaxed">{w}</p>
        </div>
      ))}
    </div>
  );
}
