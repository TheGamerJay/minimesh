export default function AuditRecommendations({
  recommendations,
}: {
  recommendations: string[];
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4">
      <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Recommendations
      </h3>
      <ol className="flex flex-col gap-3">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full border border-violet-500/40 text-violet-400 text-xs font-mono flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
