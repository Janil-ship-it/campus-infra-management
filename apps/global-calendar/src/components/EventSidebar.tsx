'use client';

import { CalendarEvent } from '@/types';
import { Repeat, X, Clock, Tag, Eye, Edit, Trash2 } from 'lucide-react';

interface EventSidebarProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

const MODULE_COLORS: Record<string, string> = {
  IWD: 'bg-blue-100 text-blue-800 ring-blue-200',
  FINANCE: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  RND: 'bg-violet-100 text-violet-800 ring-violet-200',
  HMS: 'bg-amber-100 text-amber-800 ring-amber-200',
  ROOM_INFO: 'bg-red-100 text-red-800 ring-red-200',
  ADMIN: 'bg-slate-100 text-slate-800 ring-slate-200',
};

const RRULE_LABELS: Record<string, string> = {
  'FREQ=DAILY': 'Repeats Daily',
  'FREQ=WEEKLY': 'Repeats Weekly',
  'FREQ=MONTHLY': 'Repeats Monthly',
  'FREQ=YEARLY': 'Repeats Yearly',
};

export default function EventSidebar({ event, isOpen, onClose, onEdit, onDelete, canEdit }: EventSidebarProps) {
  const formatMetadata = (meta?: Record<string, any> | null) => {
    if (!meta || Object.keys(meta).length === 0) return <p className="text-sm italic text-slate-400">No additional metadata provided.</p>;
    return (
      <div className="space-y-3">
        {Object.entries(meta).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
            <dt className="text-sm font-medium capitalize text-slate-600">{key.replace(/_/g, ' ')}</dt>
            <dd className="text-sm font-semibold text-slate-900">{String(value)}</dd>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 px-8 py-6">
            <div className="flex-1 pr-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${MODULE_COLORS[event?.sourceModule || 'ADMIN']}`}>
                  {event?.sourceModule}
                </span>
                {event?.recurrenceRule && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                    <Repeat className="h-3 w-3" />
                    {RRULE_LABELS[event.recurrenceRule] || 'Recurring'}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{event?.title}</h2>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-8 overflow-y-auto px-8 py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Clock className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(event?.startTime || '').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(event?.startTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event?.endTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {event?.description && (
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">Description</h3>
                <p className="text-sm leading-relaxed text-slate-700">{event.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Tag className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Type</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{event?.eventType}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Visibility</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{event?.visibility.replace('_', ' ')}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Metadata & Details</h3>
              {formatMetadata(event?.metadata)}
            </div>
          </div>

          {/* Footer Actions */}
          {canEdit && (
            <div className="flex gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-5">
              <button onClick={() => onEdit(event!)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                <Edit className="h-4 w-4" /> Edit Series
              </button>
              <button onClick={() => onDelete(event!.id)} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
