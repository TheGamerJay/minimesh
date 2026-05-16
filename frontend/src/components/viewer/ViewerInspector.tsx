import { Job } from "../../lib/jobs";
import { MODE_LABELS } from "../../lib/generation";

type MaterialMode = "solid" | "wireframe" | "toon";

interface ViewerInspectorProps {
  job: Job | null;
  materialMode: MaterialMode;
  glbLoaded?: boolean;
}

function InspectorRow({ label, value, dim, accent }: { label: string; value: string; dim?: boolean; accent?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">{label}</span>
      <span className={["text-[11px] font-mono", accent ?? (dim ? "text-slate-600" : "text-slate-300")].join(" ")}>
        {value}
      </span>
    </div>
  );
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[9px] font-mono text-slate-600 uppercase tracking-widest border-b border-white/5 pb-1.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-slate-700">{label}</span>
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800 text-slate-700">
        future phase
      </span>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  queued: "text-yellow-500",
  processing: "text-cyan-500",
  completed: "text-emerald-500",
  failed: "text-red-500",
};

export default function ViewerInspector({ job, materialMode, glbLoaded }: ViewerInspectorProps) {
  const isReal = job?.provider === "meshy";
  const hasGlb = !!job?.glb_path || glbLoaded;

  return (
    <div className="w-[268px] shrink-0 border-l border-white/5 bg-black/30 overflow-y-auto flex flex-col gap-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Inspector</h2>
      </div>

      {/* Job Info */}
      <InspectorSection title="Current Job">
        {job ? (
          <>
            <InspectorRow label="Job ID" value={job.id.slice(0, 8) + "…"} />
            <InspectorRow
              label="Provider"
              value={job.provider}
              accent={isReal ? "text-emerald-400" : "text-yellow-500/80"}
            />
            {job.external_job_id && (
              <InspectorRow
                label="Provider Task ID"
                value={job.external_job_id.slice(0, 12) + "…"}
                accent="text-cyan-500/70"
              />
            )}
            <InspectorRow
              label="Output Mode"
              value={MODE_LABELS[job.mode] ?? job.mode}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Status</span>
              <div className="flex items-center gap-2">
                <span className={["text-[11px] font-mono capitalize", STATUS_COLORS[job.status] ?? "text-slate-400"].join(" ")}>
                  {job.status}
                </span>
                {job.status === "processing" && typeof job.progress === "number" && job.progress > 0 && (
                  <span className="text-[10px] font-mono text-cyan-500/70">{job.progress}%</span>
                )}
              </div>
            </div>
            <InspectorRow label="Images Used" value={String(job.image_count)} />
            <InspectorRow label="Style" value={job.style_direction} />
            <InspectorRow label="Rig Intent" value={job.rig_intent} />
            <InspectorRow label="Quality" value={job.target_quality} />
          </>
        ) : (
          <InspectorRow label="Job" value="No job loaded" dim />
        )}
      </InspectorSection>

      {/* Preview Info */}
      <InspectorSection title="Preview">
        {hasGlb ? (
          <>
            <InspectorRow label="Mesh Source" value="Real GLB (Meshy)" accent="text-emerald-400" />
            <InspectorRow label="Format" value="GLB / glTF 2.0" />
            <InspectorRow label="Material Mode" value={materialMode.charAt(0).toUpperCase() + materialMode.slice(1)} />
            <div className="px-2 py-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 mt-1">
              <p className="text-[9px] font-mono text-emerald-600 leading-relaxed">
                Real AI-generated 3D model loaded
              </p>
            </div>
          </>
        ) : (
          <>
            <InspectorRow label="Mesh Source" value="Placeholder (geometric)" />
            <InspectorRow label="Polygon Count" value="~1 400 tris" />
            <InspectorRow label="Material Mode" value={materialMode.charAt(0).toUpperCase() + materialMode.slice(1)} />
            <InspectorRow label="Generation Mode" value={job ? (MODE_LABELS[job.mode] ?? job.mode) : "—"} dim={!job} />
            <div className="px-2 py-2 rounded-lg border border-yellow-500/15 bg-yellow-500/5 mt-1">
              <p className="text-[9px] font-mono text-yellow-600 leading-relaxed">
                {isReal && job?.status !== "completed"
                  ? "Real model generating — placeholder shown during processing"
                  : "Placeholder preview mesh · Not AI generated"}
              </p>
            </div>
          </>
        )}
      </InspectorSection>

      {/* Provider Output */}
      {isReal && (
        <InspectorSection title="Provider Output">
          <InspectorRow
            label="Model Downloaded"
            value={job?.model_downloaded ? "Yes" : "Pending"}
            accent={job?.model_downloaded ? "text-emerald-400" : "text-slate-500"}
          />
          {job?.preview_url && (
            <InspectorRow label="Thumbnail" value="Available" accent="text-cyan-500/70" />
          )}
          {job?.error && (
            <div className="px-2 py-2 rounded-lg border border-red-500/20 bg-red-500/5">
              <p className="text-[9px] font-mono text-red-500 leading-relaxed break-words">{job.error}</p>
            </div>
          )}
        </InspectorSection>
      )}

      {/* Rig Status */}
      <InspectorSection title="Rigging">
        <ComingSoon label="Rig Status" />
        <ComingSoon label="Bone Count" />
        <ComingSoon label="Weight Painting" />
      </InspectorSection>

      {/* Animation */}
      <InspectorSection title="Animation">
        <ComingSoon label="Animation Clips" />
        <ComingSoon label="Motion Retargeting" />
        <ComingSoon label="Timeline" />
      </InspectorSection>

      {/* Textures */}
      <InspectorSection title="Texture Slots">
        <ComingSoon label="Diffuse" />
        <ComingSoon label="Normal Map" />
        <ComingSoon label="Roughness / Metallic" />
        <ComingSoon label="Emissive" />
      </InspectorSection>

      {/* Loaders */}
      <InspectorSection title="Loaders">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-500">GLB / GLTF</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
            Phase 14
          </span>
        </div>
        <ComingSoon label="OBJ + MTL" />
        <ComingSoon label="FBX" />
      </InspectorSection>
    </div>
  );
}
