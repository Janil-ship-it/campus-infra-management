'use client'

import { useEffect, useState } from 'react'
import { IITGN_MODULES } from '@/lib/modules'
import { Search, ShieldCheck } from 'lucide-react'

interface UserPermission {
  id: string
  userId: number
  moduleName: string
  canView: boolean
  canEdit: boolean
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/permissions').then(r => r.json()).catch(() => null),
      fetch('/api/users').then(r => r.json()).catch(() => null),
    ]).then(([permData, userData]) => {
      // Accept ANY response shape so the page can never crash
      const permList = permData?.data ?? permData?.permissions ?? []
      const userList = userData?.data ?? userData?.users ?? []
      setPermissions(Array.isArray(permList) ? permList : [])
      setUsers(Array.isArray(userList) ? userList : [])
      if (!permData && !userData) setError('Could not load permission data')
    }).finally(() => setLoading(false))
  }, [])

  async function togglePermission(userId: number, moduleName: string, field: 'canView' | 'canEdit', currentValue: boolean) {
    const res = await fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, moduleName, [field]: !currentValue }),
    })
    const data = await res.json().catch(() => null)
    if (data?.success) {
      setPermissions(prev => {
        const existing = prev.find(p => p.userId === userId && p.moduleName === moduleName)
        if (existing) return prev.map(p => (p.userId === userId && p.moduleName === moduleName ? { ...p, [field]: !currentValue } : p))
        return [...prev, { id: `${userId}-${moduleName}`, userId, moduleName, canView: field === 'canView' ? !currentValue : false, canEdit: field === 'canEdit' ? !currentValue : false }]
      })
    }
  }

  const filteredUsers = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.positionTitle || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-8 text-center text-gray-500">Loading permissions...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              Department Access Control
            </h1>
            <p className="text-gray-600 mt-1">Manage module permissions for IITGN Faculty & Staff</p>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search officials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Official / Email</th>
                  {IITGN_MODULES.map(mod => (
                    <th key={mod.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div className="flex flex-col items-center gap-1">
                        <span>{mod.name}</span>
                        <span className="text-[10px] font-normal normal-case text-gray-400">{mod.description}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={IITGN_MODULES.length + 1} className="px-6 py-12 text-center text-gray-500">No users found.</td></tr>
                ) : (
                  filteredUsers.map(user => {
                    const userPerms = permissions.filter(p => p.userId === user.id)
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name || user.positionTitle}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </td>
                        {IITGN_MODULES.map(mod => {
                          const perm = userPerms.find(p => p.moduleName === mod.id)
                          return (
                            <td key={mod.id} className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="flex flex-col items-center gap-1">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={perm?.canView || false}
                                    onChange={() => togglePermission(user.id, mod.id, 'canView', perm?.canView || false)}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                  />
                                  <span className="text-xs text-gray-600">View</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={perm?.canEdit || false}
                                    onChange={() => togglePermission(user.id, mod.id, 'canEdit', perm?.canEdit || false)}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                  />
                                  <span className="text-xs text-gray-600">Edit</span>
                                </label>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
