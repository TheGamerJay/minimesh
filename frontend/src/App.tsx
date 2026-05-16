import { useState, useEffect, useCallback } from "react";
import AnimationPreview from "./pages/AnimationPreview";
import CreditDashboard from "./pages/CreditDashboard";
import GeneratedAssets from "./pages/GeneratedAssets";
import TextureStudio from "./pages/TextureStudio";
import MaterialStudio from "./pages/MaterialStudio";
import ProjectManager from "./pages/ProjectManager";
import ProviderSettings from "./pages/ProviderSettings";
import QualityDashboard from "./pages/QualityDashboard";
import RigStudio from "./pages/RigStudio";
import SculptTypeSelector from "./pages/SculptTypeSelector";
import UploadStudio from "./pages/UploadStudio";
import Viewer3D from "./pages/Viewer3D";
import { Job } from "./lib/jobs";
import { RigJob } from "./lib/rigs";
import { ProjectSummary, listProjects } from "./lib/library";
import { CreditContext } from "./lib/creditContext";
import { getWallet } from "./lib/credits";
import { ActiveProvider, getActiveProvider } from "./lib/providers";
import CreditBalance from "./components/credits/CreditBalance";

type Page =
  | "home"
  | "upload"
  | "sculpt"
  | "viewer3d"
  | "rig_studio"
  | "animation_preview"
  | "material_studio"
  | "quality_check"
  | "project_library"
  | "credit_dashboard"
  | "provider_settings"
  | "generated_assets"
  | "texture_studio";

const PIPELINE_STEPS: {
  id: number;
  label: string;
  icon: string;
  description: string;
  page?: Page;
}[] = [
  {
    id: 1,
    label: "Upload References",
    icon: "⬆",
    description: "Drop reference images for your character or asset.",
    page: "upload",
  },
  {
    id: 2,
    label: "Choose Sculpt Type",
    icon: "◈",
    description: "Select realistic, stylized, clay, toy, anime, or game-ready.",
    page: "sculpt",
  },
  {
    id: 3,
    label: "3D Preview",
    icon: "⬡",
    description: "View your generated asset in the browser 3D viewport.",
    page: "viewer3d",
  },
  {
    id: 4,
    label: "Material Studio",
    icon: "◉",
    description: "Preview shader styles, emissive effects, and future PBR materials.",
    page: "material_studio" as Page,
  },
  {
    id: 5,
    label: "Rig Studio",
    icon: "⚙",
    description: "Auto-rig with bones, controls, and weight painting.",
    page: "rig_studio",
  },
  {
    id: 6,
    label: "Animate Preview",
    icon: "▶",
    description: "Preview animations with retarget-ready motion data.",
    page: "animation_preview",
  },
  {
    id: 7,
    label: "Export Asset",
    icon: "⬇",
    description: "Create ZIP export packages and prepare future GLB/FBX/OBJ pipelines.",
    page: "viewer3d" as Page,
  },
  {
    id: 8,
    label: "Quality Check",
    icon: "◈",
    description: "Audit your pipeline, score readiness, and get repair suggestions.",
    page: "quality_check" as Page,
  },
  {
    id: 9,
    label: "Project Library",
    icon: "⊞",
    description: "Manage multiple MiniMesh projects and saved pipelines.",
    page: "project_library" as Page,
  },
  {
    id: 10,
    label: "Credits & Usage",
    icon: "◎",
    description: "Track usage costs, manage your credit wallet, and view transaction history.",
    page: "credit_dashboard" as Page,
  },
  {
    id: 11,
    label: "Provider Settings",
    icon: "⬡",
    description: "Manage AI providers, fallback rules, API keys, and generation health.",
    page: "provider_settings" as Page,
  },
  {
    id: 12,
    label: "Generated Assets",
    icon: "◈",
    description: "Browse, tag, rename, duplicate, and download all registered 3D outputs.",
    page: "generated_assets" as Page,
  },
  {
    id: 13,
    label: "Texture Studio",
    icon: "◑",
    description: "Manage texture maps, PBR channels, and future baking workflows.",
    page: "texture_studio" as Page,
  },
];

function PipelineCard({
  step,
  index,
  onNavigate,
}: {
  step: (typeof PIPELINE_STEPS)[0];
  index: number;
  onNavigate: (page: Page) => void;
}) {
  const active = !!step.page;

  return (
    <div
      className={[
        "glass rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 group",
        active ? "cursor-pointer glass-hover" : "cursor-default opacity-70",
      ].join(" ")}
      onClick={() => step.page && onNavigate(step.page)}
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            "text-2xl transition-colors",
            active
              ? "text-cyan-400 group-hover:text-cyan-300"
              : "text-slate-600",
          ].join(" ")}
        >
          {step.icon}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-violet-400 opacity-60">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="text-sm font-semibold text-slate-100">{step.label}</h3>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>

      <button
        disabled={!active}
        onClick={(e) => {
          e.stopPropagation();
          step.page && onNavigate(step.page);
        }}
        className={[
          "mt-auto text-xs px-3 py-1.5 rounded-lg border transition-all duration-150",
          active
            ? "border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/5"
            : "border-slate-800 text-slate-600 cursor-not-allowed select-none",
        ].join(" ")}
      >
        {active ? "Open" : "Coming Soon"}
      </button>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [viewerJob, setViewerJob] = useState<Job | null>(null);
  const [rigSourceJob, setRigSourceJob] = useState<Job | null>(null);
  const [animSourceRigJob, setAnimSourceRigJob] = useState<RigJob | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [activeProvider, setActiveProvider] = useState<ActiveProvider | null>(null);

  const refreshCredits = useCallback(() => {
    getWallet()
      .then((w) => setCreditBalance(w.balance))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCredits();
    getActiveProvider()
      .then(setActiveProvider)
      .catch(() => {});
  }, [refreshCredits]);

  useEffect(() => {
    listProjects()
      .then((ps) => setActiveProject(ps.find((p) => p.is_active) ?? null))
      .catch(() => {});
  }, [page]);

  function handleOpenViewer(job: Job) {
    setViewerJob(job);
    setPage("viewer3d");
  }

  function handleOpenRigStudio(job: Job) {
    setRigSourceJob(job);
    setPage("rig_studio");
  }

  function handleOpenAnimationPreview(rigJob: RigJob) {
    setAnimSourceRigJob(rigJob);
    setPage("animation_preview");
  }

  const creditContextValue = { balance: creditBalance, refresh: refreshCredits };

  if (page === "upload") {
    return (
      <CreditContext.Provider value={creditContextValue}>
        <UploadStudio onBack={() => setPage("home")} />
      </CreditContext.Provider>
    );
  }

  if (page === "sculpt") {
    return (
      <CreditContext.Provider value={creditContextValue}>
        <SculptTypeSelector
          onBack={() => setPage("home")}
          onOpenViewer={handleOpenViewer}
        />
      </CreditContext.Provider>
    );
  }

  if (page === "viewer3d") {
    return (
      <CreditContext.Provider value={creditContextValue}>
        <Viewer3D
          job={viewerJob}
          onBack={() => setPage("sculpt")}
          onOpenRigStudio={handleOpenRigStudio}
        />
      </CreditContext.Provider>
    );
  }

  if (page === "rig_studio") {
    return (
      <CreditContext.Provider value={creditContextValue}>
        <RigStudio
          job={rigSourceJob}
          onBack={() => setPage("viewer3d")}
          onOpenAnimationPreview={handleOpenAnimationPreview}
        />
      </CreditContext.Provider>
    );
  }

  if (page === "animation_preview") {
    return (
      <CreditContext.Provider value={creditContextValue}>
        <AnimationPreview
          rigJob={animSourceRigJob}
          onBack={() => setPage("rig_studio")}
        />
      </CreditContext.Provider>
    );
  }

  if (page === "material_studio") {
    return (
      <CreditContext.Provider value={creditContextValue}>
        <MaterialStudio onBack={() => setPage("home")} />
      </CreditContext.Provider>
    );
  }

  if (page === "quality_check") {
    return <QualityDashboard onBack={() => setPage("home")} />;
  }

  if (page === "project_library") {
    return (
      <ProjectManager
        onBack={() => setPage("home")}
        onActivated={(p) => { setActiveProject(p); setPage("home"); }}
      />
    );
  }

  if (page === "credit_dashboard") {
    return (
      <CreditContext.Provider value={creditContextValue}>
        <CreditDashboard onBack={() => setPage("home")} />
      </CreditContext.Provider>
    );
  }

  if (page === "provider_settings") {
    return <ProviderSettings onBack={() => setPage("home")} />;
  }

  if (page === "generated_assets") {
    return (
      <CreditContext.Provider value={creditContextValue}>
        <GeneratedAssets onBack={() => setPage("home")} onOpenViewer={handleOpenViewer} />
      </CreditContext.Provider>
    );
  }

  if (page === "texture_studio") {
    return (
      <CreditContext.Provider value={creditContextValue}>
        <TextureStudio onBack={() => setPage("home")} job={viewerJob} />
      </CreditContext.Provider>
    );
  }

  return (
    <CreditContext.Provider value={creditContextValue}>
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
            M
          </div>
          <span className="text-lg font-bold tracking-tight">MiniMesh</span>
        </div>
        <div className="flex items-center gap-3">
          <CreditBalance onNavigate={() => setPage("credit_dashboard")} />
          {activeProject && (
            <button
              onClick={() => setPage("project_library")}
              className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-150"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-xs text-slate-300 font-mono max-w-[140px] truncate">
                {activeProject.name}
              </span>
            </button>
          )}
          {activeProvider && (
            <button
              onClick={() => setPage("provider_settings")}
              className={[
                "text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all duration-150",
                activeProvider.health_status === "healthy"
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:border-emerald-400/60"
                  : activeProvider.health_status === "degraded"
                  ? "border-amber-500/30 text-amber-400 bg-amber-500/5 hover:border-amber-400/60"
                  : activeProvider.is_real
                  ? "border-red-500/30 text-red-400 bg-red-500/5 hover:border-red-400/60"
                  : "border-amber-500/20 text-amber-500/70 bg-amber-500/5 hover:border-amber-400/40",
              ].join(" ")}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                style={{
                  backgroundColor:
                    activeProvider.health_status === "healthy" ? "#34d399" :
                    activeProvider.health_status === "degraded" ? "#f59e0b" :
                    activeProvider.is_real ? "#f87171" : "#f59e0b",
                }}
              />
              {activeProvider.is_real
                ? `${activeProvider.provider.charAt(0).toUpperCase() + activeProvider.provider.slice(1)} ${
                    activeProvider.health_status === "healthy" ? "Healthy" :
                    activeProvider.health_status === "degraded" ? "Degraded" : "Active"
                  }`
                : "Mock Provider Active"}
              {activeProvider.fallback_provider && (
                <span className="ml-1 opacity-50">→ {activeProvider.fallback_provider}</span>
              )}
            </button>
          )}
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
            Phase 18 — Texture Studio
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Studio ready
          </div>

          <h1 className="text-5xl font-black tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400">
              MiniMesh
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            AI-powered image-to-3D, sculpting, rigging, and animation pipeline
            studio.
          </p>
        </div>

        {/* Pipeline Grid */}
        <div className="mb-10">
          <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-5">
            Pipeline Steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PIPELINE_STEPS.map((step, i) => (
              <PipelineCard
                key={step.id}
                step={step}
                index={i}
                onNavigate={setPage}
              />
            ))}
          </div>
        </div>

        {/* Status bar */}
        <div className="glass rounded-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-400">
              Backend API:{" "}
              <span className="text-slate-300 font-mono">
                http://localhost:8080
              </span>
            </span>
          </div>
          <span className="text-xs text-slate-600 font-mono">v1.8.0</span>
        </div>
      </main>
    </div>
    </CreditContext.Provider>
  );
}
