'use client';

import { useEffect, useState } from 'react';

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'PERMISSION_CHANGE'];

const ACTION_STYLE: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  PERMISSION_CHANGE: 'bg-purple-100 text-purple-800',
};

interface LogRow {
  id: string;
  action: string;
  eventId: string | null;
  userId: number;
  ipAddress: string | null;
  details: any;
  timestamp: string;
  event: { title: string; sourceModule: string } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, offset: 0, limit: 20, hasMore: false });
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(offset: number) {
    setLoading(true);
    const params = new URLSearchParams({ limit: '20', offset: String(offset) });
    if (action) params.set('action', action);
    const res = await fetch(`/api/audit-log?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      setLogs(data.logs);
      setMeta(data.meta);
    } else {
      setError(data.message || 'Unable to load audit logs');
    }
    setLoading(false);
  }

  useEffect(() => { load(0); }, [action]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error} — this page is restricted to System Admins.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">Every submit/save action across the Global Calendar. {meta.total} record(s).</p>
        </div>
        <select
          value={action}
          onChange={e => setAction(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">User ID</th>
              <th className="px-5 py-3">Event</th>
              <th className="px-5 py-3">IP</th>
              <th className="px-5 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Loading logs...</td></tr>
            )}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No log entries found.</td></tr>
            )}
            {!loading && logs.map(l => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-5 py-3 text-slate-600">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ACTION_STYLE[l.action] || 'bg-slate-100 text-slate-700'}`}>{l.action}</span>
                </td>
                <td className="px-5 py-3 text-slate-600">#{l.userId}</td>
                <td className="px-5 py-3 text-slate-700">
                  {l.event ? `${l.event.title} (${l.event.sourceModule})` : '—'}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{l.ipAddress || '—'}</td>
                <td className="max-w-[320px] truncate px-5 py-3 font-mono text-xs text-slate-500" title={JSON.stringify(l.details)}>
                  {JSON.stringify(l.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
          <button
            disabled={meta.offset === 0}
            onClick={() => load(Math.max(0, meta.offset - meta.limit))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">Showing {meta.offset + 1}–{meta.offset + logs.length} of {meta.total}</span>
          <button
            disabled={!meta.hasMore}
            onClick={() => load(meta.offset + meta.limit)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
