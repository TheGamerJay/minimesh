import { useEffect, useState } from "react";
import { getStorageUsage, StorageUsage, formatBytes } from "../../lib/admin";
import AdminOverviewCard from "./AdminOverviewCard";

export default function StorageUsagePanel() {
  const [data, setData] = useState<StorageUsage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStorageUsage()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">{error}</div>
  );

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-3">
      <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Storage Usage</h3>
      {data ? (
        <div className="grid grid-cols-2 gap-2">
          <AdminOverviewCard icon="◎" label="Users" value={data.total_users} color="cyan" />
          <AdminOverviewCard icon="⊞" label="Projects" value={data.total_projects} color="violet" />
          <AdminOverviewCard icon="◈" label="Assets" value={data.total_assets} color="emerald" />
          <AdminOverviewCard icon="⬇" label="Exports" value={data.total_exports} color="amber" />
          <div className="col-span-2">
            <AdminOverviewCard
              icon="◉"
              label="Disk Usage"
              value={formatBytes(data.total_storage_bytes)}
              sub="storage/ + exports/ combined"
              color="slate"
            />
          </div>
        </div>
      ) : (
        <p className="text-slate-500 font-mono text-xs animate-pulse">Scanning storage…</p>
      )}
    </div>
  );
}
