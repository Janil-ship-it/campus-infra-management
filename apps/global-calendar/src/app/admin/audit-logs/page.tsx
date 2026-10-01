'use client'

import { useEffect, useState } from 'react'
import { ScrollText, Search } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  CANCEL: 'bg-red-100 text-red-800',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    fetch('/api/audit-log?limit=500')
      .then(r => r.json())
      .then(d => {
        const list = d?.data ?? d?.logs ?? d?.auditLogs ?? []
        setLogs(Array.isArray(list) ? list : [])
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l => {
    const action = l.action || ''
    if (actionFilter && action !== actionFilter) return false
    const title = l.details?.title || l.details?.sourceModule || ''
    const q = search.toLowerCase()
    if (q && !(`${title} ${l.userId} ${l.ipAddress || ''}`.toLowerCase().includes(q))) return false
    if (from && new Date(l.createdAt) < new Date(from)) return false
    if (to && new Date(l.createdAt) > new Date(to + 'T23:59:59')) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ScrollText className="h-8 w-8 text-blue-600" />
            Audit Trail
          </h1>
          <p className="text-gray-600 mt-1">Every create / update / delete action, with actor and IP — full accountability</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search title / user / IP..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="From date" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="To date" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor (User ID)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading audit trail...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No audit entries match your filters.</td></tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[l.action] || 'bg-gray-100 text-gray-700'}`}>{l.action}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">{l.details?.title || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">#{l.userId}</td>
                    <td className="px-6 py-3 text-sm text-gray-500 font-mono text-xs">{l.ipAddress || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
