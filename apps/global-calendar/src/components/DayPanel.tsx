'use client'

import { MapPin, Plus, X } from 'lucide-react'
import { CalendarEvent } from '@/types'
import { IITGN_MODULES } from '@/lib/modules'

interface Props {
  date: Date | null
  open: boolean
  events: CalendarEvent[]
  canEdit: boolean
  onClose: () => void
  onSelectEvent: (e:  CalendarEvent) => void
  onCreateEvent: (d: Date) => void
}

const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })

export default function DayPanel({ date, open, events, canEdit, onClose, onSelectEvent, onCreateEvent }: Props) {
  if (!open || !date) return null

  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999)

  const dayEvents = events
    .filter(e => {
      const s = new Date(e.startTime).getTime()
      const en = new Date(e.endTime).getTime()
      return s <= dayEnd.getTime() && en >= dayStart.getTime()
    })
    .sort((a, b) =>
      Number(b.isAllDay) - Number(a.isAllDay) ||
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Schedule</p>
          <h2 className="text-base font-semibold text-gray-900">
            {date.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
      </div>

      <div className="p-4">
        {canEdit && (
          <button
            onClick={() => onCreateEvent(date)}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-950"
          >
            <Plus className="h-4 w-4" />
            New event on this day
          </button>
        )}

        {dayEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No events scheduled.</p>
            {canEdit && <p className="text-xs text-gray-400 mt-1">Use the button above to add one.</p>}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {dayEvents.map(e => {
              const s = new Date(e.startTime)
              const en = new Date(e.endTime)
              const meta = (e.metadata || {}) as any
              const dept = IITGN_MODULES.find(m => m.id === e.sourceModule)
              return (
                <li key={e.id}>
                  <button
                    onClick={() => onSelectEvent(e)}
                    className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-md -mx-1"
                  >
                    <p className="text-xs font-medium text-gray-500 tabular-nums">
                      {e.isAllDay ? 'All day' : `${fmtTime(s)} – ${fmtTime(en)}`}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{e.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: deptColor(e.sourceModule) }} />
                        {dept?.name ?? e.sourceModule.replace(/_/g, ' ')}
                      </span>
                      {meta.location && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{meta.location}</span>
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function deptColor(id: string): string {
  const map: Record<string, string> = {
    ACADEMIC_AFFAIRS: '#1e40af',
    STUDENT_WELFARE: '#5b21b6',
    INFRASTRUCTURE: '#9a3412',
    RESEARCH_ADVANCEMENT: '#065f46',
    FACULTY_AFFAIRS: '#115e59',
    INSTITUTE_EVENTS: '#991b1b',
    GLOBAL: '#334155',
  }
  return map[id] || '#6b7280'
}
