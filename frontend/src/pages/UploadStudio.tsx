import { useEffect, useRef, useState } from "react";
import ProjectSessionPanel from "../components/ProjectSessionPanel";
import {
  deleteImage,
  getUploadedImages,
  ImageMeta,
  updateImageMetadata,
  uploadImages,
} from "../lib/uploads";

// ─── Role config ─────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  unassigned: "Unassigned",
  front_view: "Front View",
  back_view: "Back View",
  side_view: "Side View",
  material_reference: "Material Reference",
  weapon_reference: "Weapon Reference",
  armor_reference: "Armor Reference",
  helmet_reference: "Helmet Reference",
  environment_reference: "Environment Reference",
  other: "Other",
};

const ALL_ROLES = Object.keys(ROLE_LABELS);

// ─── Filter config ────────────────────────────────────────────────────────────

type FilterKey =
  | "all"
  | "unassigned"
  | "front"
  | "back"
  | "side"
  | "materials"
  | "armor"
  | "helmet"
  | "weapons"
  | "other";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "All",
  unassigned: "Unassigned",
  front: "Front",
  back: "Back",
  side: "Side",
  materials: "Materials",
  armor: "Armor",
  helmet: "Helmet",
  weapons: "Weapons",
  other: "Other",
};

const FILTER_ROLES: Record<FilterKey, string[]> = {
  all: [],
  unassigned: ["unassigned"],
  front: ["front_view"],
  back: ["back_view"],
  side: ["side_view"],
  materials: ["material_reference"],
  armor: ["armor_reference"],
  helmet: ["helmet_reference"],
  weapons: ["weapon_reference"],
  other: ["other", "environment_reference"],
};

const ALL_FILTER_KEYS = Object.keys(FILTER_LABELS) as FilterKey[];

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE = 25 * 1024 * 1024;
const MAX_COUNT = 20;

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Notes textarea — local state, saves on blur ──────────────────────────────

function NotesInput({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);
  return (
    <textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onSave(local);
      }}
      placeholder="Notes…"
      rows={2}
      className="w-full text-xs bg-black/30 border border-white/8 rounded-lg px-2 py-1.5 text-slate-400 placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 resize-none leading-relaxed"
    />
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────

interface CardProps {
  image: ImageMeta;
  onDelete: (id: string) => void;
  onRoleChange: (id: string, role: string) => void;
  onNotesSave: (id: string, notes: string) => void;
  onPrimaryToggle: (id: string, current: boolean) => void;
  onPreview: () => void;
}

function ImageCard({
  image,
  onDelete,
  onRoleChange,
  onNotesSave,
  onPrimaryToggle,
  onPreview,
}: CardProps) {
  return (
    <div
      className={[
        "glass rounded-xl overflow-hidden flex flex-col group transition-all duration-200",
        image.is_primary ? "ring-1 ring-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.05)]" : "",
      ].join(" ")}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full aspect-square bg-black/40 cursor-pointer overflow-hidden"
        onClick={onPreview}
      >
        <img
          src={image.url}
          alt={image.filename}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
          <span className="text-white text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
            PREVIEW
          </span>
        </div>
        {image.is_primary && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            PRIMARY
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p
          className="text-xs text-slate-300 truncate font-mono"
          title={image.filename}
        >
          {image.filename}
        </p>
        <p className="text-xs text-slate-700">{fmtBytes(image.size)}</p>

        {/* Role */}
        <select
          value={image.reference_role}
          onChange={(e) => onRoleChange(image.id, e.target.value)}
          className="text-xs bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-slate-400 focus:outline-none focus:border-cyan-500/40 cursor-pointer transition-colors hover:border-white/20"
        >
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>

        {/* Notes */}
        <NotesInput
          value={image.notes}
          onSave={(v) => onNotesSave(image.id, v)}
        />

        {/* Primary + Delete */}
        <div className="flex gap-1.5 mt-auto">
          <button
            onClick={() => onPrimaryToggle(image.id, image.is_primary)}
            className={[
              "flex-1 text-xs px-2 py-1.5 rounded-lg border transition-all duration-150 truncate",
              image.is_primary
                ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/5"
                : "border-white/8 text-slate-600 hover:border-white/20 hover:text-slate-400",
            ].join(" ")}
          >
            {image.is_primary ? "★ Primary" : "Set Primary"}
          </button>
          <button
            onClick={() => onDelete(image.id)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-red-900/30 text-red-600 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

interface ModalProps {
  image: ImageMeta;
  onClose: () => void;
  onRoleChange: (id: string, role: string) => void;
  onNotesSave: (id: string, notes: string) => void;
  onPrimaryToggle: (id: string, current: boolean) => void;
}

function PreviewModal({
  image,
  onClose,
  onRoleChange,
  onNotesSave,
  onPrimaryToggle,
}: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl w-full max-w-xl flex flex-col gap-5 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h3
            className="text-sm font-semibold text-slate-200 font-mono truncate"
            title={image.filename}
          >
            {image.filename}
          </h3>
          <button
            onClick={onClose}
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        <img
          src={image.url}
          alt={image.filename}
          className="w-full rounded-xl object-contain max-h-[50vh] bg-black/30"
        />

        <div className="flex justify-between text-xs text-slate-600 font-mono">
          <span>{image.content_type}</span>
          <span>{fmtBytes(image.size)}</span>
        </div>

        <div>
          <label className="text-xs text-slate-500 font-mono mb-1.5 block">
            Reference Role
          </label>
          <select
            value={image.reference_role}
            onChange={(e) => onRoleChange(image.id, e.target.value)}
            className="w-full text-sm bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 font-mono mb-1.5 block">
            Notes
          </label>
          <NotesInput
            value={image.notes}
            onSave={(v) => onNotesSave(image.id, v)}
          />
        </div>

        <button
          onClick={() => onPrimaryToggle(image.id, image.is_primary)}
          className={[
            "text-sm px-4 py-2 rounded-lg border transition-all duration-150",
            image.is_primary
              ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/5"
              : "border-white/10 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400",
          ].join(" ")}
        >
          {image.is_primary
            ? "★ Primary Reference"
            : "Set as Primary Reference"}
        </button>
      </div>
    </div>
  );
}

// ─── Upload Studio ────────────────────────────────────────────────────────────

interface UploadStudioProps {
  onBack: () => void;
}

export default function UploadStudio({ onBack }: UploadStudioProps) {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImageMeta | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadImages();
    return () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, []);

  async function loadImages() {
    try {
      setImages(await getUploadedImages());
    } catch {
      setErrorMsg("Could not load images from server.");
    }
  }

  function triggerSessionRefresh() {
    setSessionKey((k) => k + 1);
  }

  function showStatus(msg: string) {
    setStatusMsg(msg);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatusMsg(null), 3500);
  }

  function validate(incoming: File[]): { valid: File[]; errors: string[] } {
    const valid: File[] = [];
    const errors: string[] = [];
    for (const f of incoming) {
      if (!ALLOWED_TYPES.has(f.type)) {
        errors.push(`${f.name}: unsupported format (PNG, JPG, WEBP only)`);
      } else if (f.size > MAX_SIZE) {
        errors.push(`${f.name}: exceeds 25 MB limit`);
      } else {
        valid.push(f);
      }
    }
    if (images.length + valid.length > MAX_COUNT) {
      errors.push(
        `Cannot upload — would exceed the ${MAX_COUNT}-image limit (${images.length} already uploaded).`
      );
      return { valid: [], errors };
    }
    return { valid, errors };
  }

  async function handleFiles(incoming: File[]) {
    setErrorMsg(null);
    const { valid, errors } = validate(incoming);
    if (errors.length) setErrorMsg(errors.join("  ·  "));
    if (!valid.length) return;
    setUploading(true);
    try {
      const uploaded = await uploadImages(valid);
      setImages((prev) => [...uploaded, ...prev]);
      showStatus(
        `${uploaded.length} image${uploaded.length !== 1 ? "s" : ""} uploaded.`
      );
      triggerSessionRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  async function handleDelete(id: string) {
    try {
      await deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      if (preview?.id === id) setPreview(null);
      triggerSessionRefresh();
    } catch {
      setErrorMsg("Failed to delete image.");
    }
  }

  function patchImage(updated: ImageMeta) {
    setImages((prev) =>
      prev.map((img) => (img.id === updated.id ? updated : img))
    );
    setPreview((p) => (p?.id === updated.id ? updated : p));
  }

  async function handleRoleChange(id: string, role: string) {
    // Optimistic update for snappy UI
    const optimistic = images.find((img) => img.id === id);
    if (optimistic) patchImage({ ...optimistic, reference_role: role });
    try {
      const updated = await updateImageMetadata(id, { reference_role: role });
      patchImage(updated);
      triggerSessionRefresh();
    } catch {
      setErrorMsg("Failed to save role.");
      loadImages(); // revert
    }
  }

  async function handleNotesSave(id: string, notes: string) {
    try {
      const updated = await updateImageMetadata(id, { notes });
      patchImage(updated);
    } catch {
      setErrorMsg("Failed to save notes.");
    }
  }

  async function handlePrimaryToggle(id: string, current: boolean) {
    try {
      await updateImageMetadata(id, { is_primary: !current });
      // Reload all — backend may have demoted sibling primaries
      const fresh = await getUploadedImages();
      setImages(fresh);
      const freshPreview = preview
        ? fresh.find((img) => img.id === preview.id) ?? null
        : null;
      setPreview(freshPreview);
      triggerSessionRefresh();
    } catch {
      setErrorMsg("Failed to update primary flag.");
    }
  }

  // ── Filtered view ──────────────────────────────────────────────────────────
  const filteredImages =
    filter === "all"
      ? images
      : images.filter((img) =>
          FILTER_ROLES[filter].includes(img.reference_role)
        );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      {/* ── Header ── */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-cyan-400 transition-colors font-mono"
        >
          ← Back
        </button>
        <div className="h-4 w-px bg-white/8" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            M
          </div>
          <span className="text-lg font-bold tracking-tight">MiniMesh</span>
        </div>
        <span className="ml-auto text-xs font-mono text-slate-600">
          Upload Studio — Phase 2
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* ── Title ── */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
            Upload References
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            PNG · JPG · WEBP &nbsp;·&nbsp; 25 MB max per image &nbsp;·&nbsp;
            up to {MAX_COUNT} images per session
          </p>
        </div>

        {/* ── Session / Readiness Panel ── */}
        <ProjectSessionPanel refreshKey={sessionKey} />

        {/* ── Banners ── */}
        {errorMsg && (
          <div className="text-xs text-red-400 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 leading-relaxed">
            {errorMsg}
          </div>
        )}
        {statusMsg && !errorMsg && (
          <div className="text-xs text-cyan-400 px-4 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
            {statusMsg}
          </div>
        )}

        {/* ── Drop Zone ── */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={[
            "relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed",
            "transition-all duration-200 py-14 select-none",
            uploading
              ? "pointer-events-none opacity-50 border-white/10"
              : dragging
              ? "border-cyan-400 bg-cyan-500/5 cursor-copy shadow-[0_0_50px_rgba(34,211,238,0.08)]"
              : "border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.015] cursor-pointer",
          ].join(" ")}
        >
          <span
            className={[
              "text-5xl transition-all duration-200",
              dragging ? "scale-110 text-cyan-400" : "text-slate-600",
            ].join(" ")}
          >
            {uploading ? "◌" : dragging ? "⬇" : "⬆"}
          </span>
          <div className="text-center">
            <p className="text-slate-300 font-semibold text-sm">
              {uploading
                ? "Uploading…"
                : dragging
                ? "Release to upload"
                : "Drop reference images here"}
            </p>
            {!uploading && (
              <p className="text-slate-600 text-xs mt-1">or click to browse</p>
            )}
          </div>
          {dragging && (
            <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30 animate-pulse pointer-events-none" />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFiles(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
        />

        {/* ── Gallery ── */}
        {images.length > 0 && (
          <section>
            {/* Gallery header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  Reference Gallery
                </h2>
                <span className="text-xs font-mono text-slate-700">
                  {images.length}&nbsp;/&nbsp;{MAX_COUNT}
                </span>
              </div>

              {/* Filter tabs */}
              <div className="flex flex-wrap gap-1.5">
                {ALL_FILTER_KEYS.map((key) => {
                  const count =
                    key === "all"
                      ? images.length
                      : images.filter((img) =>
                          FILTER_ROLES[key].includes(img.reference_role)
                        ).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={[
                        "text-xs px-2.5 py-1 rounded-lg border transition-all duration-150 font-mono",
                        filter === key
                          ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/10"
                          : "border-white/8 text-slate-600 hover:border-white/15 hover:text-slate-400",
                      ].join(" ")}
                    >
                      {FILTER_LABELS[key]}
                      {count > 0 && (
                        <span className="ml-1 opacity-40">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredImages.map((img) => (
                  <ImageCard
                    key={img.id}
                    image={img}
                    onDelete={handleDelete}
                    onRoleChange={handleRoleChange}
                    onNotesSave={handleNotesSave}
                    onPrimaryToggle={handlePrimaryToggle}
                    onPreview={() => setPreview(img)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-700 text-sm font-mono py-8">
                No images match the &quot;{FILTER_LABELS[filter]}&quot; filter.
              </p>
            )}
          </section>
        )}

        {images.length === 0 && !uploading && (
          <p className="text-center text-slate-700 text-sm font-mono py-6">
            No references uploaded yet.
          </p>
        )}
      </main>

      {/* ── Preview Modal ── */}
      {preview && (
        <PreviewModal
          image={preview}
          onClose={() => setPreview(null)}
          onRoleChange={handleRoleChange}
          onNotesSave={handleNotesSave}
          onPrimaryToggle={handlePrimaryToggle}
        />
      )}
    </div>
  );
}
