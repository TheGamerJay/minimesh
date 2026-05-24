interface EnvInfo {
  port: number;
  storage_path: string;
  storage_ephemeral: boolean;
  meshy_key_present: boolean;
  tripo_key_present: boolean;
  rodin_key_present: boolean;
  blender_path: string | null;
  app_env: string;
}

interface Props {
  env: EnvInfo;
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-mono text-slate-500 w-28 shrink-0">{label}</span>
      <span className={`text-[10px] font-mono break-all ${ok === false ? "text-amber-400" : ok === true ? "text-emerald-400" : "text-slate-300"}`}>
        {value}
      </span>
    </div>
  );
}

export default function EnvironmentStatusPanel({ env }: Props) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-1">
      <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
        Environment
      </h3>
      <Row label="APP_ENV"    value={env.app_env} ok={env.app_env === "production"} />
      <Row label="PORT"       value={String(env.port)} />
      <Row label="MESHY_KEY"  value={env.meshy_key_present ? "configured ✓" : "not set"}  ok={env.meshy_key_present} />
      <Row label="TRIPO_KEY"  value={env.tripo_key_present ? "configured ✓" : "not set"}  ok={env.tripo_key_present} />
      <Row label="RODIN_KEY"  value={env.rodin_key_present ? "configured ✓" : "not set"}  ok={env.rodin_key_present} />
      <Row label="BLENDER"    value={env.blender_path ?? "not set (fallback)"}             ok={!!env.blender_path} />
    </div>
  );
}
