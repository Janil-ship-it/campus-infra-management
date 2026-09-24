'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Lock, Mail } from 'lucide-react';

const DUMMY_ACCOUNTS = [
  { email: 'admin@iitgn.ac.in', password: 'admin@123', label: 'System Administrator' },
  { email: 'dean@iitgn.ac.in', password: 'dean@123', label: 'Dean (Delegated Admin)' },
  { email: 'se@iitgn.ac.in', password: 'se@123', label: 'Superintending Engineer (IWD)' },
  { email: 'finance@iitgn.ac.in', password: 'fin@123', label: 'Finance Officer' },
  { email: 'clerk@iitgn.ac.in', password: 'clerk@123', label: 'New Joiner (No Access)' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Campus Sanchalika</h1>
          <p className="text-sm text-slate-500">IIT Gandhinagar • Global Calendar</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@iitgn.ac.in"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Dev accounts (click to fill)</p>
          <div className="space-y-1">
            {DUMMY_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => { setEmail(a.email); setPassword(a.password); }}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-slate-600 transition hover:bg-slate-50"
              >
                <span className="font-medium">{a.label}</span>
                <span className="font-mono text-slate-400">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
