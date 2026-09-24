'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types';

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

export default function EventFormModal({ isOpen, onClose, onSave, initialEvent, defaultStart, allowedModules }: EventFormModalProps) {
  const modules = allowedModules && allowedModules.length > 0 ? ALL_MODULES.filter(m => allowedModules.includes(m)) : ALL_MODULES;

  const [title, setTitle] = useState('');
  const [sourceModule, setSourceModule] = useState(modules[0] || 'IWD');
  const [eventType, setEventType] = useState('TASK');
  const [visibility, setVisibility] = useState('MODULE_ONLY');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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
    } else {
      setTitle(''); setEventType('TASK'); setVisibility('MODULE_ONLY');
      setDescription(''); setMetadata({});
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
  }, [initialEvent, defaultStart, isOpen]);

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
      metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">{initialEvent ? 'Edit Event' : 'Create New Event'}</h2>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Module</label>
              <select value={sourceModule} onChange={e => setSourceModule(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
              <input type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
              <input type="datetime-local" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Visibility</label>
            <select value={visibility} onChange={e => setVisibility(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {VISIBILITIES.map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Module Specific Details</h3>
            {sourceModule === 'IWD' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Work Order ID</label>
                  <input type="text" value={metadata.work_order_id || ''} onChange={e => handleMetadataChange('work_order_id', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" placeholder="e.g., WO-2026-118" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Priority</label>
                  <select value={metadata.priority || ''} onChange={e => handleMetadataChange('priority', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                    <option value="">Select...</option>
                    <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            )}
            {sourceModule === 'ROOM_INFO' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Building</label>
                  <input type="text" value={metadata.building || ''} onChange={e => handleMetadataChange('building', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" placeholder="e.g., AB11" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Room Number</label>
                  <input type="text" value={metadata.room_number || ''} onChange={e => handleMetadataChange('room_number', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" placeholder="e.g., 201-203" />
                </div>
              </div>
            )}
            {sourceModule === 'FINANCE' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Budget Code</label>
                  <input type="text" value={metadata.budget_code || ''} onChange={e => handleMetadataChange('budget_code', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" placeholder="e.g., OPEX-2026-Q4" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Amount (INR)</label>
                  <input type="number" value={metadata.amount || ''} onChange={e => handleMetadataChange('amount', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" placeholder="e.g., 500000" />
                </div>
              </div>
            )}
            {!['IWD', 'ROOM_INFO', 'FINANCE'].includes(sourceModule) && (
              <p className="text-sm italic text-slate-400">No specific metadata fields for {sourceModule} module.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
            <button type="button" onClick={onClose} className="rounded-md bg-slate-100 px-4 py-2 font-medium text-slate-700 hover:bg-slate-200">Cancel</button>
            <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">{initialEvent ? 'Update Event' : 'Create Event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
