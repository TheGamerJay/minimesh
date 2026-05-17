import { AssetExportPackage } from "../../lib/exportV2";
import ExportPackageCard from "./ExportPackageCard";

interface Props {
  packages: AssetExportPackage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export default function ExportHistoryPanel({ packages, selectedId, onSelect, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        Loading packages…
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div className="text-gray-400 text-sm font-medium">No packages built yet</div>
        <div className="text-gray-600 text-xs mt-1">Build your first export package to get started</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {packages.map((pkg) => (
        <ExportPackageCard
          key={pkg.id}
          pkg={pkg}
          selected={selectedId === pkg.id}
          onSelect={() => onSelect(pkg.id)}
        />
      ))}
    </div>
  );
}
