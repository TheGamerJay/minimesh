import { useState, useEffect, useCallback } from "react";
import {
  GeneratedAsset,
  listAssets,
  deleteAsset,
  duplicateAsset,
} from "../lib/assets";
import { getJob } from "../lib/jobs";
import { Job } from "../lib/jobs";
import AssetCard from "../components/assets/AssetCard";
import AssetInspector from "../components/assets/AssetInspector";
import AssetVersionPanel from "../components/assets/AssetVersionPanel";
import AssetToolbar from "../components/assets/AssetToolbar";

interface Props {
  onBack: () => void;
  onOpenViewer: (job: Job) => void;
}

type InspectorTab = "info" | "versions";

export default function GeneratedAssets({ onBack, onOpenViewer }: Props) {
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("info");
  const [filterType, setFilterType] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");
  const [openingViewer, setOpeningViewer] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listAssets();
      setAssets(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedAsset = assets.find((a) => a.id === selectedId) ?? null;

  function updateAsset(updated: GeneratedAsset) {
    setAssets((prev) => prev.map((a) => a.id === updated.id ? updated : a));
  }

  async function handleDelete(assetId: string) {
    await deleteAsset(assetId);
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    if (selectedId === assetId) setSelectedId(null);
  }

  async function handleDuplicate(assetId: string) {
    const dup = await duplicateAsset(assetId);
    setAssets((prev) => [dup, ...prev]);
    setSelectedId(dup.id);
  }

  async function handleOpenViewer(asset: GeneratedAsset) {
    setOpeningViewer(asset.id);
    try {
      const job = await getJob(asset.source_job_id);
      onOpenViewer(job);
    } catch {
      alert("Could not load the source job for this asset.");
    }
    setOpeningViewer(null);
  }

  // Filter + sort
  let filtered = assets.filter((a) => {
    if (filterType !== "all" && a.asset_type !== filterType) return false;
    if (filterProvider !== "all" && a.provider !== filterProvider) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "size") return b.file_size - a.file_size;
    return 0;
  });

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-800 bg-gray-900/80">
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
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-100">Generated Assets</h1>
            <p className="text-xs text-gray-500">All registered 3D outputs from completed jobs</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={load}
            className="text-xs px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700/50 text-gray-300 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <AssetToolbar
        filterType={filterType} setFilterType={setFilterType}
        filterProvider={filterProvider} setFilterProvider={setFilterProvider}
        sortBy={sortBy} setSortBy={setSortBy}
        search={search} setSearch={setSearch}
        total={assets.length} filtered={filtered.length}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-sm">Loading assets…</div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasAssets={assets.length > 0} />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filtered.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  selected={selectedId === asset.id}
                  onSelect={() => setSelectedId(asset.id === selectedId ? null : asset.id)}
                  onDelete={() => handleDelete(asset.id)}
                  onDuplicate={() => handleDuplicate(asset.id)}
                  onOpenViewer={() => handleOpenViewer(asset)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Inspector panel */}
        {selectedAsset && (
          <div className="w-72 border-l border-gray-800 bg-gray-900/60 flex flex-col overflow-hidden shrink-0">
            {/* Inspector header */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inspector</div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-gray-600 hover:text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview image */}
            {selectedAsset.preview_image && (
              <div className="h-40 bg-gray-950 overflow-hidden">
                <img src={selectedAsset.preview_image} alt={selectedAsset.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              {(["info", "versions"] as InspectorTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setInspectorTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    inspectorTab === tab
                      ? "text-violet-400 border-b border-violet-500"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab === "info" ? "Info & Tags" : "Versions"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {inspectorTab === "info" ? (
                <AssetInspector asset={selectedAsset} onChange={updateAsset} />
              ) : (
                <AssetVersionPanel asset={selectedAsset} />
              )}
            </div>

            {/* Inspector actions */}
            <div className="p-4 border-t border-gray-800 space-y-2">
              <button
                onClick={() => handleOpenViewer(selectedAsset)}
                disabled={openingViewer === selectedAsset.id}
                className="w-full py-2 rounded bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {openingViewer === selectedAsset.id ? "Opening…" : "Open in Viewer"}
              </button>
              {selectedAsset.provider !== "mock" && (
                <a
                  href={`/export-packages/jobs/${selectedAsset.source_job_id}/model.${selectedAsset.asset_type}`}
                  download
                  className="block w-full py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium text-center transition-colors"
                >
                  Download {selectedAsset.asset_type.toUpperCase()}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasAssets }: { hasAssets: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      </div>
      {hasAssets ? (
        <>
          <div className="text-gray-400 font-medium mb-1">No assets match your filters</div>
          <div className="text-gray-600 text-sm">Try changing the type, provider, or search term</div>
        </>
      ) : (
        <>
          <div className="text-gray-400 font-medium mb-1">No assets registered yet</div>
          <div className="text-gray-600 text-sm max-w-xs">
            Real 3D outputs from Meshy are automatically registered here when a job completes.
            Mock jobs generate placeholder results only.
          </div>
        </>
      )}
    </div>
  );
}
