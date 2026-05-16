export default function AuditStrengthsPanel({ strengths }: { strengths: string[] }) {
  if (strengths.length === 0) return null;

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4">
      <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Strengths</h3>
      <ul className="flex flex-col gap-2">
        {strengths.map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="flex-shrink-0 text-emerald-400 mt-0.5">✓</span>
            <span className="text-sm text-slate-300 leading-relaxed">{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
