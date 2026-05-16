import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import EnvironmentLights from "../components/viewer/EnvironmentLights";
import PlaceholderMesh from "../components/viewer/PlaceholderMesh";
import SkeletonOverlay from "../components/rig/SkeletonOverlay";
import SocketVisualizer from "../components/rig/SocketVisualizer";
import RigProfileSelector from "../components/rig/RigProfileSelector";
import RigInspector from "../components/rig/RigInspector";
import RigJobPanel from "../components/rig/RigJobPanel";
import RigModulePanel from "../components/rig/RigModulePanel";
import TransformStatePanel from "../components/rig/TransformStatePanel";
import { getRigJob, listRigJobs, RigJob } from "../lib/rigs";
import { AttachmentSocket, ModuleAssignment } from "../lib/modules";
import { Job } from "../lib/jobs";

interface RigStudioProps {
  job: Job | null;
  onBack: () => void;
  onOpenAnimationPreview?: (rigJob: RigJob) => void;
}

type LeftTab = "profiles" | "modules";

function SceneContents({
  showSkeleton,
  showSockets,
  rigJob,
  sockets,
}: {
  showSkeleton: boolean;
  showSockets: boolean;
  rigJob: RigJob | null;
  sockets: AttachmentSocket[];
}) {
  const bones = rigJob?.skeleton_data?.bones ?? [];

  return (
    <>
      <color attach="background" args={["#0c0c14"]} />
      <EnvironmentLights />
      <PlaceholderMesh materialMode="solid" />
      {showSkeleton && bones.length > 0 && <SkeletonOverlay bones={bones} />}
      {showSockets && sockets.length > 0 && (
        <SocketVisualizer sockets={sockets} bones={bones} showLabels />
      )}
      <gridHelper
        args={[12, 24, "#1e293b", "#0f172a"]}
        position={[0, -0.42, 0]}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={1.5}
        maxDistance={22}
        makeDefault
      />
    </>
  );
}

export default function RigStudio({
  job,
  onBack,
  onOpenAnimationPreview,
}: RigStudioProps) {
  const [activeRigJob, setActiveRigJob] = useState<RigJob | null>(null);
  const [rigJobs, setRigJobs] = useState<RigJob[]>([]);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showSockets, setShowSockets] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>("profiles");
  const [assignment, setAssignment] = useState<ModuleAssignment | null>(null);

  useEffect(() => {
    listRigJobs().then(setRigJobs).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeRigJob) return;
    if (
      activeRigJob.status === "completed" ||
      activeRigJob.status === "failed"
    )
      return;

    const id = setInterval(async () => {
      try {
        const updated = await getRigJob(activeRigJob.id);
        setActiveRigJob(updated);
        setRigJobs((prev) => {
          const idx = prev.findIndex((r) => r.id === updated.id);
          if (idx === -1) return [updated, ...prev];
          const next = [...prev];
          next[idx] = updated;
          return next;
        });
      } catch {
        // ignore poll errors
      }
    }, 2000);

    return () => clearInterval(id);
  }, [activeRigJob]);

  // Clear assignment when switching rig jobs
  useEffect(() => {
    setAssignment(null);
  }, [activeRigJob?.id]);

  function handleRigJobCreated(rj: RigJob) {
    setActiveRigJob(rj);
    setRigJobs((prev) => {
      if (prev.find((r) => r.id === rj.id)) return prev;
      return [rj, ...prev];
    });
  }

  const sockets = assignment?.compatible_sockets ?? [];
  const statusLabel = activeRigJob
    ? activeRigJob.status === "completed"
      ? `Rig complete — ${activeRigJob.skeleton_data?.bones?.length ?? 0} bones`
      : activeRigJob.message || activeRigJob.status
    : "No rig job active";

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-[52px] shrink-0 border-b border-white/5 px-5 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-cyan-400 transition-colors font-mono"
        >
          ← Back
        </button>

        <div className="h-4 w-px bg-white/8" />

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            M
          </div>
          <span className="font-bold tracking-tight">MiniMesh</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">Rig Studio</span>
        </div>

        {job && (
          <span className="text-[10px] font-mono text-slate-500 ml-4">
            Source:{" "}
            <span className="text-slate-300">{job.id.slice(0, 8)}…</span>
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
          <span className="text-yellow-400 text-xs">⚠</span>
          <span className="text-[10px] font-mono text-yellow-500/80">
            Mock rig provider active
          </span>
        </div>

        {/* Viewport toggles */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowSkeleton((v) => !v)}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all",
              showSkeleton
                ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
                : "border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300",
            ].join(" ")}
          >
            ⊛ Skeleton
          </button>
          <button
            onClick={() => setShowSockets((v) => !v)}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all",
              showSockets
                ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                : "border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300",
            ].join(" ")}
          >
            ⊙ Sockets
          </button>
        </div>

        {activeRigJob?.status === "completed" && onOpenAnimationPreview && (
          <button
            onClick={() => onOpenAnimationPreview(activeRigJob)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/40 text-violet-300 text-xs font-semibold hover:border-violet-400/60 hover:bg-violet-500/5 transition-all ml-2"
          >
            Open Animation Preview →
          </button>
        )}

        <span className="text-xs font-mono text-slate-700 ml-4">
          Rig Studio — Phase 9
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel with tabs */}
        <div className="w-56 shrink-0 border-r border-white/5 flex flex-col overflow-hidden">
          {/* Tab header */}
          <div className="flex border-b border-white/5 shrink-0">
            {(["profiles", "modules"] as LeftTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={[
                  "flex-1 py-2 text-[10px] font-mono uppercase tracking-wide transition-all",
                  leftTab === tab
                    ? "text-cyan-400 border-b border-cyan-500/50 bg-cyan-500/5"
                    : "text-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {tab === "profiles" ? "Profiles" : "Modules"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            {leftTab === "profiles" ? (
              <>
                <RigProfileSelector
                  sourceJobId={job?.id ?? null}
                  activeRigJob={activeRigJob}
                  onRigJobCreated={handleRigJobCreated}
                />
                <RigJobPanel
                  rigJobs={rigJobs}
                  activeRigJobId={activeRigJob?.id ?? null}
                  onSelect={setActiveRigJob}
                />
              </>
            ) : (
              <RigModulePanel
                rigJobId={
                  activeRigJob?.status === "completed"
                    ? activeRigJob.id
                    : null
                }
                rigType={activeRigJob?.rig_type ?? null}
                onAssigned={(a) => {
                  setAssignment(a);
                  setShowSockets(true);
                }}
              />
            )}
          </div>
        </div>

        {/* Center: 3D viewport */}
        <div className="flex-1 relative">
          <Canvas
            dpr={[1, 2]}
            gl={{ antialias: true }}
            camera={{ position: [0, 1.1, 4.2], fov: 44 }}
            shadows
          >
            <SceneContents
              showSkeleton={showSkeleton}
              showSockets={showSockets}
              rigJob={activeRigJob}
              sockets={sockets}
            />
          </Canvas>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-white/8 bg-black/60 text-slate-600 backdrop-blur-sm">
              {statusLabel}
              {sockets.length > 0 && showSockets
                ? ` · ${sockets.length} sockets`
                : ""}
            </span>
          </div>

          {/* Socket legend */}
          {showSockets && sockets.length > 0 && (
            <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-none">
              {[
                { type: "armor", color: "#f59e0b", label: "Armor" },
                { type: "weapon", color: "#ef4444", label: "Weapon" },
                { type: "wings", color: "#8b5cf6", label: "Wings" },
                { type: "accessory", color: "#22d3ee", label: "Accessory" },
              ]
                .filter(({ type }) =>
                  sockets.some((s) => s.attachment_type === type)
                )
                .map(({ color, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 text-[9px] font-mono bg-black/60 px-2 py-1 rounded border border-white/8"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span style={{ color }}>{label}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 border-l border-white/5 flex flex-col overflow-y-auto p-4 gap-6">
          <RigInspector rigJob={activeRigJob} />

          {assignment && (
            <>
              <div className="border-t border-white/5 pt-4">
                <TransformStatePanel assignment={assignment} />
              </div>

              {assignment.assigned_modules.length > 0 && (
                <div className="border-t border-white/5 pt-4">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                    Active Modules
                  </div>
                  <div className="flex flex-col gap-1">
                    {assignment.assigned_modules.map((m) => (
                      <div
                        key={m.id}
                        className="text-[10px] font-mono px-2 py-1.5 rounded border border-cyan-500/20 text-cyan-400/70 bg-cyan-500/5"
                      >
                        {m.name}
                      </div>
                    ))}
                  </div>
                  {assignment.incompatible_modules.length > 0 && (
                    <div className="mt-2 text-[9px] font-mono text-slate-600">
                      {assignment.incompatible_modules.length} module(s)
                      skipped (incompatible)
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
