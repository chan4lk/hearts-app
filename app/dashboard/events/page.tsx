'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import HeartButton from '@/app/components/hearts/HeartButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Check, X, Plus, Users } from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  dateTime: string;
  location: string | null;
  eventType: string | null;
  status: string;
  myStatus: string | null;
  _count: { participations: number };
}

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchEvents = useCallback(async () => {
    const res = await fetch('/api/events');
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const now = new Date();
  const filtered = events.filter(e =>
    tab === 'upcoming' ? new Date(e.dateTime) >= now : new Date(e.dateTime) < now
  );

  const handleParticipate = async (eventId: string, status: 'CONFIRMED' | 'DECLINED') => {
    await fetch(`/api/events/${eventId}/participate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchEvents();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, dateTime, location, eventType }),
    });
    if (res.ok) {
      setShowCreate(false);
      setTitle(''); setDescription(''); setDateTime(''); setLocation(''); setEventType('');
      await fetchEvents();
    }
    setCreating(false);
  };

  const isAdmin = session?.user?.role === 'ADMIN';

  const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    CONFIRMED: { label: 'Confirmed', className: 'bg-success-muted text-success' },
    DECLINED: { label: 'Declined', className: 'bg-error-muted text-error' },
    PENDING: { label: 'Pending', className: 'bg-warning-muted text-warning' },
  };

  return (
    <DashboardLayout type="employee">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Events" description="Company events and activities">
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium hover:opacity-90 focus-ring">
              <Plus className="w-4 h-4" /> New Event
            </button>
          )}
        </PageHeader>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['upcoming', 'past'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium focus-ring ${tab === t ? 'bg-accent text-[rgb(var(--color-text-inverse))]' : 'bg-surface-secondary text-secondary hover:text-primary'}`}>
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-secondary">Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">No {tab} events</h3>
            <p className="text-sm text-secondary">{isAdmin ? 'Create an event to get started' : 'Check back soon!'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => {
              const badge = event.myStatus ? STATUS_BADGE[event.myStatus] : null;
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-surface-elevated rounded-xl border border-theme p-4 shadow-theme-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-primary">{event.title}</h3>
                        {event.eventType && <span className="text-xs text-tertiary bg-surface-secondary px-2 py-0.5 rounded-full">{event.eventType}</span>}
                        {badge && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>}
                      </div>
                      {event.description && <p className="text-xs text-secondary mb-2">{event.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-tertiary">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(event.dateTime).toLocaleDateString()} {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>}
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event._count.participations} invited</span>
                      </div>
                    </div>
                    {tab === 'upcoming' && event.status !== 'CANCELLED' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleParticipate(event.id, 'CONFIRMED')}
                          className={`p-2 rounded-lg focus-ring ${event.myStatus === 'CONFIRMED' ? 'bg-success-muted text-success' : 'bg-surface-secondary text-secondary hover:text-success hover:bg-success-muted'}`}
                          aria-label="Confirm attendance">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleParticipate(event.id, 'DECLINED')}
                          className={`p-2 rounded-lg focus-ring ${event.myStatus === 'DECLINED' ? 'bg-error-muted text-error' : 'bg-surface-secondary text-secondary hover:text-error hover:bg-error-muted'}`}
                          aria-label="Decline attendance">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create Event Modal */}
        <AnimatePresence>
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-surface-elevated rounded-xl border border-theme shadow-theme-xl p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold text-primary mb-4">New Event</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Event title" className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring" />
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Description (optional)" className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring resize-none" />
                  <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring" />
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)" className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring" />
                  <input value={eventType} onChange={e => setEventType(e.target.value)} placeholder="Event type (optional)" className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring" />
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 text-sm text-secondary focus-ring rounded-lg">Cancel</button>
                    <button type="submit" disabled={creating} className="flex-1 px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring disabled:opacity-50">
                      {creating ? 'Creating...' : 'Create Event'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}
