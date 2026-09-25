'use client';

import { CalendarEvent } from '@/types';
import { Repeat } from 'lucide-react';

interface EventSidebarProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

const MODULE_COLORS: Record<string, string> = {
  IWD: 'bg-blue-100 text-blue-800',
  FINANCE: 'bg-green-100 text-green-800',
  RND: 'bg-purple-100 text-purple-800',
  HMS: 'bg-amber-100 text-amber-800',
  ROOM_INFO: 'bg-red-100 text-red-800',
  ADMIN: 'bg-gray-100 text-gray-800',
};

const RRULE_LABELS: Record<string, string> = {
  'FREQ=DAILY': 'Repeats Daily',
  'FREQ=WEEKLY': 'Repeats Weekly',
  'FREQ=MONTHLY': 'Repeats Monthly',
  'FREQ=YEARLY': 'Repeats Yearly',
};

export default function EventSidebar({ event, isOpen, onClose, onEdit, onDelete, canEdit }: EventSidebarProps) {
  if (!event || !isOpen) return null;

  const formatMetadata = (meta?: Record<string, any> | null) => {
    if (!meta || Object.keys(meta).length === 0) {
      return <p className="text-sm italic text-gray-400">No additional details</p>;
    }
    return (
      <dl className="space-y-2">
        {Object.entries(meta).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b border-gray-100 pb-1">
            <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
            <dd className="font-mono text-sm text-gray-900">{String(value)}</dd>
          </div>
        ))}
      </dl>
    );
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-96 transform bg-white shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-gray-200 p-6">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${MODULE_COLORS[event.sourceModule] || 'bg-gray-100 text-gray-800'}`}>
                {event.sourceModule}
              </span>
              {event.recurrenceRule && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                  <Repeat className="h-3 w-3" />
                  {RRULE_LABELS[event.recurrenceRule] || 'Recurring'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Schedule</h3>
            <p className="text-gray-900">
              {new Date(event.startTime).toLocaleString()} <br />
              <span className="text-gray-500">to</span> <br />
              {new Date(event.endTime).toLocaleString()}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Details</h3>
            <p className="mb-4 text-gray-700">{event.description || 'No description provided.'}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Type:</span> <span className="font-medium">{event.eventType}</span></div>
              <div><span className="text-gray-500">Visibility:</span> <span className="font-medium">{event.visibility.replace('_', ' ')}</span></div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Metadata</h3>
            {formatMetadata(event.metadata)}
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-3 border-t border-gray-200 p-6">
            <button onClick={() => onEdit(event)} className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700">Edit Series</button>
            <button onClick={() => onDelete(event.id)} className="flex-1 rounded-md border border-red-300 bg-white px-4 py-2 font-medium text-red-600 transition hover:bg-red-50">Cancel Series</button>
          </div>
        )}
      </div>
    </div>
  );
}
