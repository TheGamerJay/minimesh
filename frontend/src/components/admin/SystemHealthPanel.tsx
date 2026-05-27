import { useEffect, useState } from "react";
import { getSystemHealth, SystemHealth } from "../../lib/admin";

function HealthRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
      <span className="text-xs text-slate-300 w-36 shrink-0">{label}</span>
      <span className={`text-[10px] font-mono ${ok ? "text-emerald-400" : "text-red-400"}`}>
        {ok ? "OK" : "FAIL"}
      </span>
      {detail && <span className="text-[10px] text-slate-600 font-mono ml-auto truncate">{detail}</span>}
    </div>
  );
}

export default function SystemHealthPanel() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSystemHealth()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">{error}</div>
  );

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-1">
      <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">System Health</h3>
      {data ? (
        <>
          <HealthRow label="Storage Writable" ok={data.storage_writable} />
          <HealthRow label="Auth Storage" ok={data.auth_storage} />
          <HealthRow label="Provider Registry" ok={data.provider_registry} />
          <HealthRow label="Blender" ok={data.blender_available} detail={data.blender_version || "not found"} />
          <HealthRow label="Worker" ok={data.worker_online} detail={`queue: ${data.queue_size} | active: ${data.active_tasks}`} />
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500">Audit events (7d)</span>
            <span className="text-[10px] font-mono text-cyan-400 ml-auto">{data.audit_events_7d}</span>
          </div>
        </>
      ) : (
        <p className="text-slate-500 font-mono text-xs animate-pulse">Checking systems…</p>
      )}
    </div>
  );
}
