interface Props {
  storagePath: string;
  storageWritable: boolean;
  storageEphemeral: boolean;
}

export default function StorageStatusPanel({ storagePath, storageWritable, storageEphemeral }: Props) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-3">
      <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        Storage
      </h3>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${storageWritable ? "bg-emerald-400" : "bg-red-400"}`} />
          <span className="text-xs text-slate-200 font-semibold">
            {storageWritable ? "Writable" : "Not writable"}
          </span>
        </div>
        <p className="text-[10px] font-mono text-slate-500 pl-4 break-all">{storagePath}</p>
      </div>

      {storageEphemeral && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-start gap-2">
          <span className="text-amber-400 text-sm shrink-0">⚠</span>
          <div>
            <p className="text-xs font-semibold text-amber-400">Ephemeral Storage</p>
            <p className="text-[10px] text-amber-400/70 mt-0.5 leading-relaxed">
              This storage path looks temporary. Asset data will not survive container restarts.
              Mount a persistent volume at this path in production.
            </p>
          </div>
        </div>
      )}

      {!storageEphemeral && storageWritable && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <p className="text-[10px] text-emerald-400">Storage path is writable and persistent-safe.</p>
        </div>
      )}
    </div>
  );
}
