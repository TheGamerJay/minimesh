import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import EnvironmentLights from "../components/viewer/EnvironmentLights";
import PlaceholderMesh from "../components/viewer/PlaceholderMesh";
import MockMotionOverlay from "../components/animation/MockMotionOverlay";
import AnimationClipSelector from "../components/animation/AnimationClipSelector";
import AnimationInspector from "../components/animation/AnimationInspector";
import AnimationTimeline from "../components/animation/AnimationTimeline";
import AnimationJobPanel from "../components/animation/AnimationJobPanel";
import {
  AnimationClip,
  AnimationJob,
  getAnimationJob,
  listAnimationJobs,
} from "../lib/animations";
import { RigBone, RigJob } from "../lib/rigs";

interface AnimationPreviewProps {
  rigJob: RigJob | null;
  onBack: () => void;
}

function SceneContents({
  bones,
  clipType,
  isPlaying,
  speed,
  duration,
  loop,
  restartTrigger,
  onTimeUpdate,
  onEnded,
}: {
  bones: RigBone[];
  clipType: string;
  isPlaying: boolean;
  speed: number;
  duration: number;
  loop: boolean;
  restartTrigger: number;
  onTimeUpdate: (t: number) => void;
  onEnded: () => void;
}) {
  return (
    <>
      <color attach="background" args={["#0c0c14"]} />
      <EnvironmentLights />
      <PlaceholderMesh materialMode="solid" />
      {bones.length > 0 && (
        <MockMotionOverlay
          bones={bones}
          clipType={clipType}
          isPlaying={isPlaying}
          speed={speed}
          duration={duration}
          loop={loop}
          restartTrigger={restartTrigger}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
        />
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

export default function AnimationPreview({ rigJob, onBack }: AnimationPreviewProps) {
  const [activeAnimJob, setActiveAnimJob] = useState<AnimationJob | null>(null);
  const [animJobs, setAnimJobs] = useState<AnimationJob[]>([]);
  const [selectedClip, setSelectedClip] = useState<AnimationClip | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [restartTrigger, setRestartTrigger] = useState(0);

  const lastTimeUpdateRef = useRef(0);

  const duration = selectedClip?.duration_seconds ?? 3.0;
  const bones = rigJob?.skeleton_data?.bones ?? [];
  const clipType = selectedClip?.clip_type ?? "idle";

  useEffect(() => {
    listAnimationJobs().then(setAnimJobs).catch(() => {});
  }, []);

  // Poll active job while non-terminal
  useEffect(() => {
    if (!activeAnimJob) return;
    if (
      activeAnimJob.status === "completed" ||
      activeAnimJob.status === "failed"
    )
      return;

    const id = setInterval(async () => {
      try {
        const updated = await getAnimationJob(activeAnimJob.id);
        setActiveAnimJob(updated);
        setAnimJobs((prev) => {
          const idx = prev.findIndex((a) => a.id === updated.id);
          if (idx === -1) return [updated, ...prev];
          const next = [...prev];
          next[idx] = updated;
          return next;
        });
        // Auto-play when completed
        if (updated.status === "completed") setIsPlaying(true);
      } catch {
        // ignore poll errors
      }
    }, 2000);

    return () => clearInterval(id);
  }, [activeAnimJob]);

  function handleAnimJobCreated(aj: AnimationJob) {
    setActiveAnimJob(aj);
    setIsPlaying(false);
    setCurrentTime(0);
    setAnimJobs((prev) => {
      if (prev.find((a) => a.id === aj.id)) return prev;
      return [aj, ...prev];
    });
  }

  // Throttled time update — limits React re-renders to ~20fps
  const handleTimeUpdate = useCallback((t: number) => {
    const now = performance.now();
    if (now - lastTimeUpdateRef.current > 50) {
      lastTimeUpdateRef.current = now;
      setCurrentTime(t);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  function handleRestart() {
    setCurrentTime(0);
    setRestartTrigger((n) => n + 1);
  }

  const canPlay = bones.length > 0 && !!selectedClip;

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
          <span className="text-sm text-slate-400">Animation Preview</span>
        </div>

        {rigJob && (
          <span className="text-[10px] font-mono text-slate-500 ml-4">
            Rig:{" "}
            <span className="text-slate-300">{rigJob.rig_type}</span>
            {" · "}
            <span className="text-slate-400">{rigJob.id.slice(0, 8)}…</span>
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
          <span className="text-yellow-400 text-xs">⚠</span>
          <span className="text-[10px] font-mono text-yellow-500/80">
            Mock animation provider active — real retargeting in future phases
          </span>
        </div>

        <span className="ml-auto text-xs font-mono text-slate-700">
          Animation Preview — Phase 8
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-56 shrink-0 border-r border-white/5 flex flex-col overflow-y-auto p-4 gap-6">
          {rigJob ? (
            <>
              <AnimationClipSelector
                sourceRigJobId={rigJob.id}
                rigType={rigJob.rig_type}
                activeAnimJob={activeAnimJob}
                onAnimJobCreated={handleAnimJobCreated}
                onClipSelected={setSelectedClip}
              />
              <AnimationJobPanel
                animJobs={animJobs}
                activeAnimJobId={activeAnimJob?.id ?? null}
                onSelect={(aj) => {
                  setActiveAnimJob(aj);
                  if (aj.status === "completed") setIsPlaying(true);
                }}
              />
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                Motion Clips
              </div>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="text-3xl">⚙</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Complete a rig job first.
                </p>
                <button
                  onClick={onBack}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                >
                  ← Go to Rig Studio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center: 3D viewport */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <Canvas
              dpr={[1, 2]}
              gl={{ antialias: true }}
              camera={{ position: [0, 1.1, 4.2], fov: 44 }}
              shadows
            >
              <SceneContents
                bones={bones}
                clipType={clipType}
                isPlaying={isPlaying && canPlay}
                speed={speed}
                duration={duration}
                loop={loop}
                restartTrigger={restartTrigger}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
              />
            </Canvas>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-white/8 bg-black/60 text-slate-600 backdrop-blur-sm">
                {!rigJob
                  ? "No rig job — complete a rig job to preview animation"
                  : bones.length === 0
                  ? "Rig job has no skeleton data"
                  : activeAnimJob?.status === "completed"
                  ? `${selectedClip?.name ?? "Clip"} — mock motion preview`
                  : activeAnimJob
                  ? activeAnimJob.message || activeAnimJob.status
                  : "Select a clip and click Preview Clip"}
              </span>
            </div>
          </div>

          <AnimationTimeline
            isPlaying={isPlaying && canPlay}
            currentTime={currentTime}
            duration={duration}
            speed={speed}
            loop={loop}
            onPlayPause={() => {
              if (!canPlay) return;
              setIsPlaying((v) => !v);
            }}
            onRestart={handleRestart}
            onSpeedChange={setSpeed}
            onLoopToggle={() => setLoop((v) => !v)}
          />
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 border-l border-white/5 flex flex-col overflow-y-auto p-4">
          <AnimationInspector
            animJob={activeAnimJob}
            selectedClip={selectedClip}
          />
        </div>
      </div>
    </div>
  );
}
