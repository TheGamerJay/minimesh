import { useState } from "react";
import { TEMPLATES } from "../../lib/library";

export default function CreateProjectModal({
  onConfirm,
  onCancel,
  creating,
}: {
  onConfirm: (name: string, template: string) => void;
  onCancel: () => void;
  creating: boolean;
}) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("blank");

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md flex flex-col gap-5 border border-white/10">
        <div>
          <h2 className="text-lg font-bold text-slate-100">New Project</h2>
          <p className="text-xs text-slate-500 mt-0.5">Create a new MiniMesh project.</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Project Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) onConfirm(name, template);
                if (e.key === "Escape") onCancel();
              }}
              placeholder="My Character Project"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={[
                    "px-3 py-2 rounded-lg border text-sm transition-all duration-150 text-left",
                    template === t.id
                      ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/5"
                      : "border-white/8 text-slate-400 hover:border-white/20 hover:text-slate-300",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 text-sm hover:border-white/20 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onConfirm(name, template)}
            disabled={!name.trim() || creating}
            className={[
              "flex-1 py-2 rounded-lg border text-sm font-semibold transition-all duration-150",
              name.trim() && !creating
                ? "border-cyan-500/40 text-cyan-400 hover:border-cyan-400/70 hover:bg-cyan-500/5"
                : "border-slate-800 text-slate-600 cursor-not-allowed",
            ].join(" ")}
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
