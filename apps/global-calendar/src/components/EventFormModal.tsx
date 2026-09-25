'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types';
import { X, MapPin, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface RoomInfo {
  id: number;
  building: string;
  roomNumber: string;
  label: string;
  purpose: string;
  capacity: number | null;
  available: boolean;
  conflicts: { id: string; title: string; sourceModule: string; startTime: string; endTime: string; creatorName: string | null }[];
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialEvent?: CalendarEvent | null;
  defaultStart?: Date;
  allowedModules?: string[];
}

const ALL_MODULES = ['IWD', 'FINANCE', 'RND', 'HMS', 'ROOM_INFO', 'ADMIN'];
const EVENT_TYPES = ['MEETING', 'TASK', 'DEADLINE', 'REMINDER', 'MILESTONE'];
const VISIBILITIES = ['PUBLIC', 'MODULE_ONLY', 'ADMIN_ONLY'];
const RECURRENCES = [
  { label: 'Does not repeat', value: 'none' },
  { label: 'Daily', value: 'FREQ=DAILY' },
  { label: 'Weekly', value: 'FREQ=WEEKLY' },
  { label: 'Monthly', value: 'FREQ=MONTHLY' },
];
const PURPOSE_LABELS: Record<string, string> = {
  CLASSROOM: 'Classroom', LAB: 'Lab', BOARD_ROOM: 'Board Room', OFFICE: 'Office', AUDITORIUM: 'Auditorium',
};

export default function EventFormModal({ isOpen, onClose, onSave, initialEvent, defaultStart, allowedModules }: EventFormModalProps) {
  const modules = allowedModules && allowedModules.length > 0 ? ALL_MODULES.filter(m => allowedModules.includes(m)) : ALL_MODULES;

  const [title, setTitle] = useState('');
  const [sourceModule, setSourceModule] = useState(modules[0] || 'IWD');
  const [eventType, setEventType] = useState('TASK');
  const [visibility, setVisibility] = useState('MODULE_ONLY');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [availability, setAvailability] = useState<Record<string, RoomInfo> | null>(null);
  const [checking, setChecking] = useState(false);
  const [building, setBuilding] = useState('');
  const [roomLabel, setRoomLabel] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/rooms').then(r => r.json()).then(d => { if (d.success) setRooms(d.rooms); });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialEvent) {
      setTitle(initialEvent.title);
      setSourceModule(initialEvent.sourceModule);
      setEventType(initialEvent.eventType);
      setVisibility(initialEvent.visibility);
      setDescription(initialEvent.description || '');
      setStartTime(new Date(initialEvent.startTime).toISOString().slice(0, 16));
      setEndTime(new Date(initialEvent.endTime).toISOString().slice(0, 16));
      const meta = (initialEvent.metadata as Record<string, string>) || {};
      setMetadata(meta);
      const existingRule = initialEvent.recurrenceRule || 'none';
      setRecurrence(RECURRENCES.find(r => r.value === existingRule) ? existingRule : 'none');
      const label = (meta.room || '').toUpperCase();
      if (label) {
        const [b, ...rest] = label.split('-');
        setBuilding(b);
        setRoomLabel(label);
      } else { setBuilding(''); setRoomLabel(''); }
    } else {
      setTitle(''); setEventType('TASK'); setVisibility('MODULE_ONLY');
      setDescription(''); setMetadata({}); setRecurrence('none');
      setBuilding(''); setRoomLabel('');
      setSourceModule(modules[0] || 'IWD');
      if (defaultStart) {
        const start = new Date(defaultStart);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        setStartTime(start.toISOString().slice(0, 16));
        setEndTime(end.toISOString().slice(0, 16));
      } else { setStartTime(''); setEndTime(''); }
    }
    setAvailability(null);
  }, [initialEvent, defaultStart, isOpen, modules]);

  useEffect(() => {
    if (!isOpen || !startTime || !endTime) { setAvailability(null); return; }
    const s = new Date(startTime); const e = new Date(endTime);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) { setAvailability(null); return; }
    setChecking(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams({ start: s.toISOString(), end: e.toISOString() });
      if (initialEvent) params.set('excludeEventId', initialEvent.id);
      fetch(`/api/rooms/availability?${params.toString()}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            const map: Record<string, RoomInfo> = {};
            d.rooms.forEach((r: RoomInfo) => { map[r.label] = r; });
            setAvailability(map);
          }
        })
        .finally(() => setChecking(false));
    }, 350);
    return () => clearTimeout(t);
  }, [startTime, endTime, isOpen, initialEvent]);

  const buildings = [...new Set(rooms.map(r => r.building))];
  const buildingRooms = rooms.filter(r => r.building === building);
  const selectedAv = roomLabel && availability ? availability[roomLabel] : null;
  const clash = selectedAv && !selectedAv.available;
  const bookedNow = availability ? Object.values(availability).filter(r => !r.available) : [];

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMetadata = Object.fromEntries(Object.entries(metadata).filter(([_, v]) => v !== ''));
    if (roomLabel) {
      const [b, ...rest] = roomLabel.split('-');
      cleanMetadata.room = roomLabel;
      cleanMetadata.building = b;
      cleanMetadata.room_number = rest.join('-');
    } else {
      delete cleanMetadata.room;
    }
    onSave({
      title, sourceModule, eventType, visibility, description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      recurrenceRule: recurrence === 'none' ? undefined : recurrence,
      metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 px-8 py-5 backdrop-blur">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{initialEvent ? 'Edit Event' : 'Create New Event'}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-8 py-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Event Title</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Electrical Maintenance - AB3" className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Department / Module</label>
              <select value={sourceModule} onChange={e => setSourceModule(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Event Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Start Time</label>
              <input type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">End Time</label>
              <input type="datetime-local" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Visibility</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                {VISIBILITIES.map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Repeat</label>
              <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                {RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Location & Room Availability</h3>
              {checking && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Academic Block</label>
                <select value={building} onChange={e => { setBuilding(e.target.value); setRoomLabel(''); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">No room needed</option>
                  {buildings.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Room</label>
                <select value={roomLabel} onChange={e => setRoomLabel(e.target.value)} disabled={!building} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400">
                  <option value="">Select room...</option>
                  {buildingRooms.map(r => {
                    const av = availability?.[r.label];
                    const booked = av && !av.available;
                    return (
                      <option key={r.label} value={r.label} disabled={!!booked}>
                        {booked ? `${r.label} — BOOKED: ${av.conflicts[0].title}` : `${r.label} • ${PURPOSE_LABELS[r.purpose] || r.purpose}${r.capacity ? ` (${r.capacity})` : ''}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {roomLabel && !checking && selectedAv && selectedAv.available && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> {roomLabel} is available at this time.
              </div>
            )}

            {clash && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-red-700">
                  <AlertTriangle className="h-4 w-4" /> Clash detected — you cannot book {roomLabel}
                </div>
                <div className="mt-3 space-y-2">
                  {selectedAv.conflicts.map(c => (
                    <div key={c.id} className="rounded-md bg-white px-3 py-2 text-sm ring-1 ring-red-100">
                      <p className="font-semibold text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-600">
                        {c.sourceModule} • {new Date(c.startTime).toLocaleString()} – {new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {c.creatorName ? ` • booked by ${c.creatorName}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!clash && bookedNow.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Already booked at this time</p>
                <div className="mt-2 space-y-1.5">
                  {bookedNow.map(r => (
                    <p key={r.label} className="text-xs text-amber-800">
                      <span className="font-semibold">{r.label}</span> — {r.conflicts[0].title} ({r.conflicts[0].sourceModule}){r.conflicts[0].creatorName ? ` by ${r.conflicts[0].creatorName}` : ''}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Add any relevant details or notes..." className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Module Specific Details</h3>
            {sourceModule === 'IWD' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Work Order ID</label>
                  <input type="text" value={metadata.work_order_id || ''} onChange={e => handleMetadataChange('work_order_id', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="WO-2026-118" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Priority</label>
                  <select value={metadata.priority || ''} onChange={e => handleMetadataChange('priority', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Select...</option>
                    <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            )}
            {sourceModule === 'FINANCE' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Budget Code</label>
                  <input type="text" value={metadata.budget_code || ''} onChange={e => handleMetadataChange('budget_code', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="OPEX-2026-Q4" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Amount (INR)</label>
                  <input type="number" value={metadata.amount || ''} onChange={e => handleMetadataChange('amount', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="500000" />
                </div>
              </div>
            )}
            {!['IWD', 'FINANCE'].includes(sourceModule) && (
              <p className="text-sm italic text-slate-400">No specific metadata fields configured for {sourceModule}.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={!!clash} className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none">{initialEvent ? 'Update Event' : 'Create Event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
