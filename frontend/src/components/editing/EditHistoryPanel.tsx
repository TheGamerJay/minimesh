import { EditOperation } from "../../lib/edits";

interface Props {
  operations: EditOperation[];
}

const STATUS_COLORS: Record<string, string> = {
  queued:     "text-yellow-500",
  processing: "text-cyan-400",
  completed:  "text-emerald-400",
  failed:     "text-red-400",
};

export default function EditHistoryPanel({ operations }: Props) {
  return (
    <div className="shrink-0 h-28 border-t border-white/5 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 shrink-0">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Edit Timeline
        </span>
        <div className="flex gap-1">
          <button
            disabled
            title="Undo — future phase"
            className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-700 border border-gray-800 cursor-not-allowed opacity-40"
          >
            ↩ Undo
          </button>
          <button
            disabled
            title="Redo — future phase"
            className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-700 border border-gray-800 cursor-not-allowed opacity-40"
          >
            ↪ Redo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        {operations.length === 0 ? (
          <div className="flex items-center h-full px-4">
            <p className="text-[10px] font-mono text-slate-700">
              No edit operations yet — apply an edit preview to begin.
            </p>
          </div>
        ) : (
          <div className="flex gap-2 px-3 py-2 h-full items-stretch">
            {operations.map((op) => (
              <div
                key={op.id}
                className="shrink-0 w-36 rounded border border-gray-700/30 bg-gray-800/20 p-2 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-mono text-slate-400 capitalize truncate">
                    {op.operation_type}
                  </span>
                  <span className={[
                    "text-[9px] font-mono shrink-0",
                    STATUS_COLORS[op.status] ?? "text-slate-500",
                  ].join(" ")}>
                    {op.status}
                  </span>
                </div>
                <div className="space-y-0.5 mt-1">
                  <p className="text-[8px] font-mono text-slate-600 capitalize">{op.brush_type}</p>
                  <p className="text-[8px] font-mono text-slate-700">r:{op.radius} s:{op.strength.toFixed(1)}</p>
                  <p className="text-[8px] font-mono text-slate-700">
                    {new Date(op.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
