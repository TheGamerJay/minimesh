import { useEffect, useState } from "react";
import {
  createRigJob,
  getRigProfiles,
  RigJob,
  RigProfile,
} from "../../lib/rigs";
import { isCreditError } from "../../lib/credits";
import { useCredits } from "../../lib/creditContext";
import InsufficientCreditsModal from "../credits/InsufficientCreditsModal";

interface RigProfileSelectorProps {
  sourceJobId: string | null;
  activeRigJob: RigJob | null;
  onRigJobCreated: (rj: RigJob) => void;
}

export default function RigProfileSelector({
  sourceJobId,
  activeRigJob,
  onRigJobCreated,
}: RigProfileSelectorProps) {
  const { refresh: refreshCredits } = useCredits();
  const [profiles, setProfiles] = useState<RigProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("humanoid-basic");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditErrorMsg, setCreditErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getRigProfiles()
      .then(setProfiles)
      .catch(() => {});
  }, []);

  const selectedProfile = profiles.find((p) => p.id === selectedId) ?? null;
  const isRunning =
    activeRigJob &&
    (activeRigJob.status === "queued" || activeRigJob.status === "processing");

  async function handleCreate() {
    if (!sourceJobId || !selectedProfile) return;
    setIsCreating(true);
    setError(null);
    try {
      const rj = await createRigJob(sourceJobId, selectedProfile.rig_type);
      refreshCredits();
      onRigJobCreated(rj);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create rig job";
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
        Rig Profiles
      </div>

      <div className="flex flex-col gap-1.5">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={[
              "text-left px-3 py-2.5 rounded-lg border text-xs transition-all",
              selectedId === p.id
                ? "border-cyan-500/40 bg-cyan-500/8 text-cyan-300"
                : "border-white/6 text-slate-400 hover:border-white/12 hover:text-slate-200",
            ].join(" ")}
          >
            <div className="font-semibold mb-0.5">{p.name}</div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
              {p.description}
            </div>
            {p.supports_animation && (
              <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded border border-violet-500/20 text-violet-400/70">
                animation-ready
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedProfile && (
        <div className="px-3 py-2 rounded-lg border border-white/5 bg-white/2 text-[10px] text-slate-500">
          <div className="font-mono mb-1 text-slate-400">Expected bones</div>
          <div className="flex flex-wrap gap-1">
            {selectedProfile.expected_bones.map((b) => (
              <span
                key={b}
                className="px-1.5 py-0.5 rounded border border-white/8 bg-white/3 font-mono"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-400 px-2">{error}</div>}

      <button
        onClick={handleCreate}
        disabled={!sourceJobId || isCreating || !!isRunning}
        className={[
          "w-full py-2.5 rounded-lg border text-xs font-semibold transition-all",
          !sourceJobId || isCreating || isRunning
            ? "border-slate-700 text-slate-600 cursor-not-allowed"
            : "border-cyan-500/40 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/5",
        ].join(" ")}
      >
          {isCreating ? "Creating..." : isRunning ? "Rigging..." : (
          <span className="flex items-center justify-center gap-2">
            Create Rig Job
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/20 text-cyan-500/60">10 cr</span>
          </span>
        )}
      </button>

      <div className="px-2 py-1.5 rounded border border-yellow-500/15 bg-yellow-500/5 text-[10px] font-mono text-yellow-500/70">
        ⚠ Mock rig provider — simulated skeleton placement
      </div>
    </div>
  );
}
