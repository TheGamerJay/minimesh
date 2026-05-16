import { TextureAsset, TextureType, TEXTURE_TYPES, TEXTURE_TYPE_LABELS, textureUrl } from "../../lib/textures";

interface Props {
  assignedTextures: Partial<Record<TextureType, string>>;   // slot → textureId
  textureMap: Record<string, TextureAsset>;                  // id → asset
  onAssignSlot: (slot: TextureType, textureId: string) => void;
  onRemoveSlot: (slot: TextureType) => void;
  availableTextures: TextureAsset[];
}

const SLOT_DESCRIPTIONS: Record<TextureType, string> = {
  albedo:    "Base color map",
  normal:    "Surface normal detail",
  roughness: "Micro-surface roughness",
  metallic:  "Metallic reflectance",
  emissive:  "Self-illumination",
  opacity:   "Alpha transparency",
  ao:        "Ambient occlusion",
};

export default function TextureSlotInspector({
  assignedTextures,
  textureMap,
  onAssignSlot,
  onRemoveSlot,
  availableTextures,
}: Props) {
  return (
    <div className="w-60 shrink-0 border-l border-white/5 bg-black/20 overflow-y-auto">
      <div className="px-4 py-3 border-b border-white/5">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">PBR Texture Slots</div>
      </div>

      <div className="p-3 space-y-2">
        {TEXTURE_TYPES.map((slot) => {
          const assignedId = assignedTextures[slot];
          const asset = assignedId ? textureMap[assignedId] : null;

          return (
            <div
              key={slot}
              className={[
                "rounded-lg border p-2.5 transition-colors",
                asset ? "border-cyan-500/20 bg-cyan-500/5" : "border-gray-700/40 bg-gray-800/20",
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                  {TEXTURE_TYPE_LABELS[slot]}
                </span>
                {asset && (
                  <button
                    onClick={() => onRemoveSlot(slot)}
                    className="text-[9px] text-slate-600 hover:text-red-400 transition-colors"
                  >
                    ✕ remove
                  </button>
                )}
              </div>

              {asset ? (
                /* Assigned state */
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-gray-900">
                    <img src={textureUrl(asset)} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-gray-300 truncate">{asset.name}</div>
                    <div className="text-[9px] text-gray-600">{asset.file_size > 0 ? `${(asset.file_size / 1024).toFixed(0)} KB` : "—"}</div>
                  </div>
                </div>
              ) : (
                /* Empty state + quick assign dropdown */
                <div className="space-y-1">
                  <div className="text-[9px] text-slate-700 font-mono">{SLOT_DESCRIPTIONS[slot]}</div>
                  {availableTextures.filter((t) => t.texture_type === slot).length > 0 ? (
                    <select
                      defaultValue=""
                      onChange={(e) => { if (e.target.value) onAssignSlot(slot, e.target.value); }}
                      className="w-full bg-gray-800/60 border border-gray-700/40 rounded px-1.5 py-0.5 text-[10px] text-gray-400 outline-none"
                    >
                      <option value="">— assign —</option>
                      {availableTextures
                        .filter((t) => t.texture_type === slot)
                        .map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                  ) : (
                    <div className="text-[9px] text-slate-700 italic">No {TEXTURE_TYPE_LABELS[slot].toLowerCase()} textures uploaded</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
