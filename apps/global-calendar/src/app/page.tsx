'use client'

import { useCallback, useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import { CalendarDays, Clock3, Layers } from 'lucide-react'
import { toast } from 'sonner'

import EventSidebar from '@/components/EventSidebar'
import EventFormModal from '@/components/EventFormModal'
import ConflictModal from '@/components/ConflictModal'
import DashboardSidebar from '@/components/DashboardSidebar'
import DayPanel from '@/components/DayPanel'
import { CalendarEvent } from '@/types'
import { IITGN_MODULES } from '@/lib/modules'

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  ACADEMIC_AFFAIRS: { bg: '#dbeafe', text: '#1e40af' },
  STUDENT_WELFARE: { bg: '#ede9fe', text: '#5b21b6' },
  INFRASTRUCTURE: { bg: '#ffedd5', text: '#9a3412' },
  RESEARCH_ADVANCEMENT: { bg: '#d1fae5', text: '#065f46' },
  FACULTY_AFFAIRS: { bg: '#ccfbf1', text: '#115e59' },
  INSTITUTE_EVENTS: { bg: '#fee2e2', text: '#991b1b' },
  GLOBAL: { bg: '#e2e8f0', text: '#334155' },
}

interface SessionData {
  user: { id: number; email: string; name: string; isAdmin: boolean }
  permissions: { moduleName: string; canView: boolean; canEdit: boolean }[]
}

export default function Home() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [defaultStart, setDefaultStart] = useState<Date | undefined>()
  const [view, setView] = useState('dayGridMonth')
  const [deptFilter, setDeptFilter] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dayPanelOpen, setDayPanelOpen] = useState(false)

  const [conflict, setConflict] = useState<{ open: boolean; message: string; conflicts: any[]; blockedRoom: string; startTime: string; endTime: string }>({ open: false, message: '', conflicts: [], blockedRoom: '', startTime: '', endTime: '' })
  const [conflictPayload, setConflictPayload] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => { if (d.success) setSession(d) })
  }, [])

  useEffect(() => {
    const sel = (e: Event) => { setSelectedEvent((e as CustomEvent<CalendarEvent>).detail); setSidebarOpen(true) }
    const create = () => { setEditingEvent(null); setDefaultStart(new Date()); setModalOpen(true) }
    window.addEventListener('select-event', sel)
    window.addEventListener('create-event', create)
    return () => { window.removeEventListener('select-event', sel); window.removeEventListener('create-event', create) }
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      if (data.success) setEvents(data.events)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const isAdmin = session?.user.isAdmin ?? false
  const allModuleIds = IITGN_MODULES.map(m => m.id)
  const editModules = isAdmin
    ? allModuleIds
    : (session?.permissions ?? []).filter(p => p.canEdit).map(p => p.moduleName)
  const viewModules = isAdmin
    ? allModuleIds
    : (session?.permissions ?? []).filter(p => p.canView).map(p => p.moduleName)
  const canEdit = editModules.length > 0

  // Domain-aware naming: single-domain users get "{Domain} Calendar"
  // GLOBAL is a system-level permission (granted to every user as fallback),
  // so we exclude it from title/chip display — only real functional domains count.
  const realDomainIds = viewModules.filter(id => id !== 'GLOBAL')
  const multiDomain = realDomainIds.length > 1
  const primaryDomain = IITGN_MODULES.find(m => m.id === realDomainIds[0])
  const pageTitle = multiDomain || !primaryDomain ? 'Faculty Calendar' : `${primaryDomain.name} Calendar`
  const chipModules = IITGN_MODULES.filter(m => realDomainIds.includes(m.id))

  const openCreateModal = (start?: Date) => { setEditingEvent(null); setDefaultStart(start ?? new Date()); setModalOpen(true) }

  const handleEventClick = (info: any) => {
    const ev = events.find(e => e.id === info.event.id || info.event.id.startsWith(e.id))
    if (ev) { setSelectedEvent(ev); setSidebarOpen(true) }
  }

  const handleDateClick = (info: any) => {
    setSelectedDay(new Date(info.date))
    setDayPanelOpen(true)
  }

  const handleCreateOnDay = (d: Date) => {
    const start = new Date(d)
    start.setHours(9, 0, 0, 0)
    setDayPanelOpen(false)
    openCreateModal(start)
  }

  const handleEditFromSidebar = (e: CalendarEvent) => { setEditingEvent(e); setSidebarOpen(false); setModalOpen(true) }

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this event?')) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { toast.success('Event cancelled'); setSidebarOpen(false); fetchEvents() }
    else toast.error(data.message || 'Failed')
  }

  const submitEvent = async (data: any) => {
    const isEdit = !!editingEvent && !conflictPayload
    const url = isEdit ? `/api/events/${editingEvent!.id}` : '/api/events'
    const { participantIds, ...eventData } = data
    try {
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) })
      const result = await res.json()
      if (!result.success) {
        if (result.code === 'ROOM_CONFLICT') {
          setConflictPayload(data)
          setConflict({ open: true, message: result.message, conflicts: result.conflicts || [], blockedRoom: data.metadata?.location || 'This room', startTime: data.startTime, endTime: data.endTime })
          return
        }
        toast.error(result.message || 'Failed'); return
      }
      if (participantIds?.length > 0) {
        await fetch(`/api/events/${result.event.id}/participants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userIds: participantIds, role: 'ATTENDEE' }) })
      }
      toast.success(isEdit ? 'Event updated' : 'Event created')
      setModalOpen(false); setConflictPayload(null); fetchEvents()
    } catch { toast.error('Failed') }
  }

  const handleRetryWithRoom = (room: string) => {
    setConflict(c => ({ ...c, open: false }))
    if (conflictPayload) submitEvent({ ...conflictPayload, metadata: { ...(conflictPayload.metadata || {}), location: room } })
  }

  const now = new Date()
  const weekAhead = new Date(now.getTime() + 7 * 86400000)
  const next7 = events.filter(e => { const s = new Date(e.startTime); return s >= now && s <= weekAhead }).length
  const activeModules = new Set(events.map(e => e.sourceModule)).size
  const domainEvents = events.filter(e => viewModules.includes(e.sourceModule)).length
  const filteredEvents = deptFilter ? events.filter(e => e.sourceModule === deptFilter) : events

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {session?.user.name ? `Signed in as ${session.user.name}` : '—'}
          </p>
        </div>
        {canEdit && (
          <button onClick={() => openCreateModal()} className="bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-950">
            New event
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => document.getElementById('cal')?.scrollIntoView({ behavior: 'smooth' })} className="text-left p-4 bg-white border border-gray-200 rounded-md hover:border-gray-300">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</span>
            <CalendarDays className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 tabular-nums">{events.length}</p>
        </button>
        <button onClick={() => setView('timeGridWeek')} className="text-left p-4 bg-white border border-gray-200 rounded-md hover:border-gray-300">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next 7 days</span>
            <Clock3 className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 tabular-nums">{next7}</p>
        </button>
        <button onClick={() => { window.location.href = '/directory' }} className="text-left p-4 bg-white border border-gray-200 rounded-md hover:border-gray-300">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{multiDomain ? 'Active depts' : 'Domain events'}</span>
            <Layers className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 tabular-nums">{multiDomain ? activeModules : domainEvents}</p>
        </button>
      </div>

      {/* Domain filter: only for users with 2+ domains */}
      {multiDomain && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">Filter</span>
          <button onClick={() => setDeptFilter(null)} className={`px-2.5 py-1 rounded-md text-xs font-medium border ${!deptFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
            All
          </button>
          {chipModules.map(m => (
            <button key={m.id} onClick={() => setDeptFilter(deptFilter === m.id ? null : m.id)} className={`px-2.5 py-1 rounded-md text-xs font-medium border ${deptFilter === m.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
              {m.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div id="cal" className="bg-white border border-gray-200 rounded-md p-4">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center text-sm text-gray-500">Loading…</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
              initialView={view}
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              events={filteredEvents.map(ev => {
                const s = new Date(ev.startTime), e = new Date(ev.endTime)
                const style = MODULE_COLORS[ev.sourceModule] || MODULE_COLORS.GLOBAL
                const base = { id: ev.id, title: ev.title, allDay: ev.isAllDay, backgroundColor: style.bg, textColor: style.text }
                return ev.recurrenceRule
                  ? { ...base, rrule: ev.recurrenceRule, dtstart: s.toISOString(), duration: e.getTime() - s.getTime() }
                  : { ...base, start: s, end: e }
              })}
              height="auto" dayMaxEvents={3} eventDisplay="block"
              editable={canEdit} selectable={canEdit}
              eventClick={handleEventClick} dateClick={handleDateClick}
            />
          )}
        </div>

        <DashboardSidebar
          events={events}
          userId={session?.user.id}
          userName={session?.user.name ?? ''}
          userEmail={session?.user.email ?? ''}
          isAdmin={isAdmin}
          userModules={viewModules}
          onSelect={(ev) => { setSelectedEvent(ev); setSidebarOpen(true) }}
        />
      </div>

      <DayPanel
        date={selectedDay}
        open={dayPanelOpen}
        events={filteredEvents}
        canEdit={canEdit}
        onClose={() => setDayPanelOpen(false)}
        onSelectEvent={(ev) => { setDayPanelOpen(false); setSelectedEvent(ev); setSidebarOpen(true) }}
        onCreateEvent={handleCreateOnDay}
      />

      <EventSidebar event={selectedEvent} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onEdit={handleEditFromSidebar} onDelete={handleDelete} canEdit={canEdit} />
      <EventFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={submitEvent} initialEvent={editingEvent} defaultStart={defaultStart} allowedModules={isAdmin ? undefined : editModules} />
      <ConflictModal open={conflict.open} message={conflict.message} conflicts={conflict.conflicts} blockedRoom={conflict.blockedRoom} startTime={conflict.startTime} endTime={conflict.endTime} onClose={() => setConflict(c => ({ ...c, open: false }))} onRetry={handleRetryWithRoom} />
    </div>
  )
}
