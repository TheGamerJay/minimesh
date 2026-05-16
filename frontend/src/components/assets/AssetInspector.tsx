import { useState } from "react";
import { GeneratedAsset, formatFileSize, renameAsset, tagAsset } from "../../lib/assets";

interface Props {
  asset: GeneratedAsset;
  onChange: (updated: GeneratedAsset) => void;
}

export default function AssetInspector({ asset, onChange }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(asset.name);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveName() {
    if (!nameInput.trim() || nameInput === asset.name) { setEditingName(false); return; }
    setSaving(true);
    try {
      const updated = await renameAsset(asset.id, nameInput.trim());
      onChange(updated);
    } catch {}
    setSaving(false);
    setEditingName(false);
  }

  async function addTag(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (!clean || asset.tags.includes(clean)) return;
    const updated = await tagAsset(asset.id, [...asset.tags, clean]);
    onChange(updated);
    setTagInput("");
  }

  async function removeTag(tag: string) {
    const updated = await tagAsset(asset.id, asset.tags.filter((t) => t !== tag));
    onChange(updated);
  }

  const created = new Date(asset.created_at).toLocaleString();
  const updated = new Date(asset.updated_at).toLocaleString();

  return (
    <div className="p-4 space-y-5 text-sm">
      {/* Name */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Name</div>
        {editingName ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
              className="flex-1 bg-gray-700/60 border border-gray-600 rounded px-2 py-1 text-gray-100 text-sm outline-none focus:border-violet-500"
            />
            <button onClick={saveName} disabled={saving} className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium">
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="text-gray-100 font-medium">{asset.name}</span>
            <button
              onClick={() => { setNameInput(asset.name); setEditingName(true); }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
        <MetaField label="Format" value={asset.asset_type.toUpperCase()} />
        <MetaField label="Size" value={formatFileSize(asset.file_size)} />
        <MetaField label="Provider" value={asset.provider} />
        <MetaField label="Version" value={`v${asset.version}`} />
        {asset.polygon_count != null && (
          <MetaField label="Polygons" value={asset.polygon_count.toLocaleString()} className="col-span-2" />
        )}
        <MetaField label="Created" value={created} className="col-span-2" />
        <MetaField label="Updated" value={updated} className="col-span-2" />
      </div>

      {/* Tags */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tags</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {asset.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300 border border-violet-700/30">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">×</button>
            </span>
          ))}
          {asset.tags.length === 0 && <span className="text-gray-600 text-xs">No tags yet</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTag(tagInput); }}
            placeholder="Add tag..."
            className="flex-1 bg-gray-700/40 border border-gray-600/50 rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-violet-500"
          />
          <button
            onClick={() => addTag(tagInput)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Source job */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Source Job</div>
        <div className="text-xs font-mono text-gray-500 break-all">{asset.source_job_id}</div>
      </div>
    </div>
  );
}

function MetaField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-gray-600 mb-0.5">{label}</div>
      <div className="text-gray-300 font-medium">{value}</div>
    </div>
  );
}
