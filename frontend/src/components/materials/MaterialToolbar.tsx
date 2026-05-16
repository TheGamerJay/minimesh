import { MaterialProfile } from "../../lib/materials";

export default function MaterialToolbar({
  material: _material,
  onReset,
  onSavePreset,
  onDuplicate,
  onRandomize,
}: {
  material: MaterialProfile;
  onReset: () => void;
  onSavePreset: () => void;
  onDuplicate: () => void;
  onRandomize: () => void;
}) {
  const btns = [
    { label: "Reset", icon: "↺", onClick: onReset, cost: null },
    { label: "Save Preset", icon: "⊕", onClick: onSavePreset, cost: "2 cr" },
    { label: "Duplicate", icon: "⧉", onClick: onDuplicate, cost: "2 cr" },
    { label: "Randomize", icon: "⚄", onClick: onRandomize, cost: null },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
      {btns.map((b) => (
        <button
          key={b.label}
          onClick={b.onClick}
          title={b.label}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent hover:border-white/8 transition-all duration-150"
        >
          <span>{b.icon}</span>
          <span className="hidden sm:inline">{b.label}</span>
          {b.cost && (
            <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-cyan-500/20 text-cyan-500/60">{b.cost}</span>
          )}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-600">
          Preview shaders only — texture baking in future phases
        </span>
      </div>
    </div>
  );
}
