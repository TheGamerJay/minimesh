import { TextureAsset, TextureType, TEXTURE_TYPES, TEXTURE_TYPE_LABELS, textureUrl } from "../../lib/textures";

interface Props {
  assignedTextures: Partial<Record<TextureType, string>>;
  textureMap: Record<string, TextureAsset>;
  onRemoveSlot: (slot: TextureType) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

const SLOT_BG: Record<TextureType, string> = {
  albedo:    "border-amber-500/30",
  normal:    "border-blue-500/30",
  roughness: "border-slate-500/30",
  metallic:  "border-cyan-500/30",
  emissive:  "border-violet-500/30",
  opacity:   "border-gray-500/30",
  ao:        "border-orange-500/30",
};

export default function TextureAssignmentBar({
  assignedTextures,
  textureMap,
  onRemoveSlot,
  onSave,
  saving,
  saved,
}: Props) {
  const assignedCount = Object.keys(assignedTextures).length;

  return (
    <div className="h-20 shrink-0 border-t border-white/5 bg-black/40 px-4 flex items-center gap-3">
      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest shrink-0">Active Slots</div>

      {/* Slot strip */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {TEXTURE_TYPES.map((slot) => {
          const id = assignedTextures[slot];
          const asset = id ? textureMap[id] : null;
          return (
            <div
              key={slot}
              className={[
                "flex flex-col items-center gap-1 shrink-0",
              ].join(" ")}
            >
              <div
                className={[
                  "w-10 h-10 rounded-lg border overflow-hidden flex items-center justify-center",
                  asset ? SLOT_BG[slot] + " bg-gray-800" : "border-gray-700/30 bg-gray-900/40",
                ].join(" ")}
              >
                {asset ? (
                  <div className="relative group w-full h-full">
                    <img src={textureUrl(asset)} alt={asset.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => onRemoveSlot(slot)}
                      className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-[9px] font-mono text-gray-700">—</span>
                )}
              </div>
              <span className="text-[8px] font-mono text-gray-600">
                {TEXTURE_TYPE_LABELS[slot].slice(0, 3).toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Save + status */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={onSave}
          disabled={saving || assignedCount === 0}
          className={[
            "px-3 py-1.5 rounded text-xs font-medium transition-colors",
            saving
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : assignedCount > 0
              ? "bg-cyan-600 hover:bg-cyan-500 text-white"
              : "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700/30",
          ].join(" ")}
        >
          {saving ? "Saving…" : "Save Assignment"}
        </button>
        {saved && (
          <span className="text-[9px] font-mono text-emerald-500">✓ Saved</span>
        )}
        <span className="text-[9px] font-mono text-slate-700">
          {assignedCount} / {TEXTURE_TYPES.length} slots assigned
        </span>
      </div>
    </div>
  );
}
