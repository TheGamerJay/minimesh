import { GeneratedAsset, AssetVersion } from "../../lib/assets";

interface Props {
  asset: GeneratedAsset;
  onOpenVersion?: (filePath: string, versionLabel: string) => void;
}

function providerLabel(provider: string): string {
  if (provider === "blender-normalize") return "Blender Normalized";
  if (provider === "normalize-fallback") return "Normalized (copy)";
  if (provider === "mock") return "Mock";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function VersionBadge({ provider, isCurrent }: { provider: string; isCurrent?: boolean }) {
  const isNormalized = provider.includes("normalize");
  const isFallback = provider === "normalize-fallback";
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {isCurrent && (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400">
          CURRENT
        </span>
      )}
      {isNormalized && (
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
          isFallback
            ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
            : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
        }`}>
          {isFallback ? "FALLBACK" : "NORMALIZED"}
        </span>
      )}
      {!isNormalized && (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-gray-700/60 border border-gray-700/40 text-gray-500">
          ORIGINAL
        </span>
      )}
    </div>
  );
}

export default function AssetVersionPanel({ asset, onOpenVersion }: Props) {
  if (asset.versions.length === 0) {
    return (
      <div className="p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Version History</div>
        <div className="text-sm text-gray-600 italic">Only one version — no history yet.</div>
      </div>
    );
  }

  const allVersions: (AssetVersion & { isCurrent?: boolean })[] = [
    {
      version: asset.version,
      file_path: asset.file_path,
      created_at: asset.updated_at,
      provider: asset.provider,
      isCurrent: true,
    },
    ...asset.versions.slice().reverse(),
  ];

  return (
    <div className="p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Version History</div>
      <div className="space-y-2">
        {allVersions.map((v) => {
          const isNormalized = v.provider.includes("normalize");

          return (
            <div
              key={v.version}
              className={`p-3 rounded-lg border text-sm ${
                v.isCurrent
                  ? "border-violet-600/50 bg-violet-900/20"
                  : "border-gray-700/50 bg-gray-800/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-200">v{v.version}</span>
                <VersionBadge provider={v.provider} isCurrent={v.isCurrent} />
              </div>
              <div className="text-xs text-gray-500 mb-1">{providerLabel(v.provider)}</div>
              <div className="text-xs text-gray-600">
                {new Date(v.created_at).toLocaleString()}
              </div>
              {isNormalized && onOpenVersion && (
                <button
                  onClick={() => onOpenVersion(v.file_path, `v${v.version} NORMALIZED`)}
                  className="mt-2 w-full py-1 rounded bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/25 text-cyan-400 text-[11px] transition-colors"
                >
                  Open in Viewer
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
