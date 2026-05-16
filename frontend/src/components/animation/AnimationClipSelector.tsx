import { useEffect, useState } from "react";
import {
  AnimationClip,
  AnimationJob,
  createAnimationJob,
  getAnimationClips,
} from "../../lib/animations";
import { isCreditError } from "../../lib/credits";
import { useCredits } from "../../lib/creditContext";
import InsufficientCreditsModal from "../credits/InsufficientCreditsModal";

interface AnimationClipSelectorProps {
  sourceRigJobId: string | null;
  rigType: string | null;
  activeAnimJob: AnimationJob | null;
  onAnimJobCreated: (aj: AnimationJob) => void;
  onClipSelected: (clip: AnimationClip) => void;
}

const CLIP_ICONS: Record<string, string> = {
  idle: "◎",
  walk: "⟳",
  run: "▶▶",
  jump: "↑",
  attack: "⚡",
  fly: "⟁",
  turntable: "↺",
};

export default function AnimationClipSelector({
  sourceRigJobId,
  rigType,
  activeAnimJob,
  onAnimJobCreated,
  onClipSelected,
}: AnimationClipSelectorProps) {
  const { refresh: refreshCredits } = useCredits();
  const [clips, setClips] = useState<AnimationClip[]>([]);
  const [selectedId, setSelectedId] = useState<string>("idle-pulse");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditErrorMsg, setCreditErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getAnimationClips()
      .then(setClips)
      .catch(() => {});
  }, []);

  const compatibleClips = rigType
    ? clips.filter((c) => c.compatible_rig_types.includes(rigType))
    : clips;

  const selectedClip =
    compatibleClips.find((c) => c.id === selectedId) ??
    compatibleClips[0] ??
    null;

  useEffect(() => {
    if (selectedClip) onClipSelected(selectedClip);
  }, [selectedClip?.id]);

  const isRunning =
    activeAnimJob &&
    (activeAnimJob.status === "queued" ||
      activeAnimJob.status === "processing");

  async function handleCreate() {
    if (!sourceRigJobId || !selectedClip) return;
    setIsCreating(true);
    setError(null);
    try {
      const aj = await createAnimationJob(sourceRigJobId, selectedClip.id);
      refreshCredits();
      onAnimJobCreated(aj);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create animation job";
      if (isCreditError(msg)) {
        setCreditErrorMsg(msg);
      } else {
        setError(msg);
      }
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {creditErrorMsg && (
        <InsufficientCreditsModal
          message={creditErrorMsg}
          onClose={() => { setCreditErrorMsg(null); refreshCredits(); }}
        />
      )}
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
        Motion Clips
      </div>

      {rigType && (
        <div className="text-[10px] font-mono text-slate-600 mb-1">
          Rig: <span className="text-slate-400">{rigType}</span>
          {" · "}
          <span className="text-slate-500">
            {compatibleClips.length} compatible
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {compatibleClips.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={[
              "text-left px-3 py-2.5 rounded-lg border text-xs transition-all",
              selectedClip?.id === c.id
                ? "border-cyan-500/40 bg-cyan-500/8 text-cyan-300"
                : "border-white/6 text-slate-400 hover:border-white/12 hover:text-slate-200",
            ].join(" ")}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm leading-none">
                {CLIP_ICONS[c.clip_type] ?? "◈"}
              </span>
              <span className="font-semibold flex-1">{c.name}</span>
              <span className="text-[9px] font-mono text-slate-600">
                {c.duration_seconds}s
              </span>
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
              {c.description}
            </div>
          </button>
        ))}

        {compatibleClips.length === 0 && (
          <p className="text-[11px] text-slate-600 px-1">
            No compatible clips for this rig type.
          </p>
        )}
      </div>

      {error && <div className="text-xs text-red-400 px-2">{error}</div>}

      <button
        onClick={handleCreate}
        disabled={!sourceRigJobId || isCreating || !!isRunning || !selectedClip}
        className={[
          "w-full py-2.5 rounded-lg border text-xs font-semibold transition-all",
          !sourceRigJobId || isCreating || isRunning || !selectedClip
            ? "border-slate-700 text-slate-600 cursor-not-allowed"
            : "border-cyan-500/40 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/5",
        ].join(" ")}
      >
        {isCreating ? "Creating..." : isRunning ? "Animating..." : (
          <span className="flex items-center justify-center gap-2">
            Preview Clip
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/20 text-cyan-500/60">8 cr</span>
          </span>
        )}
      </button>

      <div className="px-2 py-1.5 rounded border border-yellow-500/15 bg-yellow-500/5 text-[10px] font-mono text-yellow-500/70">
        ⚠ Mock animation provider — visual preview only
      </div>
    </div>
  );
}
