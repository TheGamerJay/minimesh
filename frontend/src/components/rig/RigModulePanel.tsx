import { useEffect, useState } from "react";
import {
  assignModules,
  getModules,
  ModuleAssignment,
  RigModule,
} from "../../lib/modules";

interface RigModulePanelProps {
  rigJobId: string | null;
  rigType: string | null;
  onAssigned: (assignment: ModuleAssignment) => void;
}

const MODULE_TYPE_ICONS: Record<string, string> = {
  wings: "⟁",
  shield: "◈",
  weapon: "⚡",
  tail: "∿",
  armor: "◉",
  vehicle_part: "⚙",
  accessory: "◎",
};

export default function RigModulePanel({
  rigJobId,
  rigType,
  onAssigned,
}: RigModulePanelProps) {
  const [modules, setModules] = useState<RigModule[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getModules()
      .then(setModules)
      .catch(() => {});
  }, []);

  function toggleModule(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (!rigJobId || selected.size === 0) return;
    setIsAssigning(true);
    setError(null);
    try {
      const result = await assignModules(rigJobId, [...selected]);
      onAssigned(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to assign modules");
    } finally {
      setIsAssigning(false);
    }
  }

  const compatible = rigType
    ? modules.filter((m) => m.compatible_rig_types.includes(rigType))
    : modules;
  const incompatibleList = rigType
    ? modules.filter((m) => !m.compatible_rig_types.includes(rigType))
    : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
        Rig Modules
      </div>

      {!rigJobId && (
        <p className="text-[11px] text-slate-600">
          Complete a rig job to assign modules.
        </p>
      )}

      {modules.length > 0 && (
        <>
          <div className="flex flex-col gap-1">
            {compatible.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleModule(m.id)}
                className={[
                  "text-left px-2.5 py-2 rounded-lg border text-xs transition-all",
                  selected.has(m.id)
                    ? "border-cyan-500/40 bg-cyan-500/8 text-cyan-300"
                    : "border-white/6 text-slate-400 hover:border-white/12 hover:text-slate-200",
                ].join(" ")}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span>{MODULE_TYPE_ICONS[m.module_type] ?? "◈"}</span>
                  <span className="font-semibold flex-1 text-[11px]">
                    {m.name}
                  </span>
                  {selected.has(m.id) && (
                    <span className="text-[9px] text-cyan-400">✓</span>
                  )}
                </div>
                <div className="text-[9px] text-slate-500 leading-relaxed">
                  {m.description}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {m.required_bones.map((b) => (
                    <span
                      key={b}
                      className="text-[8px] font-mono px-1 py-0.5 rounded border border-white/8 bg-white/3 text-slate-500"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </button>
            ))}

            {incompatibleList.length > 0 && (
              <>
                <div className="text-[9px] font-mono text-slate-700 mt-1 px-1">
                  — incompatible with {rigType} —
                </div>
                {incompatibleList.map((m) => (
                  <div
                    key={m.id}
                    className="px-2.5 py-2 rounded-lg border border-white/4 opacity-40 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{MODULE_TYPE_ICONS[m.module_type] ?? "◈"}</span>
                      <span className="text-[11px] text-slate-500">
                        {m.name}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {error && (
            <div className="text-xs text-red-400 px-1">{error}</div>
          )}

          <button
            onClick={handleAssign}
            disabled={!rigJobId || isAssigning || selected.size === 0}
            className={[
              "w-full py-2 rounded-lg border text-xs font-semibold transition-all",
              !rigJobId || isAssigning || selected.size === 0
                ? "border-slate-700 text-slate-600 cursor-not-allowed"
                : "border-cyan-500/40 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/5",
            ].join(" ")}
          >
            {isAssigning
              ? "Assigning..."
              : selected.size > 0
              ? `Assign ${selected.size} Module${selected.size > 1 ? "s" : ""}`
              : "Select modules above"}
          </button>
        </>
      )}

      <div className="px-2 py-1.5 rounded border border-yellow-500/15 bg-yellow-500/5 text-[10px] font-mono text-yellow-500/70">
        ⚠ Modular rig metadata only — real IK and mesh transforms in future phases
      </div>
    </div>
  );
}
