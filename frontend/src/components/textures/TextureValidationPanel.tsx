import { TextureValidationResult } from "../../lib/bakes";

interface Props {
  validation: TextureValidationResult | null;
  loading: boolean;
}

export default function TextureValidationPanel({ validation, loading }: Props) {
  const allGood = validation?.ready && validation.suggestions.length === 0;

  return (
    <div className="flex-1 min-w-0 border-r border-white/5 p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Texture Validation</span>
        {validation && (
          <span className={[
            "text-[9px] font-mono px-1.5 py-0.5 rounded border",
            validation.ready
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20",
          ].join(" ")}>
            {validation.ready ? "Bake Ready" : "Issues Found"}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-[10px] text-slate-600 font-mono">Validating…</p>
      ) : !validation ? (
        <p className="text-[10px] text-slate-700 font-mono">Assign textures to run validation.</p>
      ) : allGood ? (
        <div className="px-2 py-2 rounded border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[9px] font-mono text-emerald-500">All PBR channels look good — ready to bake.</p>
        </div>
      ) : (
        <>
          {validation.warnings.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-mono text-red-500/70 uppercase tracking-wider">Warnings</div>
              {validation.warnings.map((w, i) => (
                <div key={i} className="flex gap-1.5 text-[9px] font-mono text-red-400/80">
                  <span className="shrink-0">✕</span><span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {validation.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">Suggestions</div>
              {validation.suggestions.map((s, i) => (
                <div key={i} className="flex gap-1.5 text-[9px] font-mono text-slate-500">
                  <span className="shrink-0">·</span><span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
