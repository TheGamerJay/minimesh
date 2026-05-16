import { useRef, useState } from "react";
import { TextureAsset, TextureType, TEXTURE_TYPES, TEXTURE_TYPE_LABELS, uploadTexture } from "../../lib/textures";

interface Props {
  onUploaded: (asset: TextureAsset) => void;
}

export default function TextureUploadPanel({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TextureType>("albedo");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const asset = await uploadTexture(file, { texture_type: selectedType });
        onUploaded(asset);
      }
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    }
    setUploading(false);
  }

  return (
    <div className="p-3 border-b border-white/5 space-y-2">
      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Upload Texture</div>

      {/* Type selector */}
      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value as TextureType)}
        className="w-full bg-gray-800/60 border border-gray-700/50 rounded px-2 py-1 text-xs text-gray-300 outline-none"
      >
        {TEXTURE_TYPES.map((t) => (
          <option key={t} value={t}>{TEXTURE_TYPE_LABELS[t]}</option>
        ))}
      </select>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={[
          "flex flex-col items-center justify-center gap-1 py-4 rounded-lg border border-dashed cursor-pointer transition-all text-center",
          dragging
            ? "border-cyan-500/60 bg-cyan-500/5 text-cyan-400"
            : "border-white/10 text-slate-600 hover:border-white/20 hover:text-slate-400",
        ].join(" ")}
      >
        {uploading ? (
          <span className="text-xs font-mono text-cyan-500">Uploading…</span>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-[10px]">Drop PNG/JPG/WebP or click</span>
          </>
        )}
      </div>

      {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
