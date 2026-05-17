import { useState, useEffect, useCallback } from "react";
import { AssetExportPackage, listExportPackages } from "../lib/exportV2";
import { GeneratedAsset, listAssets } from "../lib/assets";
import ExportPackageBuilder from "../components/export/ExportPackageBuilder";
import ExportHistoryPanel from "../components/export/ExportHistoryPanel";
import ExportInspector from "../components/export/ExportInspector";

interface Props {
  onBack: () => void;
  preloadedAssetId?: string | null;
}

export default function ExportManager({ onBack, preloadedAssetId }: Props) {
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [packages, setPackages] = useState<AssetExportPackage[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(preloadedAssetId ?? null);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [loadingPkgs, setLoadingPkgs] = useState(false);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null;
  const selectedPkg = packages.find((p) => p.id === selectedPkgId) ?? null;

  const loadAssets = useCallback(async () => {
    try {
      const data = await listAssets();
      setAssets(data);
    } catch {}
  }, []);

  const loadPackages = useCallback(async (assetId?: string) => {
    setLoadingPkgs(true);
    try {
      const data = await listExportPackages(assetId ?? undefined);
      setPackages(data);
    } catch {}
    setLoadingPkgs(false);
  }, []);

  useEffect(() => {
    loadAssets();
    loadPackages(preloadedAssetId ?? undefined);
  }, [loadAssets, loadPackages, preloadedAssetId]);

  function handleAssetChange(id: string) {
    setSelectedAssetId(id);
    setSelectedPkgId(null);
    loadPackages(id);
  }

  function handlePackageCreated(pkg: AssetExportPackage) {
    setPackages((prev) => [pkg, ...prev]);
    setSelectedPkgId(pkg.id);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-800 bg-gray-900/80 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-100">Export Manager</h1>
            <p className="text-xs text-gray-500">Build production-ready asset packages</p>
          </div>
        </div>

        <div className="ml-auto">
          <div className="text-[10px] font-mono px-2.5 py-1 rounded border border-violet-500/20 bg-violet-500/5 text-violet-400/80">
            Phase 25 — Export V2
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="shrink-0 px-6 py-2 bg-gray-900/40 border-b border-gray-800/60">
        <p className="text-[11px] text-gray-500">
          Export V2 packages are designed for future production workflows and game-engine compatibility.
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Builder */}
        <div className="w-80 shrink-0 border-r border-gray-800 bg-gray-900/40 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Asset</div>
            {assets.length === 0 ? (
              <div className="text-xs text-gray-500">No assets registered. Generate a real 3D asset first.</div>
            ) : (
              <select
                value={selectedAssetId ?? ""}
                onChange={(e) => handleAssetChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-violet-500"
              >
                <option value="" disabled>Select an asset…</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (v{a.version})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedAsset ? (
              <ExportPackageBuilder
                asset={selectedAsset}
                onPackageCreated={handlePackageCreated}
              />
            ) : (
              <div className="p-4 text-xs text-gray-500 text-center pt-8">
                Select an asset above to configure an export package.
              </div>
            )}
          </div>
        </div>

        {/* Right — History + Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* History */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Package History
                {packages.length > 0 && (
                  <span className="ml-2 text-gray-600">({packages.length})</span>
                )}
              </div>
              <button
                onClick={() => loadPackages(selectedAssetId ?? undefined)}
                className="text-xs px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700/50 text-gray-400 transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ExportHistoryPanel
                packages={packages}
                selectedId={selectedPkgId}
                onSelect={setSelectedPkgId}
                loading={loadingPkgs}
              />
            </div>
          </div>

          {/* Inspector */}
          {selectedPkg && (
            <div className="w-72 shrink-0 border-l border-gray-800 bg-gray-900/60 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Package Inspector</div>
                <button
                  onClick={() => setSelectedPkgId(null)}
                  className="text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ExportInspector pkg={selectedPkg} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
