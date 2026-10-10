'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, LogOut, Calendar, Check, X } from 'lucide-react';

interface SessionUser {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface Notification {
  eventId: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
  sourceModule: string;
  role: string;
}

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (pathname === '/login') return;
    
    fetch('/api/auth/session').then(async (r) => {
      const d = await r.json().catch(() => null);
      if (r.ok && d && d.success) {
        setUser(d.user);
      } else if (pathname !== '/login') {
        window.location.replace('/login');
      }
    });
  }, [pathname]);

  useEffect(() => {
    if (!user || pathname === '/login') return;
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNotifications(d.notifications);
      });
  }, [user, pathname]);

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

  async function handleRSVP(eventId: string, status: 'ACCEPTED' | 'DECLINED') {
    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      setNotifications((prev) => prev.filter((n) => n.eventId !== eventId));
    }
  }

  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-8 backdrop-blur-md">
      <button
        onClick={openCommandMenu}
        className="group relative flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-14 text-sm text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-slate-600" />
        <span className="truncate text-left">Search events, pages, or commands...</span>
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-sm">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-12 z-50 w-96 rounded-xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-bold text-slate-900">Pending Invitations</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">No pending invitations</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((n) => (
                        <div key={n.eventId} className="p-4">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <p className="text-sm font-semibold text-slate-900">{n.eventTitle}</p>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {new Date(n.startTime).toLocaleString()} • {n.sourceModule}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRSVP(n.eventId, 'ACCEPTED')}
                              className="flex-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <Check className="mr-1 inline h-3 w-3" /> Accept
                            </button>
                            <button
                              onClick={() => handleRSVP(n.eventId, 'DECLINED')}
                              className="flex-1 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                            >
                              <X className="mr-1 inline h-3 w-3" /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200"></div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.isAdmin ? 'System Admin' : user.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
