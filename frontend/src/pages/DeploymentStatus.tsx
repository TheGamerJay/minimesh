import { useState, useEffect } from "react";
import DeploymentHealthCard from "../components/deployment/DeploymentHealthCard";
import EnvironmentStatusPanel from "../components/deployment/EnvironmentStatusPanel";
import StorageStatusPanel from "../components/deployment/StorageStatusPanel";
import DeploymentWarningsPanel from "../components/deployment/DeploymentWarningsPanel";

interface Checks {
  storage_writable: boolean;
  frontend_dist: boolean;
  provider_registry: boolean;
  blender_available: boolean;
  auth_storage: boolean;
}

interface EnvInfo {
  port: number;
  storage_path: string;
  storage_ephemeral: boolean;
  meshy_key_present: boolean;
  tripo_key_present: boolean;
  rodin_key_present: boolean;
  blender_path: string | null;
  app_env: string;
}

interface ReadinessReport {
  ready: boolean;
  version: string;
  checks: Checks;
  env: EnvInfo;
  warnings: string[];
}

function checkStatus(val: boolean): "ok" | "warning" | "error" {
  return val ? "ok" : "error";
}

export default function DeploymentStatus({ onBack }: { onBack: () => void }) {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/health/ready");
      if (!res.ok) throw new Error(`Health check failed (${res.status})`);
      setReport(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch deployment status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStatus(); }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm font-mono"
          >
            ← Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-lg">◉</span>
            <span className="font-semibold text-slate-100">Deployment Status</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
            Phase 29 — Auth &amp; User Ownership
          </span>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="text-sm px-4 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all disabled:opacity-40 font-mono"
          >
            {loading ? "Checking…" : "↺ Refresh"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading && !report && (
            <div className="glass rounded-xl p-10 flex items-center justify-center">
              <span className="text-slate-500 font-mono text-sm animate-pulse">
                Running deployment checks…
              </span>
            </div>
          )}

          {report && (
            <>
              {/* Overall readiness */}
              <div className={[
                "rounded-xl border px-5 py-4 flex items-center gap-4",
                report.ready
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-red-500/30 bg-red-500/5",
              ].join(" ")}>
                <span className={`text-3xl ${report.ready ? "text-emerald-400" : "text-red-400"}`}>
                  {report.ready ? "◉" : "◎"}
                </span>
                <div>
                  <p className={`font-semibold text-sm ${report.ready ? "text-emerald-400" : "text-red-400"}`}>
                    {report.ready ? "Ready for deployment" : "Not ready — resolve issues below"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    MiniMesh v{report.version} · {report.env.app_env}
                  </p>
                </div>
              </div>

              {/* Warnings */}
              <DeploymentWarningsPanel warnings={report.warnings} />

              {/* System checks */}
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  System Checks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <DeploymentHealthCard
                    label="Storage Writable"
                    status={checkStatus(report.checks.storage_writable)}
                    detail={report.checks.storage_writable ? "Storage path is writable" : "Cannot write to storage — check permissions"}
                  />
                  <DeploymentHealthCard
                    label="Frontend Build"
                    status={checkStatus(report.checks.frontend_dist)}
                    detail={report.checks.frontend_dist ? "dist/index.html found" : "Run npm run build in frontend/"}
                  />
                  <DeploymentHealthCard
                    label="Provider Registry"
                    status={checkStatus(report.checks.provider_registry)}
                    detail={report.checks.provider_registry ? "Provider registry loaded" : "Provider registry failed to load"}
                  />
                  <DeploymentHealthCard
                    label="Blender Bridge"
                    status={report.checks.blender_available ? "ok" : "warning"}
                    detail={report.checks.blender_available ? "Blender detected" : "Not found — fallback mode active"}
                  />
                  <DeploymentHealthCard
                    label="Auth Storage"
                    status={report.checks.auth_storage ? "ok" : "warning"}
                    detail={report.checks.auth_storage ? "User registry ready" : "No users yet — register to initialize"}
                  />
                </div>
              </div>

              {/* Environment */}
              <EnvironmentStatusPanel env={report.env} />

              {/* Storage */}
              <StorageStatusPanel
                storagePath={report.env.storage_path}
                storageWritable={report.checks.storage_writable}
                storageEphemeral={report.env.storage_ephemeral}
              />

              {/* Mini Forge deployment hint */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Mini Forge Deployment
                </h3>
                <div className="space-y-1">
                  {[
                    { label: "Build", value: "docker build -t minimesh ." },
                    { label: "Health", value: "/health/ready" },
                    { label: "Port", value: String(report.env.port) },
                    { label: "Config", value: "miniforge.json" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500 w-16 shrink-0">{label}</span>
                      <code className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/5 px-2 py-0.5 rounded">
                        {value}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
