'use client'

import { useCallback, useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import { Plus, CalendarDays, Clock3, Layers, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import EventSidebar from '@/components/EventSidebar'
import EventFormModal from '@/components/EventFormModal'
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

const ALL_MODULES = IITGN_MODULES.map(m => m.id)

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

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => { if (data.success) setSession(data) })
  }, [])

  useEffect(() => {
    const selectHandler = (event: Event) => {
      setSelectedEvent((event as CustomEvent<CalendarEvent>).detail)
      setSidebarOpen(true)
    }
    const createHandler = () => {
      setEditingEvent(null)
      setDefaultStart(new Date())
      setModalOpen(true)
    }

    window.addEventListener('select-event', selectHandler)
    window.addEventListener('create-event', createHandler)
    return () => {
      window.removeEventListener('select-event', selectHandler)
      window.removeEventListener('create-event', createHandler)
    }
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      if (data.success) setEvents(data.events)
    } catch (error) { console.error('Failed to fetch events', error) } 
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const isAdmin = session?.user.isAdmin ?? false
  const editModules = isAdmin
    ? ALL_MODULES
    : (session?.permissions ?? []).filter((p) => p.canEdit).map((p) => p.moduleName)
  const canEdit = editModules.length > 0

  const openCreateModal = (start?: Date) => {
    setEditingEvent(null)
    setDefaultStart(start ?? new Date())
    setModalOpen(true)
  }

  const handleEventClick = (info: any) => {
    const event = events.find((item) => item.id === info.event.id || info.event.id.startsWith(item.id))
    if (event) {
      setSelectedEvent(event)
      setSidebarOpen(true)
    }
  }

  const handleDateClick = (info: any) => {
    if (!canEdit) return
    openCreateModal(info.date)
  }

  const handleEditFromSidebar = (event: CalendarEvent) => {
    setEditingEvent(event)
    setSidebarOpen(false)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this event?')) return
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Event cancelled successfully')
        setSidebarOpen(false)
        fetchEvents()
      } else {
        toast.error(data.message || 'Failed to cancel event')
      }
    } catch (error) {
      toast.error('Failed to cancel event')
    }
  }

  const handleSaveEvent = async (data: any) => {
    const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events'
    const method = editingEvent ? 'PUT' : 'POST'
    const { participantIds, ...eventData } = data

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.message || 'Failed to save event')
        return
      }

      if (participantIds && participantIds.length > 0) {
        const participantRes = await fetch(`/api/events/${result.event.id}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: participantIds, role: 'ATTENDEE' }),
        })
        const participantData = await participantRes.json()
        if (participantData.success) {
          toast.success(`Event created with ${participantIds.length} participant(s)`)
        } else {
          toast.success('Event created, but failed to add participants')
        }
      } else {
        toast.success(editingEvent ? 'Event updated' : 'Event created')
      }

      setModalOpen(false)
      fetchEvents()
    } catch (error) {
      toast.error('Failed to save event')
    }
  }

  const now = new Date()
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const next7 = events.filter((event) => {
    const start = new Date(event.startTime)
    return start >= now && start <= weekAhead
  }).length
  const modulesVisible = new Set(events.map((event) => event.sourceModule)).size

  const stats = [
    { label: 'Total Events', value: String(events.length), icon: CalendarDays, color: 'bg-blue-50 text-blue-600', onClick: () => document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Next 7 Days', value: String(next7), icon: Clock3, color: 'bg-emerald-50 text-emerald-600', onClick: () => setView('timeGridWeek') },
    { label: 'Active Modules', value: String(modulesVisible), icon: Layers, color: 'bg-violet-50 text-violet-600', onClick: () => { window.location.href = '/directory' } },
    { label: 'Access Level', value: isAdmin ? 'Admin' : canEdit ? 'Editor' : 'Viewer', icon: ShieldCheck, color: 'bg-amber-50 text-amber-600', onClick: () => { window.location.href = '/admin/permissions' } },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Global Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {session?.user.name ?? '...'} Here is what&apos;s happening across campus today.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} onClick={stat.onClick} title="Click to navigate" className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div id="calendar-section" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex h-[600px] items-center justify-center text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              <p className="text-sm font-medium">Loading campus schedule...</p>
            </div>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
            initialView={view}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            events={events.map((event) => {
              const start = new Date(event.startTime)
              const end = new Date(event.endTime)
              const durationMs = end.getTime() - start.getTime()
              const moduleStyle = MODULE_COLORS[event.sourceModule] || MODULE_COLORS.GLOBAL
              const baseProps = {
                id: event.id,
                title: event.title,
                allDay: event.isAllDay,
                backgroundColor: moduleStyle.bg,
                textColor: moduleStyle.text,
                borderColor: 'transparent',
              }
              if (event.recurrenceRule) {
                return { ...baseProps, rrule: event.recurrenceRule, dtstart: start.toISOString(), duration: durationMs }
              }
              return { ...baseProps, start, end }
            })}
            height="auto"
            dayMaxEvents={3}
            eventDisplay="block"
            editable={canEdit}
            selectable={canEdit}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
          />
        )}
      </div>

      <EventSidebar
        event={selectedEvent}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onEdit={handleEditFromSidebar}
        onDelete={handleDelete}
        canEdit={canEdit}
      />

      <EventFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        initialEvent={editingEvent}
        defaultStart={defaultStart}
        allowedModules={isAdmin ? undefined : editModules}
      />
    </div>
  )
}
