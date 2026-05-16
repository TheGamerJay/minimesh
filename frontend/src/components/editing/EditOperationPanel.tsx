import { EditOperation } from "../../lib/edits";
import { BrushSettings } from "./BrushSettingsPanel";

interface Props {
  operation: EditOperation | null;
  activeTool: string;
  brushSettings: BrushSettings;
  assetId: string | null;
  onApply: () => void;
  applying: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  queued:     "text-yellow-500",
  processing: "text-cyan-400",
  completed:  "text-emerald-400",
  failed:     "text-red-400",
};

export default function EditOperationPanel({
  operation, activeTool, brushSettings, assetId, onApply, applying,
}: Props) {
  return (
    <div className="w-56 shrink-0 border-l border-white/5 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/5">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Edit Inspector
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Apply button */}
        <button
          onClick={onApply}
          disabled={applying || !assetId}
          className={[
            "w-full py-2 rounded text-[11px] font-medium transition-colors",
            applying
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : assetId
              ? "bg-violet-600 hover:bg-violet-500 text-white"
              : "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700/30",
          ].join(" ")}
        >
          {applying ? "Applying…" : "Apply Edit Preview"}
        </button>

        {!assetId && (
          <p className="text-[9px] font-mono text-slate-700 leading-relaxed">
            Open a job from Generated Assets to enable edit operations.
          </p>
        )}

        {/* Current settings */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">
            Current Settings
          </span>
          <Row label="Tool" value={activeTool} />
          <Row label="Radius" value={String(brushSettings.radius)} />
          <Row label="Strength" value={brushSettings.strength.toFixed(2)} />
          <Row label="Symmetry" value={brushSettings.symmetry ? "ON" : "OFF"} />
          <Row label="Falloff" value={brushSettings.falloff} />
        </div>

        {/* Last operation */}
        {operation && (
          <div className="rounded border border-gray-700/30 bg-gray-800/20 p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Last Op</span>
              <span className={[
                "text-[9px] font-mono capitalize",
                STATUS_COLORS[operation.status] ?? "text-slate-500",
              ].join(" ")}>
                {operation.status}
              </span>
            </div>
            <Row label="Type" value={operation.operation_type} />
            <Row label="Brush" value={operation.brush_type} />
            <Row label="Strength" value={String(operation.strength)} />
            <Row label="Provider" value={operation.provider} />
            {operation.message && (
              <p className="text-[9px] font-mono text-slate-600 truncate">{operation.message}</p>
            )}
          </div>
        )}

        {/* Future placeholders */}
        <div className="space-y-1 opacity-30">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">Future</span>
          <p className="text-[9px] font-mono text-slate-700">· Layer stack</p>
          <p className="text-[9px] font-mono text-slate-700">· Mask controls</p>
          <p className="text-[9px] font-mono text-slate-700">· Topology editor</p>
        </div>

        {/* Mock disclaimer */}
        <div className="px-2 py-1.5 rounded border border-yellow-500/15 bg-yellow-500/5">
          <p className="text-[9px] font-mono text-yellow-600 leading-relaxed">
            Mock edit provider — real mesh deformation and topology editing arrive in future phases.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[9px] font-mono text-slate-600">{label}</span>
      <span className="text-[9px] font-mono text-slate-400 capitalize">{value}</span>
    </div>
  );
}
