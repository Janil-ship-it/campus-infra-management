'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, LogOut } from 'lucide-react';

interface SessionUser {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
}

export function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.user);
      });
  }, []);

  useEffect(() => {
    const slash = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.getElementById('topbar-search')?.focus();
      }
    };
    document.addEventListener('keydown', slash);
    return () => document.removeEventListener('keydown', slash);
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function openCommandMenu() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <button
        onClick={openCommandMenu}
        className="relative flex w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-12 text-sm text-slate-700 transition hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <span className="text-slate-400">Search events, pages, or commands...</span>
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          ⌘K
        </kbd>
      </button>
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
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}