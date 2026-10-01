'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { CalendarDays, ShieldCheck, ScrollText, Calendar } from 'lucide-react';
import Fuse from 'fuse.js';

interface CalendarEvent {
  id: string;
  title: string;
  sourceModule: string;
  eventType: string;
  startTime: string;
}

const MODULE_COLORS: Record<string, string> = {
  IWD: 'bg-blue-500',
  FINANCE: 'bg-green-500',
  RND: 'bg-purple-500',
  HMS: 'bg-amber-500',
  ROOM_INFO: 'bg-red-500',
  ADMIN: 'bg-gray-500',
};

const PAGES = [
  { href: '/', label: 'Global Calendar', icon: CalendarDays },
  { href: '/admin/permissions', label: 'Permissions', icon: ShieldCheck },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      fetch('/api/events')
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setEvents(d.events);
        })
        .catch(() => {});
    }
  }, [open]);

  const eventFuse = useMemo(
    () =>
      new Fuse(events, {
        keys: ['title', 'sourceModule', 'eventType'],
        threshold: 0.3,
      }),
    [events]
  );

  const [query, setQuery] = useState('');
  const filteredEvents = query ? eventFuse.search(query).slice(0, 5).map((r) => r.item) : events.slice(0, 5);

  const handleEventSelect = (event: CalendarEvent) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('select-event', { detail: event }));
  };

  const handlePageSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search events, pages, or commands..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {PAGES.map((page) => (
            <CommandItem key={page.href} onSelect={() => handlePageSelect(page.href)}>
              <page.icon className="mr-2 h-4 w-4" />
              <span>{page.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {filteredEvents.length > 0 && (
          <CommandGroup heading="Events">
            {filteredEvents.map((event) => (
              <CommandItem key={event.id} onSelect={() => handleEventSelect(event)}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${MODULE_COLORS[event.sourceModule] || 'bg-gray-500'}`} />
                  <span className="flex-1 truncate">{event.title}</span>
                  <span className="text-xs text-gray-500">{event.sourceModule}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { setOpen(false); window.dispatchEvent(new Event('create-event')); }}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Create New Event</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
