import { useEffect, useRef, useState } from "react";
import { MODE_LABELS } from "../lib/generation";
import {
  getProjectSession,
  ProjectSession,
  updateProjectName,
} from "../lib/projects";

interface Props {
  refreshKey: number;
}

const STATUS_CONFIG = {
  not_ready: {
    label: "Not ready for generation yet",
    textColor: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    barColor: "bg-red-500",
    badgeDot: "bg-red-500",
  },
  basic_ready: {
    label: "Basic reference set ready",
    textColor: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    barColor: "bg-amber-400",
    badgeDot: "bg-amber-400",
  },
  strong_ready: {
    label: "Strong reference set ready",
    textColor: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    barColor: "bg-cyan-500",
    badgeDot: "bg-emerald-400",
  },
};

export default function ProjectSessionPanel({ refreshKey }: Props) {
  const [session, setSession] = useState<ProjectSession | null>(null);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSession();
  }, [refreshKey]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function fetchSession() {
    try {
      const s = await getProjectSession();
      setSession(s);
      if (!editing) setNameInput(s.name);
    } catch {
      // non-critical
    }
  }

  async function saveName() {
    setEditing(false);
    if (!session) return;
    const trimmed = nameInput.trim() || "Untitled MiniMesh Project";
    if (trimmed === session.name) return;
    try {
      const s = await updateProjectName(trimmed);
      setSession(s);
      setNameInput(s.name);
    } catch {
      setNameInput(session.name);
    }
  }

  if (!session) {
    return (
      <div className="glass rounded-2xl px-6 py-5 flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" />
        <span className="text-xs text-slate-600 font-mono">
          Loading project session…
        </span>
      </div>
    );
  }

  const { readiness } = session;
  const cfg =
    STATUS_CONFIG[readiness.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.not_ready;
  const modeReqs = readiness.generation_mode_requirements;

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      {/* ── Name + Status badge ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setEditing(false);
                  setNameInput(session.name);
                }
              }}
              className="text-sm font-semibold bg-black/40 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none w-64"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              title="Click to rename project"
              className="group flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-cyan-400 transition-colors min-w-0 text-left"
            >
              <span className="truncate">{session.name}</span>
              <span className="text-slate-700 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                ✎
              </span>
            </button>
          )}
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono shrink-0 ${cfg.textColor} ${cfg.border} ${cfg.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.badgeDot}`} />
          {cfg.label}
        </div>
      </div>

      {/* ── Score + progress bar ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-600">Generation Readiness</span>
          <span className={`font-semibold ${cfg.textColor}`}>
            {readiness.score}&nbsp;/&nbsp;100
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${cfg.barColor}`}
            style={{ width: `${readiness.score}%` }}
          />
        </div>
      </div>

      {/* ── Reference details grid ── */}
      {(readiness.missing.length > 0 ||
        readiness.warnings.length > 0 ||
        readiness.strengths.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-white/5">
          {readiness.missing.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[10px] font-mono text-red-500/70 uppercase tracking-widest mb-0.5">
                Required
              </h4>
              {readiness.missing.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-1.5 text-xs text-red-400/80"
                >
                  <span className="shrink-0 mt-0.5">✗</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {readiness.warnings.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest mb-0.5">
                Suggested
              </h4>
              {readiness.warnings.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-1.5 text-xs text-amber-400/70"
                >
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {readiness.strengths.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest mb-0.5">
                Provided
              </h4>
              {readiness.strengths.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-1.5 text-xs text-emerald-400/80"
                >
                  <span className="shrink-0 mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {readiness.missing.length === 0 &&
        readiness.warnings.length === 0 &&
        readiness.strengths.length === 0 && (
          <p className="text-xs text-slate-700 font-mono">
            Upload and tag reference images to see readiness analysis.
          </p>
        )}

      {/* ── Mode-specific requirements ── */}
      <div className="pt-1 border-t border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
            Output Type
          </h4>
          <span className="text-xs font-mono text-violet-400">
            {MODE_LABELS[modeReqs.mode] ?? modeReqs.mode}
          </span>
        </div>

        {(modeReqs.met.length > 0 || modeReqs.missing.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {modeReqs.met.map((item) => (
              <div
                key={item}
                className="flex items-start gap-1.5 text-xs text-emerald-400/70"
              >
                <span className="shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </div>
            ))}
            {modeReqs.missing.map((item) => (
              <div
                key={item}
                className="flex items-start gap-1.5 text-xs text-slate-600"
              >
                <span className="shrink-0 mt-0.5">○</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {modeReqs.met.length === 0 && modeReqs.missing.length === 0 && (
          <p className="text-xs text-slate-700 font-mono">
            No requirements defined for this mode.
          </p>
        )}
      </div>
    </div>
  );
}
