'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { IITGN_MODULES } from '@/lib/modules'
import { RoomSelector } from './RoomSelector'
import { UserCombobox } from './UserCombobox'
import { CalendarEvent } from '@/types'

interface Props {
  isOpen: boolean; onClose: () => void; onSave: (data: any) => void
  initialEvent?: CalendarEvent | null; defaultStart?: Date; allowedModules?: string[]
}

const fmtLocal = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function EventFormModal({ isOpen, onClose, onSave, initialEvent, defaultStart, allowedModules }: Props) {
  const [form, setForm] = useState({
    title: '', description: '', startTime: '', endTime: '',
    isAllDay: false, sourceModule: allowedModules?.[0] || 'GLOBAL', eventType: 'MEETING',
    visibility: 'PUBLIC', location: '',
    repeat: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY', repeatUntil: '',
    participantIds: [] as number[],
  })
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setError(null); setUserSearch('')
    fetch('/api/users').then(r => r.json()).then(d => {
      const list = d?.data ?? d?.users ?? []
      setUsers(Array.isArray(list) ? list : [])
    }).catch(() => setUsers([]))

    if (initialEvent) {
      const s = new Date(initialEvent.startTime), e = new Date(initialEvent.endTime)
      let loc = ''
      if (initialEvent.metadata && typeof initialEvent.metadata === 'object') {
        const m = initialEvent.metadata as Record<string, any>
        if (typeof m.location === 'string') loc = m.location
      }
      let repeat: any = 'NONE'; let repeatUntil = ''
      const rule = (initialEvent as any).recurrenceRule as string | undefined
      if (rule) {
        if (rule.includes('FREQ=WEEKLY')) repeat = 'WEEKLY'
        else if (rule.includes('FREQ=MONTHLY')) repeat = 'MONTHLY'
        else if (rule.includes('FREQ=DAILY')) repeat = 'DAILY'
        const um = rule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/)
        if (um) repeatUntil = `${um[1]}-${um[2]}-${um[3]}`
      }
      const parts = ((initialEvent as any).participants ?? []) as any[]
      setForm({
        title: initialEvent.title, description: initialEvent.description || '',
        startTime: fmtLocal(s), endTime: fmtLocal(e),
        isAllDay: initialEvent.isAllDay, sourceModule: initialEvent.sourceModule,
        eventType: ((initialEvent as any).eventType as string) || 'MEETING',
        visibility: initialEvent.visibility, location: loc,
        repeat, repeatUntil, participantIds: parts.map(p => p.userId),
      })
    } else {
      const s = defaultStart || new Date(), e = new Date(s.getTime() + 3600000)
      setForm({
        title: '', description: '', startTime: fmtLocal(s), endTime: fmtLocal(e),
        isAllDay: false, sourceModule: allowedModules?.[0] || 'GLOBAL', eventType: 'MEETING',
        visibility: 'PUBLIC', location: '', repeat: 'NONE', repeatUntil: '', participantIds: [],
      })
    }
  }, [isOpen, initialEvent, defaultStart, allowedModules])

  if (!isOpen) return null
  const modules = IITGN_MODULES.filter(m => !allowedModules || allowedModules.includes(m.id))
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    let startIso: string, endIso: string
    try {
      const sp = form.startTime ? new Date(form.startTime) : null
      const ep = form.endTime ? new Date(form.endTime) : null
      startIso = sp && !isNaN(sp.getTime()) ? sp.toISOString() : new Date().toISOString()
      endIso = ep && !isNaN(ep.getTime()) ? ep.toISOString() : new Date(Date.now() + 3600000).toISOString()
    } catch { setError('Invalid date/time'); return }

    if (!form.title.trim()) { setError('Title required'); return }

    let recurrenceRule: string | undefined
    if (form.repeat !== 'NONE') {
      const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
      let rule = `FREQ=${form.repeat}`
      if (form.repeat === 'WEEKLY') rule += `;BYDAY=${days[new Date(startIso).getDay()]}`
      if (form.repeatUntil) {
        const u = new Date(form.repeatUntil + 'T23:59:59Z')
        if (!isNaN(u.getTime())) rule += `;UNTIL=${u.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z')}`
      }
      recurrenceRule = rule
    }

    onSave({
      title: form.title.trim(), description: form.description.trim(),
      startTime: startIso, endTime: endIso, isAllDay: form.isAllDay,
      sourceModule: form.sourceModule, eventType: form.eventType,
      visibility: form.visibility, metadata: { location: form.location },
      recurrenceRule, participantIds: form.participantIds,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-md shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{initialEvent ? 'Edit event' : 'New event'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Title</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md" placeholder="Senate meeting, Maintenance…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Department</label>
              <select value={form.sourceModule} onChange={e => setForm({ ...form, sourceModule: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md">
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Type</label>
              <select value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md">
                <option value="MEETING">Meeting</option>
                <option value="TASK">Task</option>
                <option value="REMINDER">Reminder</option>
                <option value="DEADLINE">Deadline</option>
                <option value="MILESTONE">Milestone</option>
              </select>
            </div>
          </div>

          <RoomSelector value={form.location} onChange={room => setForm({ ...form, location: room })} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Start</label>
              <input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">End</label>
              <input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Repeat</label>
              <select value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md">
                <option value="NONE">Does not repeat</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Until</label>
              <input type="date" value={form.repeatUntil} disabled={form.repeat === 'NONE'}
                onChange={e => setForm({ ...form, repeatUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md disabled:bg-gray-50" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isAllDay} onChange={e => setForm({ ...form, isAllDay: e.target.checked })} className="h-4 w-4" />
            <span className="text-sm text-gray-700">All-day event</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-md" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Visibility</label>
            <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md">
              <option value="PUBLIC">Public — all campus</option>
              <option value="MODULE_ONLY">Department only</option>
              <option value="ADMIN_ONLY">Admin only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Invite officials ({form.participantIds.length})</label>
            <UserCombobox
              users={users.map((u: any) => ({ id: u.id, name: u.name || u.positionTitle || 'Unnamed', email: u.email, positionTitle: u.positionTitle }))}
              selectedIds={form.participantIds}
              onChange={(ids) => setForm({ ...form, participantIds: ids })}
              placeholder="Type name, email, or role…"
            />
            <p className="text-xs text-gray-500 mt-1">Tip: type to fuzzy-search · ↑↓ navigate · Enter to add · Backspace to remove</p>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-950 text-sm font-medium">{initialEvent ? 'Save changes' : 'Create event'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
