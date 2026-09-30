'use client'
import { useEffect, useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { IITGN_MODULES } from '@/lib/modules'
import { RoomSelector } from './RoomSelector'
import { CalendarEvent } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialEvent?: CalendarEvent | null
  defaultStart?: Date
  allowedModules?: string[]
}

const toLocalDateTimeValue = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventFormModal({ isOpen, onClose, onSave, initialEvent, defaultStart, allowedModules }: Props) {
  const defaultStartRef = defaultStart || new Date()
  const defaultEndRef = new Date(defaultStartRef.getTime() + 60 * 60 * 1000)

  const [form, setForm] = useState({
    title: '', description: '',
    startTime: toLocalDateTimeValue(defaultStartRef),
    endTime: toLocalDateTimeValue(defaultEndRef),
    isAllDay: false, sourceModule: allowedModules?.[0] || 'GLOBAL',
    visibility: 'PUBLIC', location: '',
  })

  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null)
      if (initialEvent) {
        const start = new Date(initialEvent.startTime)
        const end = new Date(initialEvent.endTime)
        let locationStr = ''
        if (initialEvent.metadata && typeof initialEvent.metadata === 'object') {
          const m = initialEvent.metadata as Record<string, any>
          if (m.location && typeof m.location === 'string') locationStr = m.location
        }
        setForm({
          title: initialEvent.title, description: initialEvent.description || '',
          startTime: toLocalDateTimeValue(start), endTime: toLocalDateTimeValue(end),
          isAllDay: initialEvent.isAllDay, sourceModule: initialEvent.sourceModule,
          visibility: initialEvent.visibility, location: locationStr,
        })
      } else {
        const s = defaultStart || new Date()
        const e = new Date(s.getTime() + 60 * 60 * 1000)
        setForm({
          title: '', description: '',
          startTime: toLocalDateTimeValue(s), endTime: toLocalDateTimeValue(e),
          isAllDay: false, sourceModule: allowedModules?.[0] || 'GLOBAL',
          visibility: 'PUBLIC', location: '',
        })
      }
    }
  }, [isOpen, initialEvent, defaultStart, allowedModules])

  if (!isOpen) return null

  const modules = IITGN_MODULES.filter(m => !allowedModules || allowedModules.includes(m.id))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Build robust ISO timestamps — never let Invalid Date reach toISOString()
    let startIso: string
    let endIso: string
    try {
      const startParsed = form.startTime ? new Date(form.startTime) : null
      const endParsed = form.endTime ? new Date(form.endTime) : null
      startIso = startParsed && !isNaN(startParsed.getTime()) ? startParsed.toISOString() : new Date().toISOString()
      endIso = endParsed && !isNaN(endParsed.getTime()) ? endParsed.toISOString() : new Date(Date.now() + 3600000).toISOString()
    } catch (err) {
      setSubmitError('Invalid date/time. Please check your start and end values.')
      return
    }

    if (!form.title.trim()) {
      setSubmitError('Title is required.')
      return
    }

    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      startTime: startIso,
      endTime: endIso,
      isAllDay: form.isAllDay,
      sourceModule: form.sourceModule,
      visibility: form.visibility,
      metadata: { location: form.location },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{initialEvent ? 'Edit Event' : 'Create Event'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {submitError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="e.g., Senate Meeting, Electrical Maintenance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department / Module</label>
            <select value={form.sourceModule} onChange={(e) => setForm({ ...form, sourceModule: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600">
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <RoomSelector value={form.location} onChange={(room) => setForm({ ...form, location: room })} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAllDay}
              onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">All-day event (e.g., Holidays, Deadlines)</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="Details, attendees, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600">
              <option value="PUBLIC">Public (All Campus)</option>
              <option value="MODULE_ONLY">Department Only</option>
              <option value="ADMIN_ONLY">Admin Only</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> {initialEvent ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
