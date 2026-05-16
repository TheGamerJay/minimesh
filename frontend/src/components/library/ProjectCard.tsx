import { useState } from "react";
import { ProjectSummary } from "../../lib/library";

const MODE_LABEL: Record<string, string> = {
  three_d_model: "3D Model",
  two_d_anime_sheet: "2D Anime",
  clay_sculpt: "Clay Sculpt",
  toy_figurine: "Toy/Figurine",
  game_ready_character: "Game Ready",
  cinematic_high_poly: "Cinematic",
  low_poly_mobile: "Low Poly",
  prop_only: "Prop",
};

const SCORE_COLOR = (score: number) =>
  score >= 90 ? "text-emerald-400" : score >= 65 ? "text-amber-400" : "text-red-400";

export default function ProjectCard({
  project,
  onOpen,
  onActivate,
  onDuplicate,
  onDelete,
}: {
  project: ProjectSummary;
  onOpen: () => void;
  onActivate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={[
        "glass rounded-xl overflow-hidden flex flex-col transition-all duration-200 group",
        project.is_active ? "ring-1 ring-cyan-500/40" : "",
      ].join(" ")}
    >
      {/* Thumbnail */}
      <div
        className="relative h-36 bg-[#111118] flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={onOpen}
      >
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-700">
            <span className="text-3xl">◈</span>
            <span className="text-xs font-mono">No thumbnail</span>
          </div>
        )}
        {project.is_active && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-semibold">
            Active
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="w-7 h-7 rounded-lg bg-black/60 border border-white/10 text-slate-400 hover:text-slate-200 flex items-center justify-center text-sm"
          >
            ⋯
          </button>
          {menuOpen && (
            <div
              className="absolute top-8 right-0 w-40 glass rounded-lg border border-white/10 overflow-hidden shadow-xl z-10"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {!project.is_active && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onActivate(); }}
                  className="w-full px-3 py-2 text-xs text-left text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                  Set as Active
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate(); }}
                className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:bg-white/5 transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                className="w-full px-3 py-2 text-xs text-left text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-100 leading-snug line-clamp-1">
            {project.name}
          </p>
          <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${SCORE_COLOR(project.score)}`}>
            {project.score}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
            {MODE_LABEL[project.mode] ?? project.mode}
          </span>
          <span className="text-xs text-slate-600">
            {new Date(project.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={onOpen}
          className="flex-1 text-xs py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/5 transition-all duration-150"
        >
          Open
        </button>
        {!project.is_active && (
          <button
            onClick={onActivate}
            className="flex-1 text-xs py-1.5 rounded-lg border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300 transition-all duration-150"
          >
            Activate
          </button>
        )}
      </div>
    </div>
  );
}
