'use client';

import { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';

const MODULES = ['IWD', 'FINANCE', 'RND', 'HMS', 'ROOM_INFO', 'ADMIN', 'GLOBAL'];

interface UserRow {
  id: number;
  email: string;
  name: string;
  positionTitle: string;
  isSystemAdmin: boolean;
  permissions: { moduleName: string; canView: boolean; canEdit: boolean }[];
}

function Toggle({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-blue-600' : 'bg-slate-300'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.success) {
      setUsers(data.users);
      if (selectedId === null && data.users.length > 0) setSelectedId(data.users[0].id);
    } else {
      setError(data.message || 'Unable to load users');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const selected = users.find(u => u.id === selectedId) || null;
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  async function setPermission(moduleName: string, canView: boolean, canEdit: boolean) {
    if (!selected) return;
    const res = await fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected.id, moduleName, canView, canEdit }),
    });
    const data = await res.json();
    if (data.success) load();
    else alert(data.message || 'Failed to update permission');
  }

  function permFor(moduleName: string) {
    return selected?.permissions.find(p => p.moduleName === moduleName);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error} — this page is restricted to System Admins.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">Search a user, then toggle View / Edit access per module. Changes are audit-logged.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto p-2">
            {loading && <p className="p-3 text-sm text-slate-500">Loading users...</p>}
            {filtered.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedId(u.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${selectedId === u.id ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.positionTitle}</p>
                </div>
                {u.isSystemAdmin && <ShieldCheck className="h-4 w-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{selected.name}</p>
                  <p className="text-sm text-slate-500">{selected.email} • {selected.positionTitle}</p>
                </div>
                {selected.isSystemAdmin && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">System Admin — full access</span>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {MODULES.map(m => {
                  const p = permFor(m);
                  const canView = selected.isSystemAdmin ? true : (p?.canView ?? false);
                  const canEdit = selected.isSystemAdmin ? true : (p?.canEdit ?? false);
                  return (
                    <div key={m} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm font-medium text-slate-700">{m}</span>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                          View
                          <Toggle
                            on={canView}
                            disabled={selected.isSystemAdmin}
                            onChange={() => setPermission(m, !canView, !canView ? false : canEdit)}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                          Edit
                          <Toggle
                            on={canEdit}
                            disabled={selected.isSystemAdmin || !canView}
                            onChange={() => setPermission(m, true, !canEdit)}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="p-8 text-sm text-slate-500">Select a user to manage module access.</p>
          )}
        </div>
      </div>
    </div>
  );
}
