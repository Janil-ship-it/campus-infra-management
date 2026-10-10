'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (data.success) window.location.href = '/'
      else setError(data.message || 'Invalid credentials')
    } catch { setError('Unable to reach the server') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/iitgn-campus.jpg')" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-slate-900/80 to-blue-900/90" />

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 bg-white rounded-full p-3 flex items-center justify-center">
            <img src="/iitgn-logo.svg" alt="IITGN" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Digital Infra IITGN</h1>
          <p className="text-sm text-blue-200 mt-1">Campus Infrastructure Management</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-md p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@iitgn.ac.in"
              className="w-full px-3 py-2 border border-gray-200 rounded-md" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md" />
          </div>
          {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white font-medium py-2 rounded-md hover:bg-blue-950 disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-blue-200/80 mt-6">© 2026 Indian Institute of Technology Gandhinagar</p>
      </div>
    </div>
  )
}
