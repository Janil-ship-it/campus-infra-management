'use client';

import { useEffect, useState } from 'react';
import { Plus, Copy, Trash2, Key, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceKey {
  id: string;
  name: string;
  moduleName: string;
  keyPrefix: string;
  permissions: any;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

const MODULES = ['IWD', 'FINANCE', 'RND', 'HMS', 'ROOM_INFO', 'ADMIN'];

export default function ServiceKeysPage() {
  const [keys, setKeys] = useState<ServiceKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [moduleName, setModuleName] = useState('IWD');
  const [canCreate, setCanCreate] = useState(true);
  const [canRead, setCanRead] = useState(true);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);

  async function loadKeys() {
    const res = await fetch('/api/admin/service-keys');
    const data = await res.json();
    if (data.success) {
      setKeys(data.keys);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/service-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        moduleName,
        permissions: {
          canCreate,
          canRead,
          canUpdate,
          canDelete,
          allowedModules: allowedModules.length > 0 ? allowedModules : [moduleName],
        },
      }),
    });
    const data = await res.json();
    if (data.success) {
      setNewKey(data.key);
      toast.success('Service key created');
      loadKeys();
    } else {
      toast.error(data.message || 'Failed to create key');
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Are you sure you want to revoke this key? It will stop working immediately.')) return;
    const res = await fetch(`/api/admin/service-keys/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Key revoked');
      loadKeys();
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Service API Keys</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage API keys for module-to-module integration
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Generate New Key
        </button>
      </div>

      {newKey && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">Save this key now!</h3>
              <p className="mt-1 text-sm text-amber-800">
                This is the only time you'll see the full key. Store it securely.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-white px-4 py-2 font-mono text-sm text-slate-900 ring-1 ring-amber-200">
                  {newKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  className="rounded-lg bg-white p-2 text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setNewKey(null)}
                className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-900"
              >
                I've saved it, dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Active Service Keys</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {keys.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <Key className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm">No service keys yet</p>
            </div>
          ) : (
            keys.map((key) => (
              <div key={key.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{key.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {key.moduleName}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-500">{key.keyPrefix}...</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                      <span>
                        Last used:{' '}
                        {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {key.permissions.canCreate && (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Create
                        </span>
                      )}
                      {key.permissions.canRead && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Read
                        </span>
                      )}
                      {key.permissions.canUpdate && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Update
                        </span>
                      )}
                      {key.permissions.canDelete && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Delete
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">Generate Service Key</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Key Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Room Info Module API"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Module</label>
                <select
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {MODULES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Permissions</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={canCreate}
                      onChange={(e) => setCanCreate(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">Can create events</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={canRead}
                      onChange={(e) => setCanRead(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">Can read events</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={canUpdate}
                      onChange={(e) => setCanUpdate(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">Can update events</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={canDelete}
                      onChange={(e) => setCanDelete(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">Can delete events</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Allowed Modules (leave empty for own module only)
                </label>
                <div className="flex flex-wrap gap-2">
                  {MODULES.map((m) => (
                    <label key={m} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allowedModules.includes(m)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAllowedModules([...allowedModules, m]);
                          } else {
                            setAllowedModules(allowedModules.filter((x) => x !== m));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
