'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, LogOut } from 'lucide-react';

interface SessionUser { id: number; email: string; name: string; isAdmin: boolean }

export function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => { if (d.success) setUser(d.user); });
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search events, modules, or users..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-12 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">⌘K</kbd>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
        </button>
        <div className="h-6 w-px bg-slate-200"></div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.isAdmin ? 'System Admin' : user.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button onClick={logout} title="Sign out" className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
