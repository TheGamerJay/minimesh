import { PricingConfig } from "../../lib/credits";

const PRICING_ROWS = [
  { key: "generation_cost" as keyof PricingConfig, label: "Generate Draft Mesh", icon: "◈" },
  { key: "rigging_cost" as keyof PricingConfig, label: "Create Rig Job", icon: "⚙" },
  { key: "animation_cost" as keyof PricingConfig, label: "Preview Animation Clip", icon: "▶" },
  { key: "export_cost" as keyof PricingConfig, label: "Create Export Package", icon: "⬇" },
  { key: "material_preset_cost" as keyof PricingConfig, label: "Save Material Preset", icon: "◉" },
];

export default function PricingPanel({ pricing }: { pricing: PricingConfig }) {
  return (
    <div className="flex flex-col gap-1">
      {PRICING_ROWS.map((row) => (
        <div
          key={row.key}
          className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">{row.icon}</span>
            <span className="text-xs text-slate-300">{row.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold font-mono tabular-nums text-cyan-400">
              {pricing[row.key]}
            </span>
            <span className="text-[10px] text-slate-600">cr</span>
          </div>
        </div>
      ))}
    </div>
  );
}
