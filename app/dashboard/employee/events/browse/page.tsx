'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BsSearch, BsPlus, BsX, BsCheckLg, BsArrowRight, BsCalendar, BsFilter } from 'react-icons/bs';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  location?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  registrationDeadline: string;
  status: string;
  createdBy: { name: string; email: string };
  participantCount: number;
  userParticipation?: { participationStatus: string } | null;
}

export default function BrowseEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [registering, setRegistering] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        status: 'SCHEDULED,ONGOING',
        ...(search && { search }),
        ...(eventType && { eventType }),
      });

      const response = await fetch(`/api/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (error) { // handled silently
      toast.error('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, search, eventType]);

  const handleRegister = async (eventId: string) => {
    try {
      setRegistering(eventId);
      const response = await fetch('/api/events/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          participationStatus: 'REGISTERED',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to register');
      }

      toast.success('Successfully registered for the event');
      fetchEvents();
    } catch (error) { // handled silently
      toast.error(
        error instanceof Error ? error.message : 'Failed to register'
      );
    } finally {
      setRegistering(null);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    try {
      setRegistering(eventId);
      const response = await fetch('/api/events/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          participationStatus: 'CANCELLED',
        }),
      });

      if (!response.ok) throw new Error('Failed to cancel registration');

      toast.success('Registration cancelled');
      fetchEvents();
    } catch (error) { // handled silently
      toast.error('Failed to cancel registration');
    } finally {
      setRegistering(null);
    }
  };

  const eventTypes = [
    'TOASTMASTERS',
    'CODECRUNCH',
    'HEART_TALKS',
    'BISTEC_CLUB',
    'WORKSHOP',
    'TRAINING',
    'SEMINAR',
    'NETWORKING',
    'TEAM_BUILDING',
    'OTHER',
  ];

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      TOASTMASTERS: 'bg-info-muted text-info',
      CODECRUNCH: 'bg-rating-2 text-rating-2',
      HEART_TALKS: 'bg-[rgb(var(--color-cat-kpi))]/20 text-pink-300',
      BISTEC_CLUB: 'bg-info-muted text-info',
      WORKSHOP: 'bg-cat-personal text-cat-personal',
      TRAINING: 'bg-cat-training text-cat-training',
      default: 'bg-white/10 text-[rgb(var(--color-text-inverse))]',
    };
    return colors[type] || colors.default;
  };

  const isCapacityFull = (event: Event): boolean =>
    !!(event.capacity && event.participantCount >= event.capacity);

  return (
    <DashboardLayout type="employee">
      <div className="fixed inset-0 top-16 left-0 md:left-60 right-0 bottom-0 bg-surface-primary flex flex-col overflow-hidden z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none bg-grid" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden">
          {/* Stats Section */}
          <div className="flex-shrink-0 pb-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Available', value: events.length, icon: <BsSearch className="w-4 h-4" />, color: 'text-info' },
                { label: 'Open Seats', value: events.filter(e => !isCapacityFull(e)).length, icon: <BsCalendar className="w-4 h-4" />, color: 'text-success' },
                { label: 'Full', value: events.filter(e => isCapacityFull(e)).length, icon: <BsCheckLg className="w-4 h-4" />, color: 'text-cat-technical dark:text-cat-technical' },
                { label: 'Pages', value: pagination.pages, icon: <BsFilter className="w-4 h-4" />, color: 'text-warning' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-surface-elevated border border-theme">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
                  <div>
                    <div className="text-lg font-bold text-primary">{stat.value}</div>
                    <div className="text-xs font-medium text-secondary">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Toolbar + Filters */}
          <div className="flex-shrink-0 pb-3">
            <PageToolbar
              searchValue={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              searchPlaceholder="Search events..."
              hasActiveFilters={eventType !== ''}
              onClearFilters={() => {
                setSearch('');
                setEventType('');
                setPage(1);
              }}
            >
              <FilterSelect
                value={eventType}
                onChange={(value) => {
                  setEventType(value);
                  setPage(1);
                }}
                options={eventTypes.map(type => ({ value: type, label: type.replace(/_/g, ' ') }))}
                placeholder="All Event Types"
              />
            </PageToolbar>
          </div>

          {/* Events Grid - Scrollable Container */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex flex-col overflow-y-auto min-h-0"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 pb-4">
                {events.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group rounded-xl border border-theme bg-surface-elevated p-5 backdrop-blur-xl hover:border-[rgb(var(--color-event-social))]/50 hover:shadow-lg hover:shadow-teal-500/10 transition-all cursor-default"
                  >
                {/* Event Type Badge */}
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEventTypeColor(
                      event.eventType
                    )}`}
                  >
                    {event.eventType.replace(/_/g, ' ')}
                  </span>
                  {event.userParticipation && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cat-training px-2 py-0.5 text-xs font-medium text-cat-training border border-[rgb(var(--color-cat-training))]/30">
                      <BsCheckLg /> Registered
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-[rgb(var(--color-text-inverse))] mb-2 group-hover:text-cat-personal transition">
                  {event.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[rgb(var(--color-text-inverse))]/70 mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* Details */}
                <div className="mb-4 space-y-2 text-sm text-[rgb(var(--color-text-inverse))]/60">
                  <p>
                    📅{' '}
                    {new Date(event.startDate).toLocaleDateString() && new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {event.location && <p>📍 {event.location}</p>}
                  <p>
                    👥 {event.participantCount}
                    {event.capacity ? `/${event.capacity}` : ''} participants
                  </p>
                </div>

                {/* Capacity indicator */}
                {event.capacity && (
                  <div className="mb-4 w-full rounded-full bg-white/10 h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          (event.participantCount / event.capacity) * 100,
                          100
                        )}%`,
                      }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-2 rounded-full transition-all ${
                        isCapacityFull(event)
                          ? 'bg-[rgb(var(--color-error))]'
                          : 'bg-gradient-to-r from-[rgb(var(--color-event-social))] to-cyan-500'
                      }`}
                    />
                  </div>
                )}

                {/* Action Button */}
                {!event.userParticipation ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRegister(event.id)}
                    disabled={registering === event.id || isCapacityFull(event)}
                    className={`w-full rounded-lg px-4 py-2 font-semibold transition-all ${
                      isCapacityFull(event)
                        ? 'bg-surface-secondary text-secondary cursor-not-allowed'
                        : 'bg-accent hover:opacity-90 text-[rgb(var(--color-text-inverse))] hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 shadow-[rgb(var(--color-info))]/20'
                    }`}
                  >
                    {registering === event.id ? (
                      'Registering...'
                    ) : isCapacityFull(event) ? (
                      'Capacity Full'
                    ) : (
                      <>
                        <BsPlus className="inline mr-1" /> Register
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCancelRegistration(event.id)}
                    disabled={registering === event.id}
                    className="w-full rounded-lg border border-[rgb(var(--color-error))]/30 bg-error-muted px-4 py-2 font-semibold text-error hover:bg-error-muted disabled:opacity-50 transition-all hover:border-[rgb(var(--color-error))]/50"
                  >
                    {registering === event.id ? (
                      'Cancelling...'
                    ) : (
                      <>
                        <BsX className="inline mr-1" /> Cancel Registration
                      </>
                    )}
                  </motion.button>
                    )}
                  </motion.div>
                ))}

                {/* Empty State */}
                {events.length === 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-theme bg-surface-elevated p-12 text-center backdrop-blur-xl col-span-full"
                  >
                    <div className="inline-flex p-4 bg-cat-personal rounded-full mb-4">
                      <BsArrowRight className="text-5xl text-cat-personal/50" />
                    </div>
                    <h3 className="text-xl font-semibold text-[rgb(var(--color-text-inverse))] mb-2">No events found</h3>
                    <p className="text-[rgb(var(--color-text-inverse))]/60">
                      Try adjusting your filters or check back later
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Pagination - Fixed at bottom */}
            {pagination.pages > 1 && (
              <div className="flex-shrink-0 pt-4 pb-3 border-t border-theme mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[rgb(var(--color-text-inverse))]/60">
                    Showing {events.length} of {pagination.total} events
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-white/20 px-4 py-2 text-[rgb(var(--color-text-inverse))] hover:bg-surface-tertiary disabled:opacity-50 transition-all"
                    >
                      Previous
                    </motion.button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                        <motion.button
                          key={p}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPage(p)}
                          className={`rounded-lg px-3 py-1 text-sm font-medium transition-all ${
                            page === p
                              ? 'bg-accent hover:opacity-90 text-[rgb(var(--color-text-inverse))] shadow-[rgb(var(--color-info))]/30'
                              : 'border border-white/20 text-[rgb(var(--color-text-inverse))] hover:bg-surface-tertiary'
                          }`}
                        >
                          {p}
                        </motion.button>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                      disabled={page === pagination.pages}
                      className="rounded-lg border border-white/20 px-4 py-2 text-[rgb(var(--color-text-inverse))] hover:bg-surface-tertiary disabled:opacity-50 transition-all"
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
