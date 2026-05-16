import { useState } from "react";
import { ModuleAssignment } from "../../lib/modules";

interface TransformStatePanelProps {
  assignment: ModuleAssignment | null;
}

const STATE_ICONS: Record<string, string> = {
  wings_extended: "⟁",
  wings_shield: "◈",
  combat_stance: "⚡",
  compact: "◎",
};

const STATE_COLORS: Record<string, string> = {
  wings_extended: "violet",
  wings_shield: "cyan",
  combat_stance: "red",
  compact: "slate",
};

function stateClasses(behavior: string, isActive: boolean) {
  const c = STATE_COLORS[behavior] ?? "slate";
  if (!isActive) {
    return "border-white/6 text-slate-400 hover:border-white/12 hover:text-slate-200";
  }
  const map: Record<string, string> = {
    violet: "border-violet-500/40 bg-violet-500/8 text-violet-300",
    cyan: "border-cyan-500/40 bg-cyan-500/8 text-cyan-300",
    red: "border-red-500/40 bg-red-500/8 text-red-300",
    slate: "border-slate-500/40 bg-slate-500/8 text-slate-300",
  };
  return map[c] ?? map.slate;
}

export default function TransformStatePanel({
  assignment,
}: TransformStatePanelProps) {
  const [activeStateId, setActiveStateId] = useState<string | null>(null);

  const states = assignment?.transform_states ?? [];
  const assignedIds = new Set(
    (assignment?.assigned_modules ?? []).map((m) => m.id)
  );

  if (states.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          Transform States
        </div>
        <p className="text-[11px] text-slate-600">
          Assign modules to see available states.
        </p>
      </div>
    );
  }

  const activeState = states.find((s) => s.id === activeStateId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Transform States
      </div>

      <div className="flex flex-col gap-1.5">
        {states.map((s) => {
          const isActive = activeStateId === s.id;
          const activeModuleCount = s.active_modules.filter((id) =>
            assignedIds.has(id)
          ).length;

          return (
            <button
              key={s.id}
              onClick={() =>
                setActiveStateId(isActive ? null : s.id)
              }
              className={[
                "text-left px-3 py-2.5 rounded-lg border text-xs transition-all",
                stateClasses(s.transform_behavior, isActive),
              ].join(" ")}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base leading-none">
                  {STATE_ICONS[s.transform_behavior] ?? "◈"}
                </span>
                <span className="font-semibold flex-1">{s.name}</span>
                {activeModuleCount > 0 && (
                  <span className="text-[9px] font-mono opacity-60">
                    {activeModuleCount} mod
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 leading-relaxed">
                {s.description}
              </div>

              {isActive && s.active_modules.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.active_modules.map((mid) => (
                    <span
                      key={mid}
                      className={[
                        "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                        assignedIds.has(mid)
                          ? "border-cyan-500/30 text-cyan-400/80 bg-cyan-500/5"
                          : "border-white/8 text-slate-600",
                      ].join(" ")}
                    >
                      {mid}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {activeState && (
        <div className="px-3 py-2 rounded-lg border border-white/5 bg-white/2 text-[10px] text-slate-500">
          <div className="font-mono text-slate-400 mb-1">
            behavior: {activeState.transform_behavior}
          </div>
          <div className="text-yellow-500/70 font-mono">
            ⚠ Metadata only — real transform mechanics in Phase 10+
          </div>
        </div>
      )}
    </div>
  );
}
