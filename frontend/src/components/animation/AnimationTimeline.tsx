interface AnimationTimelineProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  onSpeedChange: (s: number) => void;
  onLoopToggle: () => void;
}

const SPEEDS = [0.5, 1, 1.5, 2];

function fmt(n: number) {
  return n.toFixed(2);
}

export default function AnimationTimeline({
  isPlaying,
  currentTime,
  duration,
  speed,
  loop,
  onPlayPause,
  onRestart,
  onSpeedChange,
  onLoopToggle,
}: AnimationTimelineProps) {
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div className="border-t border-white/5 bg-black/40 px-4 py-3 flex flex-col gap-2 shrink-0">
      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-cyan-500/70 rounded-full"
          style={{ width: `${progress}%`, transition: "width 0.05s linear" }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPlayPause}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400 transition-all text-sm"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          onClick={onRestart}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200 transition-all"
        >
          ↺
        </button>

        <span className="text-[10px] font-mono text-slate-500 ml-1">
          <span className="text-slate-300">{fmt(currentTime)}</span>
          {" / "}
          {fmt(duration)}s
        </span>

        <div className="flex-1" />

        <button
          onClick={onLoopToggle}
          className={[
            "px-2 py-0.5 rounded border text-[10px] font-mono transition-all",
            loop
              ? "border-violet-500/40 text-violet-300 bg-violet-500/8"
              : "border-white/8 text-slate-500 hover:border-white/15 hover:text-slate-300",
          ].join(" ")}
        >
          ⟳ Loop
        </button>

        <div className="flex items-center gap-1 ml-2">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={[
                "px-1.5 py-0.5 rounded border text-[9px] font-mono transition-all",
                speed === s
                  ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/8"
                  : "border-white/6 text-slate-600 hover:border-white/12 hover:text-slate-400",
              ].join(" ")}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
