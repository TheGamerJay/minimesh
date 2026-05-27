import { useEffect, useState } from "react";
import { AdminUserSummary, getAdminUsers } from "../../lib/admin";

function UserRow({ user }: { user: AdminUserSummary }) {
  const initials = user.username.slice(0, 2).toUpperCase();
  const loginDate = user.last_login
    ? new Date(user.last_login).toLocaleDateString()
    : "Never";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-600/30 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200 truncate">{user.username}</span>
          {user.is_admin && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/20">
              ADMIN
            </span>
          )}
          {user.is_legacy && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
              LEGACY
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-slate-400 font-mono">{user.project_count}p · {user.asset_count}a</p>
        <p className="text-[9px] text-slate-600 font-mono">{loginDate}</p>
      </div>
    </div>
  );
}

export default function UserOverviewPanel() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">{error}</div>
  );

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-1">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Users</h3>
        <span className="ml-auto text-[10px] font-mono text-slate-600">{users.length} total</span>
      </div>
      {users.length === 0 && !error ? (
        <p className="text-slate-500 font-mono text-xs animate-pulse">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500 font-mono text-xs">No registered users.</p>
      ) : (
        users.map((u) => <UserRow key={u.id} user={u} />)
      )}
    </div>
  );
}
