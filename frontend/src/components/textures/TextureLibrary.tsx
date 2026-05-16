import { useState } from "react";
import { TextureAsset, TEXTURE_TYPES, TEXTURE_TYPE_LABELS, TextureType } from "../../lib/textures";
import TextureCard from "./TextureCard";
import TextureUploadPanel from "./TextureUploadPanel";

interface Props {
  textures: TextureAsset[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onAssign: (textureId: string, slotType: string) => void;
  onUploaded: (asset: TextureAsset) => void;
}

export default function TextureLibrary({ textures, selectedId, onSelect, onDelete, onAssign, onUploaded }: Props) {
  const [filterType, setFilterType] = useState<TextureType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = textures.filter((t) => {
    if (filterType !== "all" && t.texture_type !== filterType) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-56 shrink-0 border-r border-white/5 bg-black/20 flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-white/5">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Texture Library</div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full bg-gray-800/60 border border-gray-700/40 rounded px-2 py-1 text-[11px] text-gray-300 outline-none focus:border-cyan-500"
        />
      </div>

      {/* Type filter */}
      <div className="px-3 py-1.5 border-b border-white/5 flex flex-wrap gap-1">
        <button
          onClick={() => setFilterType("all")}
          className={`text-[9px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
            filterType === "all" ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-white/8 text-slate-600 hover:text-slate-400"
          }`}
        >All</button>
        {TEXTURE_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
              filterType === t ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-white/8 text-slate-600 hover:text-slate-400"
            }`}
          >
            {TEXTURE_TYPE_LABELS[t].slice(0, 3)}
          </button>
        ))}
      </div>

      <TextureUploadPanel onUploaded={onUploaded} />

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-[10px] text-slate-700 font-mono text-center py-6">
            {textures.length === 0 ? "No textures uploaded yet" : "No matches"}
          </p>
        ) : (
          filtered.map((asset) => (
            <TextureCard
              key={asset.id}
              asset={asset}
              selected={selectedId === asset.id}
              onSelect={() => onSelect(asset.id === selectedId ? null : asset.id)}
              onDelete={() => onDelete(asset.id)}
              onAssign={(slotType) => onAssign(asset.id, slotType)}
            />
          ))
        )}
      </div>
    </div>
  );
}
