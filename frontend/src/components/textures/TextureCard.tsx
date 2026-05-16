import { useState } from "react";
import { TextureAsset, TEXTURE_TYPE_LABELS, textureUrl, formatFileSize } from "../../lib/textures";

interface Props {
  asset: TextureAsset;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAssign: (slotType: string) => void;
}

const SLOT_COLORS: Record<string, string> = {
  albedo:    "bg-amber-500/20 text-amber-300 border-amber-500/30",
  normal:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
  roughness: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  metallic:  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  emissive:  "bg-violet-500/20 text-violet-300 border-violet-500/30",
  opacity:   "bg-gray-500/20 text-gray-300 border-gray-500/30",
  ao:        "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

export default function TextureCard({ asset, selected, onSelect, onDelete, onAssign }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const url = textureUrl(asset);
  const color = SLOT_COLORS[asset.texture_type] ?? "bg-gray-700/40 text-gray-400 border-gray-600/30";

  return (
    <>
      <div
        onClick={onSelect}
        className={[
          "rounded-lg border cursor-pointer transition-all text-xs overflow-hidden group",
          selected
            ? "border-cyan-500/50 bg-gray-800/80 shadow-lg shadow-cyan-900/20"
            : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600",
        ].join(" ")}
      >
        {/* Thumbnail */}
        <div className="relative h-24 bg-gray-900 overflow-hidden flex items-center justify-center">
          <img
            src={url}
            alt={asset.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {/* Preview button */}
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="text-white text-[10px] font-mono border border-white/30 px-2 py-1 rounded">Preview</span>
          </button>
        </div>

        <div className="p-2 space-y-1.5">
          <div className="font-medium text-gray-200 truncate">{asset.name}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${color}`}>
              {TEXTURE_TYPE_LABELS[asset.texture_type]}
            </span>
            <span className="text-[9px] text-gray-600">{formatFileSize(asset.file_size)}</span>
            {asset.resolution && <span className="text-[9px] text-gray-600">{asset.resolution}</span>}
          </div>

          {/* Actions */}
          <div className="flex gap-1 pt-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onAssign(asset.texture_type)}
              className="flex-1 py-1 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white text-[10px] font-medium transition-colors"
            >
              Assign
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-1 rounded bg-gray-700 hover:bg-red-900/60 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="max-w-lg w-full bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={url} alt={asset.name} className="w-full object-contain max-h-80" />
            <div className="p-4 space-y-2">
              <div className="font-semibold text-gray-100">{asset.name}</div>
              <div className="grid grid-cols-3 gap-3 text-xs text-gray-400">
                <div><div className="text-gray-600 text-[10px] uppercase mb-0.5">Type</div>{TEXTURE_TYPE_LABELS[asset.texture_type]}</div>
                <div><div className="text-gray-600 text-[10px] uppercase mb-0.5">Size</div>{formatFileSize(asset.file_size)}</div>
                {asset.resolution && <div><div className="text-gray-600 text-[10px] uppercase mb-0.5">Res</div>{asset.resolution}</div>}
              </div>
              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/30 text-cyan-400 border border-cyan-700/30">{t}</span>
                  ))}
                </div>
              )}
              <button onClick={() => setPreviewOpen(false)} className="w-full mt-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
