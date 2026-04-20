'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Check, X, Users, Leaf, Drumstick } from 'lucide-react';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import PageTitle from '@/app/components/shared/PageTitle';
import EmptyState2 from '@/app/components/shared/EmptyState2';

type Status = 'PENDING' | 'CONFIRMED' | 'DECLINED';
type Meal = 'NONE' | 'VEG' | 'NON_VEG';

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  dateTime: string;
  location: string | null;
  eventType: string | null;
  status: string;
  myStatus: Status | null;
  myMealPreference: Meal;
  _count: { participations: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const flashMsg = (type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3000);
  };

  const fetchEvents = useCallback(async () => {
    const res = await fetch('/api/events');
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const now = new Date();
  const filtered = events.filter((e) =>
    tab === 'upcoming' ? new Date(e.dateTime) >= now : new Date(e.dateTime) < now
  );

  // Optimistic updater so the UI doesn't feel sluggish
  const patchLocal = (eventId: string, patch: Partial<EventItem>) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...patch } : e)));
  };

  const handleParticipate = async (
    eventId: string,
    status: Status,
    meal?: Meal
  ) => {
    const before = events.find((e) => e.id === eventId);
    patchLocal(eventId, {
      myStatus: status,
      ...(meal !== undefined ? { myMealPreference: meal } : {}),
    });

    const res = await fetch(`/api/events/${eventId}/participate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        ...(meal !== undefined ? { mealPreference: meal } : {}),
      }),
    });
    if (!res.ok) {
      if (before) patchLocal(eventId, { myStatus: before.myStatus, myMealPreference: before.myMealPreference });
      const d = await res.json().catch(() => ({}));
      flashMsg('error', d.error || 'Failed to update RSVP');
      return;
    }
    flashMsg('success', status === 'CONFIRMED' ? "You're in!" : status === 'DECLINED' ? 'Declined' : 'Reset to pending');
  };

  const handleMealChange = async (eventId: string, meal: Meal) => {
    const before = events.find((e) => e.id === eventId);
    patchLocal(eventId, { myMealPreference: meal });

    const res = await fetch(`/api/events/${eventId}/participate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealPreference: meal }),
    });
    if (!res.ok) {
      if (before) patchLocal(eventId, { myMealPreference: before.myMealPreference });
      const d = await res.json().catch(() => ({}));
      flashMsg('error', d.error || 'Failed to save meal preference');
      return;
    }
    flashMsg('success', meal === 'VEG' ? 'Veg noted' : meal === 'NON_VEG' ? 'Non-veg noted' : 'Meal cleared');
  };

  return (
    <DashboardLayout type="employee">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageTitle
          title="Events"
          subtitle="Company events and activities"
          icon={Calendar}
          iconColor="--color-accent"
        />

        {flash && (
          <div
            className={`px-4 py-2 rounded-xl text-sm border ${
              flash.type === 'success'
                ? 'bg-success-muted text-success border-theme'
                : 'bg-error-muted text-error border-theme'
            }`}
          >
            {flash.msg}
          </div>
        )}

        <div className="flex gap-1.5">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold focus-ring transition-all ${
                tab === t
                  ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-sm'
                  : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
              }`}
            >
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSkeleton type="cards" count={2} />
        ) : filtered.length === 0 ? (
          <EmptyState2
            icon={Calendar}
            title={`No ${tab} events`}
            description="Check back soon!"
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((event, i) => {
              const dt = new Date(event.dateTime);
              const isPast = dt < now;
              const isCancelled = event.status === 'CANCELLED';
              const canRsvp = !isPast && !isCancelled;
              const showMeal = canRsvp && event.myStatus === 'CONFIRMED';

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card-interactive overflow-hidden"
                >
                  <div className="flex">
                    <div className="w-20 flex-shrink-0 bg-accent-muted flex flex-col items-center justify-center p-3 border-r border-theme">
                      <span className="text-2xs font-semibold text-accent uppercase">
                        {dt.toLocaleDateString('en', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold text-primary leading-tight">
                        {dt.getDate()}
                      </span>
                      <span className="text-2xs text-tertiary">
                        {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex-1 p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-semibold text-primary">{event.title}</h3>
                            {event.eventType && (
                              <span className="text-2xs text-tertiary bg-surface-secondary px-2 py-0.5 rounded-full">
                                {event.eventType}
                              </span>
                            )}
                            {isCancelled && (
                              <span className="text-2xs font-semibold text-error bg-error-muted px-2 py-0.5 rounded-full">
                                Cancelled
                              </span>
                            )}
                            {event.myStatus === 'CONFIRMED' && (
                              <span className="text-2xs font-semibold text-success bg-success-muted px-2 py-0.5 rounded-full">
                                Confirmed
                              </span>
                            )}
                            {event.myStatus === 'DECLINED' && (
                              <span className="text-2xs font-semibold text-error bg-error-muted px-2 py-0.5 rounded-full">
                                Declined
                              </span>
                            )}
                            {event.myStatus === 'PENDING' && !isPast && !isCancelled && (
                              <span className="text-2xs font-semibold text-warning bg-warning-muted px-2 py-0.5 rounded-full">
                                Pending
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-xs text-secondary line-clamp-1 mb-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-2xs text-tertiary flex-wrap">
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {event.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {event._count.participations} invited
                            </span>
                          </div>
                        </div>

                        {canRsvp && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleParticipate(event.id, 'CONFIRMED')}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center focus-ring transition-all ${
                                event.myStatus === 'CONFIRMED'
                                  ? 'bg-success text-[rgb(var(--color-text-inverse))] shadow-sm'
                                  : 'bg-surface-secondary text-secondary hover:bg-success-muted hover:text-success'
                              }`}
                              aria-label="Confirm attendance"
                              title="Confirm"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleParticipate(event.id, 'DECLINED')}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center focus-ring transition-all ${
                                event.myStatus === 'DECLINED'
                                  ? 'bg-error text-[rgb(var(--color-text-inverse))] shadow-sm'
                                  : 'bg-surface-secondary text-secondary hover:bg-error-muted hover:text-error'
                              }`}
                              aria-label="Decline attendance"
                              title="Decline"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {showMeal && (
                        <div className="flex items-center gap-2 pt-2 border-t border-theme">
                          <span className="text-2xs text-tertiary font-semibold">Meal:</span>
                          <button
                            type="button"
                            onClick={() => handleMealChange(event.id, 'VEG')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-semibold focus-ring transition-all ${
                              event.myMealPreference === 'VEG'
                                ? 'bg-success text-[rgb(var(--color-text-inverse))]'
                                : 'bg-surface-secondary text-secondary hover:bg-success-muted hover:text-success'
                            }`}
                            aria-label="Choose vegetarian"
                          >
                            <Leaf className="w-3 h-3" /> Veg
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMealChange(event.id, 'NON_VEG')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-semibold focus-ring transition-all ${
                              event.myMealPreference === 'NON_VEG'
                                ? 'bg-accent text-[rgb(var(--color-text-inverse))]'
                                : 'bg-surface-secondary text-secondary hover:bg-accent-muted hover:text-accent'
                            }`}
                            aria-label="Choose non-vegetarian"
                          >
                            <Drumstick className="w-3 h-3" /> Non-Veg
                          </button>
                          {event.myMealPreference !== 'NONE' && (
                            <button
                              type="button"
                              onClick={() => handleMealChange(event.id, 'NONE')}
                              className="text-2xs text-tertiary hover:text-primary focus-ring rounded px-1"
                              aria-label="Clear meal preference"
                            >
                              clear
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
      <HeartButton />
    </DashboardLayout>
  );
}
