import { useEffect, useRef, useState } from "react";
import JobHistoryPanel from "../components/JobHistoryPanel";
import ProjectSessionPanel from "../components/ProjectSessionPanel";
import {
  GenerationConfig,
  GenerationConfigPayload,
  getGenerationConfig,
  MODE_LABELS,
  QUALITY_LABELS,
  RIG_LABELS,
  STYLE_LABELS,
  TEXTURE_LABELS,
  updateGenerationConfig,
} from "../lib/generation";
import { Job, createJob, getJob } from "../lib/jobs";
import { isCreditError } from "../lib/credits";
import { useCredits } from "../lib/creditContext";
import InsufficientCreditsModal from "../components/credits/InsufficientCreditsModal";

// ─── Mode definitions ─────────────────────────────────────────────────────────

interface ModeCard {
  key: string;
  label: string;
  icon: string;
  description: string;
  refs: string[];
  hasRig: boolean;
}

const MODES: ModeCard[] = [
  {
    key: "two_d_anime_sheet",
    label: "2D Anime Sheet",
    icon: "◧",
    description:
      "Create a clean anime-style 2D reference sheet from uploaded images.",
    refs: ["Front View (required)", "Material Reference (suggested)"],
    hasRig: false,
  },
  {
    key: "three_d_model",
    label: "3D Model",
    icon: "⬡",
    description: "Prepare references for image-to-3D model generation.",
    refs: [
      "Front View (required)",
      "Back View (suggested)",
      "Side View (suggested)",
      "Material Reference (suggested)",
    ],
    hasRig: true,
  },
  {
    key: "clay_sculpt",
    label: "Clay Sculpt",
    icon: "◉",
    description:
      "Create a clay-like sculpt direction for statue or collectible workflows.",
    refs: ["Front View (required)", "Side View (suggested)"],
    hasRig: false,
  },
  {
    key: "toy_figurine",
    label: "Toy / Figurine",
    icon: "◈",
    description: "Prepare a collectible toy or figurine-style asset.",
    refs: [
      "Front View (required)",
      "Back View (suggested)",
      "Material Reference (suggested)",
    ],
    hasRig: false,
  },
  {
    key: "game_ready_character",
    label: "Game-Ready Character",
    icon: "⚙",
    description:
      "Prepare a riggable optimized character for game engines.",
    refs: [
      "Front View (required)",
      "Back View (required)",
      "Side View (required)",
      "Material / Armor Reference (required)",
    ],
    hasRig: true,
  },
  {
    key: "cinematic_high_poly",
    label: "Cinematic High-Poly",
    icon: "◇",
    description:
      "Prepare a detailed high-resolution character for cinematic rendering.",
    refs: [
      "Front View (required)",
      "Back View (required)",
      "Side View (required)",
      "Material / Armor Reference (required)",
      "Helmet Reference (suggested)",
    ],
    hasRig: true,
  },
  {
    key: "low_poly_mobile",
    label: "Low-Poly Mobile",
    icon: "△",
    description:
      "Prepare a lightweight asset for mobile or stylized games.",
    refs: ["Front View (required)", "Side View (suggested)"],
    hasRig: true,
  },
  {
    key: "prop_only",
    label: "Prop Only",
    icon: "◆",
    description:
      "Prepare a weapon, armor piece, shield, wing, vehicle, or object asset.",
    refs: ["Weapon, Armor, or Other Reference (required)"],
    hasRig: false,
  },
];

// ─── Config Panel ─────────────────────────────────────────────────────────────

interface ConfigPanelProps {
  config: GenerationConfig;
  onSave: (payload: GenerationConfigPayload) => Promise<void>;
  activeJob: Job | null;
  jobError: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onOpenViewer: (job: Job) => void;
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500/40 cursor-pointer transition-colors hover:border-white/20"
      >
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

function ConfigPanel({ config, onSave, activeJob, jobError, isGenerating, onGenerate, onOpenViewer }: ConfigPanelProps) {
  const [localNotes, setLocalNotes] = useState(config.notes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalNotes(config.notes);
  }, [config.notes]);

  async function handleField(payload: GenerationConfigPayload) {
    setSaving(true);
    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-5 lg:sticky lg:top-6 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          Generation Config
        </h3>
        {saving && (
          <span className="text-[10px] font-mono text-cyan-500 animate-pulse">
            Saving…
          </span>
        )}
      </div>

      {/* Current mode */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          Output Type
        </label>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-500/20 bg-violet-500/5">
          <span className="text-violet-400 text-xs">◈</span>
          <span className="text-xs text-violet-300 font-mono">
            {MODE_LABELS[config.mode] ?? config.mode}
          </span>
        </div>
      </div>

      <SelectRow
        label="Style Direction"
        value={config.style_direction}
        options={STYLE_LABELS}
        onChange={(v) => handleField({ style_direction: v })}
      />

      <SelectRow
        label="Rig Intent"
        value={config.rig_intent}
        options={RIG_LABELS}
        onChange={(v) => handleField({ rig_intent: v })}
      />

      <SelectRow
        label="Target Quality"
        value={config.target_quality}
        options={QUALITY_LABELS}
        onChange={(v) => handleField({ target_quality: v })}
      />

      <SelectRow
        label="Texture Style"
        value={config.texture_style}
        options={TEXTURE_LABELS}
        onChange={(v) => handleField({ texture_style: v })}
      />

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          Notes
        </label>
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={() => {
            if (localNotes !== config.notes) handleField({ notes: localNotes });
          }}
          placeholder="Generation notes…"
          rows={3}
          className="text-xs bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-slate-400 placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 resize-none leading-relaxed"
        />
      </div>

      {/* Mock provider notice */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
        <span className="text-yellow-400 text-xs mt-px">⚠</span>
        <p className="text-[10px] text-yellow-500/80 leading-relaxed">
          Mock provider active — real 3D generation will be connected in a later phase.
        </p>
      </div>

      {/* Active job status */}
      {activeJob && (
        <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg border border-cyan-500/15 bg-cyan-500/5">
          <div className="flex items-center gap-2">
            <span
              className={[
                "w-1.5 h-1.5 rounded-full",
                activeJob.status === "queued" ? "bg-yellow-400 animate-pulse" :
                activeJob.status === "processing" ? "bg-cyan-400 animate-pulse" :
                activeJob.status === "completed" ? "bg-emerald-400" :
                "bg-red-400",
              ].join(" ")}
            />
            <span className="text-[10px] font-mono text-slate-400 capitalize">
              {activeJob.status === "queued" ? "Queued…" :
               activeJob.status === "processing" ? "Processing…" :
               activeJob.status === "completed" ? "Completed" :
               "Failed"}
            </span>
          </div>
          {activeJob.status === "completed" && (
            <>
              {activeJob.result_path && (
                <p className="text-[10px] font-mono text-emerald-600">
                  Mock result: {activeJob.result_path}
                </p>
              )}
              <button
                onClick={() => onOpenViewer(activeJob)}
                className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:border-emerald-400/60 hover:bg-emerald-500/5 transition-all duration-150 font-mono"
              >
                Open 3D Preview ▶
              </button>
            </>
          )}
          {activeJob.status === "failed" && activeJob.error && (
            <p className="text-[10px] font-mono text-red-500">{activeJob.error}</p>
          )}
        </div>
      )}

      {/* Job error */}
      {jobError && (
        <p className="text-[10px] text-red-400 px-1 leading-relaxed">{jobError}</p>
      )}

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className={[
          "w-full text-xs px-4 py-3 rounded-xl border transition-all duration-150 font-mono text-center leading-snug",
          isGenerating
            ? "border-slate-800 text-slate-600 cursor-not-allowed"
            : "border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/5 cursor-pointer",
        ].join(" ")}
      >
          {isGenerating ? "Submitting…" : (
          <span className="flex items-center justify-center gap-2">
            Generate Draft Mesh
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/20 text-cyan-500/60">25 cr</span>
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Mode Card ────────────────────────────────────────────────────────────────

interface ModeCardProps {
  mode: ModeCard;
  selected: boolean;
  onSelect: () => void;
}

function ModeCardItem({ mode, selected, onSelect }: ModeCardProps) {
  return (
    <div
      onClick={onSelect}
      className={[
        "glass rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 group relative",
        selected
          ? "ring-1 ring-cyan-500/50 shadow-[0_0_25px_rgba(34,211,238,0.07)] bg-cyan-500/[0.03]"
          : "hover:border-cyan-500/20 glass-hover",
      ].join(" ")}
    >
      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-400" />
      )}

      {/* Icon + title */}
      <div className="flex items-center gap-2.5">
        <span
          className={[
            "text-xl transition-colors",
            selected
              ? "text-cyan-400"
              : "text-slate-600 group-hover:text-slate-400",
          ].join(" ")}
        >
          {mode.icon}
        </span>
        <h3
          className={[
            "text-sm font-semibold transition-colors",
            selected ? "text-cyan-300" : "text-slate-200",
          ].join(" ")}
        >
          {mode.label}
        </h3>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed">{mode.description}</p>

      {/* Ref tags */}
      <div className="flex flex-col gap-1">
        {mode.refs.map((ref) => (
          <span
            key={ref}
            className="text-[10px] font-mono text-slate-600 leading-relaxed"
          >
            · {ref}
          </span>
        ))}
      </div>

      {/* Rig badge */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        {mode.hasRig ? (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-violet-500/25 text-violet-400/70 bg-violet-500/5">
            Rig expected
          </span>
        ) : (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 text-slate-700">
            No rig
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={[
            "ml-auto text-xs px-3 py-1 rounded-lg border transition-all duration-150",
            selected
              ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
              : "border-white/8 text-slate-500 hover:border-cyan-500/30 hover:text-cyan-400",
          ].join(" ")}
        >
          {selected ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
}

// ─── Sculpt Type Selector ─────────────────────────────────────────────────────

interface SculptTypeSelectorProps {
  onBack: () => void;
  onOpenViewer: (job: Job) => void;
}

export default function SculptTypeSelector({ onBack, onOpenViewer }: SculptTypeSelectorProps) {
  const { refresh: refreshCredits } = useCredits();
  const [config, setConfig] = useState<GenerationConfig | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creditErrorMsg, setCreditErrorMsg] = useState<string | null>(null);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadConfig();
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, []);

  // Poll active job every 2 seconds until terminal
  useEffect(() => {
    if (!activeJob || activeJob.status === "completed" || activeJob.status === "failed") return;
    const interval = setInterval(async () => {
      try {
        const updated = await getJob(activeJob.id);
        setActiveJob(updated);
        if (updated.status === "completed" || updated.status === "failed") {
          setSessionKey((k) => k + 1);
        }
      } catch {
        // ignore transient errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status]);

  async function loadConfig() {
    try {
      setConfig(await getGenerationConfig());
    } catch {
      setLoadError(true);
    }
  }

  async function handleSave(payload: GenerationConfigPayload) {
    const updated = await updateGenerationConfig(payload);
    setConfig(updated);
    setSessionKey((k) => k + 1);
  }

  async function handleModeSelect(modeKey: string) {
    if (!config || config.mode === modeKey) return;
    await handleSave({ mode: modeKey });
  }

  async function handleGenerate() {
    setJobError(null);
    setIsGenerating(true);
    try {
      const job = await createJob();
      refreshCredits();
      setActiveJob(job);
      setSessionKey((k) => k + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create job";
      if (isCreditError(msg)) {
        setCreditErrorMsg(msg);
      } else {
        setJobError(msg);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      {creditErrorMsg && (
        <InsufficientCreditsModal
          message={creditErrorMsg}
          onClose={() => { setCreditErrorMsg(null); refreshCredits(); }}
        />
      )}
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
          Sculpt Type Selector — Phase 4
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* ── Title ── */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
            Choose Sculpt Type
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Select the output type for your asset. This determines which
            references are needed and how generation will be configured.
          </p>
        </div>

        {/* ── Session Panel ── */}
        <ProjectSessionPanel refreshKey={sessionKey} />

        {/* ── Error banner ── */}
        {loadError && (
          <div className="text-xs text-red-400 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5">
            Could not load generation config from server. Make sure the backend
            is running.
          </div>
        )}

        {/* ── Main layout: cards + config panel ── */}
        {config && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* Mode cards */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                Output Type
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MODES.map((mode) => (
                  <ModeCardItem
                    key={mode.key}
                    mode={mode}
                    selected={config.mode === mode.key}
                    onSelect={() => handleModeSelect(mode.key)}
                  />
                ))}
              </div>
            </div>

            {/* Config panel */}
            <div>
              <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
                Config
              </h2>
              <ConfigPanel
                config={config}
                onSave={handleSave}
                activeJob={activeJob}
                jobError={jobError}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                onOpenViewer={onOpenViewer}
              />
            </div>
          </div>
        )}

        {/* Loading state */}
        {!config && !loadError && (
          <div className="flex items-center gap-3 py-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs text-slate-600 font-mono">
              Loading config…
            </span>
          </div>
        )}

        {/* Job history */}
        <JobHistoryPanel refreshKey={sessionKey} />
      </main>
    </div>
  );
}
