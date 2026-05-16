import { GeneratedAsset, AssetVersion } from "../../lib/assets";

interface Props {
  asset: GeneratedAsset;
}

export default function AssetVersionPanel({ asset }: Props) {
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
        {allVersions.map((v) => (
          <div
            key={v.version}
            className={`p-3 rounded-lg border text-sm ${
              v.isCurrent
                ? "border-violet-600/50 bg-violet-900/20"
                : "border-gray-700/50 bg-gray-800/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-200">
                v{v.version}
                {v.isCurrent && (
                  <span className="ml-2 text-xs text-violet-400">(current)</span>
                )}
              </span>
              <span className="text-xs text-gray-500 capitalize">{v.provider}</span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(v.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
