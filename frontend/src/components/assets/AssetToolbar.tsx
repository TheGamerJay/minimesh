interface Props {
  filterType: string;
  setFilterType: (v: string) => void;
  filterProvider: string;
  setFilterProvider: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  total: number;
  filtered: number;
}

const TYPES = ["all", "glb", "gltf", "obj", "fbx"];
const PROVIDERS = ["all", "meshy", "mock"];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name A–Z" },
  { value: "size", label: "Largest" },
];

export default function AssetToolbar({
  filterType, setFilterType,
  filterProvider, setFilterProvider,
  sortBy, setSortBy,
  search, setSearch,
  total, filtered,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-700/50 bg-gray-900/60">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets..."
          className="w-full pl-8 pr-3 py-1.5 bg-gray-800/60 border border-gray-700/50 rounded text-sm text-gray-300 outline-none focus:border-violet-500 placeholder-gray-600"
        />
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filterType === t
                ? "bg-violet-600 text-white"
                : "bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-gray-700/50"
            }`}
          >
            {t === "all" ? "All Types" : t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Provider filter */}
      <div className="flex items-center gap-1">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            onClick={() => setFilterProvider(p)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filterProvider === p
                ? "bg-violet-600 text-white"
                : "bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-gray-700/50"
            }`}
          >
            {p === "all" ? "All Providers" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="bg-gray-800/60 border border-gray-700/50 rounded px-2 py-1.5 text-xs text-gray-300 outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Count */}
      <div className="ml-auto text-xs text-gray-500">
        {filtered === total ? `${total} assets` : `${filtered} / ${total}`}
      </div>
    </div>
  );
}
