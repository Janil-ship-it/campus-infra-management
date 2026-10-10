'use client'
import { X, Edit, Trash2, MapPin, Clock, Users, Repeat } from 'lucide-react'
import { IITGN_MODULES } from '@/lib/modules'
import { CalendarEvent } from '@/types'

interface Props {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
  onDelete: (id: string) => void
  canEdit: boolean
}

export default function EventSidebar({ event, isOpen, onClose, onEdit, onDelete, canEdit }: Props) {
  if (!isOpen || !event) return null
  const moduleName = IITGN_MODULES.find(m => m.id === event.sourceModule)?.name || event.sourceModule
  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  const meta = (event.metadata || {}) as any
  const participants = ((event as any).participants ?? []) as any[]

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Event Details</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{moduleName}</span>
            {event.recurrenceRule && (
              <span className="inline-block px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
                <Repeat className="h-3 w-3" /> Recurring
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {event.isAllDay ? 'All Day' : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </p>
              <p className="text-gray-500">{start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {meta.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <p className="text-gray-700">{meta.location}</p>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-gray-400 mt-0.5" />
            <p className="text-gray-700">{event.visibility === 'PUBLIC' ? 'Visible to all campus' : `Visible to ${moduleName} only`}</p>
          </div>
        </div>

        {participants.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Invited Officials ({participants.length})</h4>
            <div className="space-y-1.5">
              {participants.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-800 truncate">{p.user?.name ?? p.user?.email ?? `Official #${p.userId}`}</span>
                  <span className="text-xs text-gray-500 ml-2">{p.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {event.description && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {canEdit && (
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button onClick={() => onEdit(event)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2">
              <Edit className="h-4 w-4" /> Edit
            </button>
            <button onClick={() => onDelete(event.id)} className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center justify-center gap-2">
              <Trash2 className="h-4 w-4" /> Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
