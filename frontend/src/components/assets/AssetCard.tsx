import { GeneratedAsset, formatFileSize, assetDownloadUrl } from "../../lib/assets";
import AssetHealthBadge from "./AssetHealthBadge";

interface Props {
  asset: GeneratedAsset;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onOpenViewer: () => void;
}

export default function AssetCard({ asset, selected, onSelect, onDelete, onDuplicate, onOpenViewer }: Props) {
  const downloadUrl = assetDownloadUrl(asset);
  const hasReal = asset.provider !== "mock";
  // Prefer local rendered thumbnail over provider preview image
  const displayImage = asset.thumbnail || asset.preview_image;

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-xl border cursor-pointer transition-all select-none group ${
        selected
          ? "border-violet-500 bg-gray-800/80 shadow-lg shadow-violet-900/30"
          : "border-gray-700/50 bg-gray-800/40 hover:border-gray-600 hover:shadow-md"
      }`}
    >
      {/* Thumbnail / preview */}
      <div className="relative h-36 rounded-t-xl overflow-hidden bg-gray-900 flex items-center justify-center">
        {displayImage ? (
          <img
            src={displayImage}
            alt={asset.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-600">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            <span className="text-xs">{asset.asset_type.toUpperCase()}</span>
          </div>
        )}

        {/* Provider badge */}
        <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded font-medium ${
          hasReal ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-gray-900"
        }`}>
          {hasReal ? asset.provider : "Mock"}
        </div>

        {/* Thumbnail source badge — only show when rendered thumbnail exists */}
        {asset.thumbnail && (
          <div className="absolute bottom-2 right-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 border border-violet-500/30 text-violet-400">
            RENDERED
          </div>
        )}

        {/* Version badge */}
        {asset.version > 1 && (
          <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-violet-600/90 text-white font-medium">
            v{asset.version}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="font-medium text-gray-100 text-sm truncate">{asset.name}</div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="uppercase font-mono bg-gray-700/60 px-1.5 py-0.5 rounded">
            {asset.asset_type}
          </span>
          <span>{formatFileSize(asset.file_size)}</span>
          {asset.polygon_count != null && (
            <span>{asset.polygon_count.toLocaleString()} tris</span>
          )}
        </div>

        {/* Health badge */}
        {asset.qa_status && (
          <div>
            <AssetHealthBadge status={asset.qa_status} score={asset.qa_score} />
          </div>
        )}

        {/* Tags */}
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-violet-900/40 text-violet-300 border border-violet-700/30">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onOpenViewer}
            className="flex-1 text-xs py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
          >
            Preview
          </button>
          {hasReal && (
            <a
              href={downloadUrl}
              download
              className="px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
              title="Download"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          )}
          <button
            onClick={onDuplicate}
            className="px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
            title="Duplicate"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1.5 rounded bg-gray-700 hover:bg-red-900/60 text-gray-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
