import { AssetExportPackage, formatPackageSize, getPackageDownloadUrl } from "../../lib/exportV2";

interface Props {
  pkg: AssetExportPackage;
  selected: boolean;
  onSelect: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  glb_package: "GLB",
  game_ready: "Game Ready",
  texture_bundle: "Textures",
  inspection_bundle: "Inspection",
  full_project_bundle: "Full Bundle",
};

export default function ExportPackageCard({ pkg, selected, onSelect }: Props) {
  const typeLabel = TYPE_LABELS[pkg.export_type] ?? pkg.export_type;

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border cursor-pointer transition-all select-none p-3 space-y-2 ${
        selected
          ? "border-violet-500 bg-gray-800/80 shadow-lg shadow-violet-900/20"
          : "border-gray-700/50 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/60"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-gray-200 truncate">{pkg.asset_name}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            v{pkg.version_exported} · {pkg.version_label} · {formatPackageSize(pkg.zip_size)}
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-400 shrink-0">
          {typeLabel}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1">
        {pkg.normalized && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            NORMALIZED
          </span>
        )}
        {pkg.has_textures && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            TEXTURES
          </span>
        )}
        {pkg.has_inspection && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
            INSPECTION
          </span>
        )}
        {pkg.has_thumbnail && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300">
            THUMBNAIL
          </span>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-gray-600">
          {new Date(pkg.created_at).toLocaleString()}
        </div>
        <a
          href={getPackageDownloadUrl(pkg.id)}
          download
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          ZIP
        </a>
      </div>
    </div>
  );
}
