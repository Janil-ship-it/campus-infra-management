'use client';

import { useEffect, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus } from 'lucide-react';
import EventSidebar from '@/components/EventSidebar';
import EventFormModal from '@/components/EventFormModal';
import { CalendarEvent } from '@/types';

const MODULE_STYLE: Record<string, { bg: string; text: string }> = {
  IWD: { bg: '#dbeafe', text: '#1e40af' },
  FINANCE: { bg: '#d1fae5', text: '#065f46' },
  RND: { bg: '#ede9fe', text: '#5b21b6' },
  HMS: { bg: '#fef3c7', text: '#92400e' },
  ROOM_INFO: { bg: '#fee2e2', text: '#991b1b' },
  ADMIN: { bg: '#e2e8f0', text: '#334155' },
};

const ALL_MODULES = Object.keys(MODULE_STYLE);

interface SessionData {
  user: { id: number; email: string; name: string; isAdmin: boolean };
  permissions: { moduleName: string; canView: boolean; canEdit: boolean }[];
}

export default function Home() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultStart, setDefaultStart] = useState<Date | undefined>();

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => { if (d.success) setSession(d); });
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const isAdmin = session?.user.isAdmin ?? false;
  const editModules = isAdmin
    ? ALL_MODULES
    : (session?.permissions ?? []).filter(p => p.canEdit).map(p => p.moduleName);
  const canEdit = editModules.length > 0;

  const handleEventClick = (info: any) => {
    const event = events.find(e => e.id === info.event.id);
    if (event) { setSelectedEvent(event); setSidebarOpen(true); }
  };

  const handleDateClick = (info: any) => {
    if (!canEdit) return;
    setEditingEvent(null);
    setDefaultStart(info.date);
    setModalOpen(true);
  };

  const handleEditFromSidebar = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSidebarOpen(false);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this event?')) return;
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { setSidebarOpen(false); fetchEvents(); }
    else alert(data.message || 'Failed to cancel event');
  };

  const handleSaveEvent = async (data: any) => {
    const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
    const method = editingEvent ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) { setModalOpen(false); fetchEvents(); }
    else alert(result.message || 'Failed to save event');
  };

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86400000);
  const next7 = events.filter(e => { const s = new Date(e.startTime); return s >= now && s <= weekAhead; }).length;
  const modulesVisible = new Set(events.map(e => e.sourceModule)).size;

  const stats = [
    { label: 'Visible events', value: String(events.length) },
    { label: 'Next 7 days', value: String(next7) },
    { label: 'Modules in view', value: String(modulesVisible) },
    { label: 'Your access', value: isAdmin ? 'Admin (all)' : canEdit ? 'View + Edit' : 'View only' },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Global Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as {session?.user.name ?? '...'} • Unified event hub across IWD, Finance, R&D, HMS and Room Info.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditingEvent(null); setDefaultStart(new Date()); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Create Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(MODULE_STYLE).map(([module, style]) => (
          <span key={module} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.text }}></span>
            {module}
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex h-96 items-center justify-center text-sm text-slate-500">Loading schedule...</div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            events={events.map(e => ({
              id: e.id,
              title: e.title,
              start: e.startTime,
              end: e.endTime,
              allDay: e.isAllDay,
              backgroundColor: (MODULE_STYLE[e.sourceModule] || MODULE_STYLE.ADMIN).bg,
              textColor: (MODULE_STYLE[e.sourceModule] || MODULE_STYLE.ADMIN).text,
              borderColor: 'transparent',
            }))}
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
  );
}
