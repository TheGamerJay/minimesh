import { useState } from "react";
import {
  AssetExportPackage,
  EXPORT_TYPES,
  VERSION_OPTIONS,
  createExportPackage,
} from "../../lib/exportV2";
import { GeneratedAsset } from "../../lib/assets";

interface Props {
  asset: GeneratedAsset;
  onPackageCreated: (pkg: AssetExportPackage) => void;
}

export default function ExportPackageBuilder({ asset, onPackageCreated }: Props) {
  const [exportType, setExportType] = useState("full_project_bundle");
  const [versionLabel, setVersionLabel] = useState("latest");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = EXPORT_TYPES.find((t) => t.value === exportType)!;

  async function handleBuild() {
    setBuilding(true);
    setError(null);
    try {
      const pkg = await createExportPackage(asset.id, exportType, versionLabel);
      onPackageCreated(pkg);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Build failed");
    }
    setBuilding(false);
  }

  return (
    <div className="p-4 space-y-4">
      {/* Asset display */}
      <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-200 truncate">{asset.name}</div>
          <div className="text-[10px] text-gray-500">
            v{asset.version} · {asset.asset_type.toUpperCase()} · {asset.provider}
          </div>
        </div>
      </div>

      {/* Export type */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Export Type</div>
        <div className="space-y-1">
          {EXPORT_TYPES.map((et) => (
            <button
              key={et.value}
              onClick={() => setExportType(et.value)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                exportType === et.value
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                  : "border-gray-700/40 bg-gray-800/30 text-gray-400 hover:text-gray-300 hover:border-gray-600"
              }`}
            >
              <div className="font-medium">{et.label}</div>
              <div className="text-[10px] opacity-60 mt-0.5">{et.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Version selector */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Asset Version</div>
        <div className="space-y-1">
          {VERSION_OPTIONS.map((vo) => (
            <button
              key={vo.value}
              onClick={() => setVersionLabel(vo.value)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                versionLabel === vo.value
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                  : "border-gray-700/40 bg-gray-800/30 text-gray-400 hover:text-gray-300 hover:border-gray-600"
              }`}
            >
              <div className="font-medium">{vo.label}</div>
              <div className="text-[10px] opacity-60">{vo.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Includes summary */}
      <div className="rounded-lg bg-gray-800/40 border border-gray-700/30 px-3 py-2 space-y-1">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Will include</div>
        <div className="flex flex-wrap gap-1">
          {selectedType.includes.map((item) => (
            <span
              key={item}
              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-300 border border-gray-600/40"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{error}</div>
      )}

      <button
        onClick={handleBuild}
        disabled={building}
        className="w-full py-2.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {building ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Building Package…
          </span>
        ) : "Build Export Package"}
      </button>
    </div>
  );
}
