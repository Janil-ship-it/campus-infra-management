'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types';
import { X } from 'lucide-react';

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
      setMetadata((initialEvent.metadata as Record<string, string>) || {});
      const existingRule = initialEvent.recurrenceRule || 'none';
      setRecurrence(RECURRENCES.find(r => r.value === existingRule) ? existingRule : 'none');
    } else {
      setTitle(''); setEventType('TASK'); setVisibility('MODULE_ONLY');
      setDescription(''); setMetadata({}); setRecurrence('none');
      setSourceModule(modules[0] || 'IWD');
      if (defaultStart) {
        const start = new Date(defaultStart);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        setStartTime(start.toISOString().slice(0, 16));
        setEndTime(end.toISOString().slice(0, 16));
      } else {
        setStartTime(''); setEndTime('');
      }
    }
  }, [initialEvent, defaultStart, isOpen, modules]);

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMetadata = Object.fromEntries(Object.entries(metadata).filter(([_, v]) => v !== ''));
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
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Room (Full ID for conflict check)</label>
                  <input type="text" value={metadata.room || ''} onChange={e => handleMetadataChange('room', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g., AB3-201-202" />
                </div>
              </div>
            )}
            {sourceModule === 'ROOM_INFO' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Building</label>
                  <input type="text" value={metadata.building || ''} onChange={e => handleMetadataChange('building', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="AB11" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Room Number</label>
                  <input type="text" value={metadata.room_number || ''} onChange={e => handleMetadataChange('room_number', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="201-203" />
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
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Meeting Room (Full ID)</label>
                  <input type="text" value={metadata.room || ''} onChange={e => handleMetadataChange('room', e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="AB3-303 BOARD ROOM" />
                </div>
              </div>
            )}
            {!['IWD', 'ROOM_INFO', 'FINANCE'].includes(sourceModule) && (
              <p className="text-sm italic text-slate-400">No specific metadata fields configured for {sourceModule}.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]">{initialEvent ? 'Update Event' : 'Create Event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
