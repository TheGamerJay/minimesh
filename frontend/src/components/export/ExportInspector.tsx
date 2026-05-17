import { AssetExportPackage, formatPackageSize, getPackageDownloadUrl } from "../../lib/exportV2";

interface Props {
  pkg: AssetExportPackage;
}

const TYPE_COLORS: Record<string, string> = {
  glb_package: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  game_ready: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  texture_bundle: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  inspection_bundle: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  full_project_bundle: "text-violet-300 bg-violet-500/15 border-violet-500/30",
};

export default function ExportInspector({ pkg }: Props) {
  const typeColor = TYPE_COLORS[pkg.export_type] ?? TYPE_COLORS.glb_package;

  return (
    <div className="p-4 space-y-4">
      {/* Type + name */}
      <div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${typeColor}`}>
          {pkg.export_type.replace(/_/g, " ").toUpperCase()}
        </span>
        <div className="text-sm font-semibold text-gray-200 mt-2">{pkg.asset_name}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          v{pkg.version_exported} · {pkg.version_label} · {formatPackageSize(pkg.zip_size)}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {pkg.normalized && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            NORMALIZED
          </span>
        )}
        {pkg.has_textures && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            TEXTURES INCLUDED
          </span>
        )}
        {pkg.has_inspection && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            INSPECTION INCLUDED
          </span>
        )}
        {pkg.has_thumbnail && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
            THUMBNAIL INCLUDED
          </span>
        )}
      </div>

      {/* Included files */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          Included Files ({pkg.included_files.length})
        </div>
        <div className="rounded-lg bg-gray-900/60 border border-gray-700/40 divide-y divide-gray-800/60">
          {pkg.included_files.map((f) => (
            <div key={f} className="px-3 py-1.5 text-[11px] font-mono text-gray-400">
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Meta */}
      <div className="rounded-lg bg-gray-800/40 border border-gray-700/30 px-3 py-2 space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-gray-500">Package ID</span>
          <span className="font-mono text-gray-400 text-[10px]">{pkg.id.slice(0, 8)}…</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Created</span>
          <span className="text-gray-400">{new Date(pkg.created_at).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">ZIP size</span>
          <span className="text-gray-400">{formatPackageSize(pkg.zip_size)}</span>
        </div>
      </div>

      <a
        href={getPackageDownloadUrl(pkg.id)}
        download
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download ZIP
      </a>
    </div>
  );
}
