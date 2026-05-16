import { WorkerHealth } from "../../lib/workers";

interface Props {
  health: WorkerHealth | null;
}

export default function BlenderStatusPanel({ health }: Props) {
  return (
    <div className="p-3 border-b border-white/5 shrink-0">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2.5">
        Blender Bridge
      </span>

      {!health ? (
        <p className="text-[10px] font-mono text-slate-700">Checking Blender…</p>
      ) : health.blender_available ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400">Blender Detected</span>
          </div>
          <InfoRow label="Version" value={health.blender_version} />
          <InfoRow label="Path" value={health.blender_path} mono truncate />
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-mono text-amber-400">Not Found</span>
          </div>
          <div className="px-2 py-1.5 rounded border border-yellow-500/15 bg-yellow-500/5">
            <p className="text-[9px] font-mono text-yellow-600 leading-relaxed">
              Blender not configured — worker running in mock mode.
              Set <span className="text-yellow-500">BLENDER_PATH</span> in{" "}
              <span className="text-yellow-500">backend/.env</span> to enable real operations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label, value, mono, truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[9px] font-mono text-slate-600 shrink-0">{label}</span>
      <span
        className={[
          "text-[9px] text-right",
          mono ? "font-mono text-slate-400" : "text-slate-300",
          truncate ? "truncate max-w-[160px]" : "",
        ].join(" ")}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
