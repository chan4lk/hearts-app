'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Check, X, Plus, Users, Clock } from 'lucide-react';

interface EventItem {
  id: string; title: string; description: string | null; dateTime: string;
  location: string | null; eventType: string | null; status: string;
  myStatus: string | null; _count: { participations: number };
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
  const filtered = events.filter(e => tab === 'upcoming' ? new Date(e.dateTime) >= now : new Date(e.dateTime) < now);

  const handleParticipate = async (eventId: string, status: 'CONFIRMED' | 'DECLINED') => {
    await fetch(`/api/events/${eventId}/participate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await fetchEvents();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, dateTime, location, eventType }) });
    if (res.ok) { setShowCreate(false); setTitle(''); setDescription(''); setDateTime(''); setLocation(''); setEventType(''); await fetchEvents(); }
    setCreating(false);
  };

  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <DashboardLayout type="employee">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Calendar className="w-6 h-6 text-accent" /> Events
            </h1>
            <p className="text-sm text-secondary mt-0.5">Company events and activities</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-[rgb(var(--color-text-inverse))] rounded-xl text-sm font-medium hover:opacity-90 focus-ring shadow-sm">
              <Plus className="w-4 h-4" /> New Event
            </button>
          )}
        </div>

        <div className="flex gap-1.5">
          {(['upcoming', 'past'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold focus-ring transition-all ${
                tab === t ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-sm' : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
              }`}>
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 bg-surface-elevated rounded-2xl border border-theme animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-surface-elevated rounded-2xl border border-theme">
            <div className="w-20 h-20 rounded-full bg-accent-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">No {tab} events</h3>
            <p className="text-sm text-secondary">{isAdmin ? 'Create an event to get started' : 'Check back soon!'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((event, i) => {
              const dt = new Date(event.dateTime);
              const isPast = dt < now;
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-surface-elevated rounded-2xl border border-theme shadow-theme-sm hover:shadow-theme-md transition-all overflow-hidden">
                  <div className="flex">
                    {/* Date badge */}
                    <div className="w-20 flex-shrink-0 bg-accent-muted flex flex-col items-center justify-center p-3 border-r border-theme">
                      <span className="text-2xs font-semibold text-accent uppercase">{dt.toLocaleDateString('en', { month: 'short' })}</span>
                      <span className="text-2xl font-bold text-primary leading-tight">{dt.getDate()}</span>
                      <span className="text-2xs text-tertiary">{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-primary">{event.title}</h3>
                          {event.eventType && <span className="text-2xs text-tertiary bg-surface-secondary px-2 py-0.5 rounded-full">{event.eventType}</span>}
                          {event.status === 'CANCELLED' && <span className="text-2xs font-semibold text-error bg-error-muted px-2 py-0.5 rounded-full">Cancelled</span>}
                          {event.myStatus === 'CONFIRMED' && <span className="text-2xs font-semibold text-success bg-success-muted px-2 py-0.5 rounded-full">Confirmed</span>}
                          {event.myStatus === 'DECLINED' && <span className="text-2xs font-semibold text-error bg-error-muted px-2 py-0.5 rounded-full">Declined</span>}
                        </div>
                        {event.description && <p className="text-xs text-secondary line-clamp-1 mb-1">{event.description}</p>}
                        <div className="flex items-center gap-3 text-2xs text-tertiary">
                          {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>}
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event._count.participations} invited</span>
                        </div>
                      </div>

                      {/* Confirm/Decline */}
                      {!isPast && event.status !== 'CANCELLED' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => handleParticipate(event.id, 'CONFIRMED')}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center focus-ring transition-all ${
                              event.myStatus === 'CONFIRMED' ? 'bg-success text-white shadow-sm' : 'bg-surface-secondary text-secondary hover:bg-success-muted hover:text-success'
                            }`} aria-label="Confirm">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleParticipate(event.id, 'DECLINED')}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center focus-ring transition-all ${
                              event.myStatus === 'DECLINED' ? 'bg-error text-white shadow-sm' : 'bg-surface-secondary text-secondary hover:bg-error-muted hover:text-error'
                            }`} aria-label="Decline">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-surface-elevated rounded-2xl border border-theme shadow-theme-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2"><Calendar className="w-5 h-5 text-accent" /> New Event</h2>
                  <button onClick={() => setShowCreate(false)} className="text-secondary hover:text-primary focus-ring rounded-lg p-1"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Event title" className="input-base" />
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Description (optional)" className="input-textarea" />
                  <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required className="input-base" />
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)" className="input-base" />
                  <input value={eventType} onChange={e => setEventType(e.target.value)} placeholder="Event type (optional)" className="input-base" />
                  <p className="text-xs text-tertiary">All active employees will be invited automatically.</p>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-secondary hover:text-primary focus-ring rounded-xl border border-theme">Cancel</button>
                    <button type="submit" disabled={creating} className="flex-1 px-4 py-2.5 bg-accent text-[rgb(var(--color-text-inverse))] rounded-xl text-sm font-medium focus-ring disabled:opacity-50 shadow-sm">{creating ? 'Creating...' : 'Create Event'}</button>
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
