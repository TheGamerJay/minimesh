import AuditLogPanel from "../components/admin/AuditLogPanel";
import ProviderUsagePanel from "../components/admin/ProviderUsagePanel";
import StorageUsagePanel from "../components/admin/StorageUsagePanel";
import SystemHealthPanel from "../components/admin/SystemHealthPanel";
import UserOverviewPanel from "../components/admin/UserOverviewPanel";

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
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
            <span className="text-violet-400 text-lg">◈</span>
            <span className="font-semibold text-slate-100">Admin Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-violet-500/30 text-violet-400 bg-violet-500/5">
            Phase 30 — Admin &amp; Safety
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-red-500/30 text-red-400 bg-red-500/5">
            ADMIN ONLY
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
          {/* Warning banner */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-center gap-3">
            <span className="text-violet-400">◈</span>
            <p className="text-xs text-violet-300/80">
              Admin view — platform-wide data. Never share this screen. Auth, billing, and moderation controls arrive in future phases.
            </p>
          </div>

          {/* Health + Storage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SystemHealthPanel />
            <StorageUsagePanel />
          </div>

          {/* Users + Providers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UserOverviewPanel />
            <ProviderUsagePanel />
          </div>

          {/* Audit log */}
          <AuditLogPanel />
        </div>
      </main>
    </div>
  );
}
