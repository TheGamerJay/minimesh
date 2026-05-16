import { SCULPT_TOOLS } from "../../lib/edits";

interface Props {
  activeTool: string;
  onSelect: (tool: string) => void;
}

export default function SculptToolbar({ activeTool, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-0.5 p-3">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">
        Tools
      </span>
      {SCULPT_TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onSelect(tool.id)}
          title={tool.description}
          className={[
            "px-2.5 py-2 rounded text-left transition-colors border",
            activeTool === tool.id
              ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-gray-800/50 border-transparent",
          ].join(" ")}
        >
          <span className="text-[11px] font-mono font-medium">{tool.label}</span>
          <p className="text-[9px] text-slate-600 mt-0.5 leading-tight">{tool.description}</p>
        </button>
      ))}
    </div>
  );
}
