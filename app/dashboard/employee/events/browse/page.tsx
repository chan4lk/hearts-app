'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BsSearch, BsPlus, BsX, BsCheckLg, BsArrowRight } from 'react-icons/bs';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';

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
    } catch (error) {
      console.error('Error fetching events:', error);
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
    } catch (error) {
      console.error('Error registering:', error);
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
    } catch (error) {
      console.error('Error cancelling registration:', error);
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
      TOASTMASTERS: 'bg-cyan-500/20 text-cyan-300',
      CODECRUNCH: 'bg-orange-500/20 text-orange-300',
      HEART_TALKS: 'bg-pink-500/20 text-pink-300',
      BISTEC_CLUB: 'bg-cyan-500/20 text-cyan-300',
      WORKSHOP: 'bg-teal-500/20 text-teal-300',
      TRAINING: 'bg-green-500/20 text-green-300',
      default: 'bg-white/10 text-white',
    };
    return colors[type] || colors.default;
  };

  const isCapacityFull = (event: Event): boolean =>
    !!(event.capacity && event.participantCount >= event.capacity);

  return (
    <DashboardLayout type="employee">
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white">Browse Events</h1>
            <p className="mt-2 text-white/60">
              Discover and register for upcoming events in your organization
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:border-white/20 transition-colors">
                <BsSearch className="text-white/50" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-transparent text-white placeholder-white/50 focus:outline-none"
                />
              </div>

              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:border-white/20 focus:outline-none transition-colors"
              >
                <option value="">All Event Types</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSearch('');
                  setEventType('');
                  setPage(1);
                }}
                className="rounded-lg border border-white/20 px-3 py-2 text-white hover:bg-white/10 transition-all"
              >
                Clear Filters
              </motion.button>
            </div>
          </motion.div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/2 p-5 backdrop-blur-xl hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 transition-all cursor-default"
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-300 border border-green-500/30">
                      <BsCheckLg /> Registered
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-300 transition">
                  {event.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-white/70 mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* Details */}
                <div className="mb-4 space-y-2 text-sm text-white/60">
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
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-teal-500 to-cyan-500'
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
                        ? 'bg-gray-500/20 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 shadow-lg shadow-cyan-500/20'
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
                    className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50 transition-all hover:border-red-500/50"
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
          </div>

          {/* Empty State */}
          {events.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl"
            >
              <div className="inline-flex p-4 bg-teal-500/10 rounded-full mb-4">
                <BsArrowRight className="text-5xl text-teal-400/50" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
              <p className="text-white/60">
                Try adjusting your filters or check back later
              </p>
            </motion.div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-white/60">
                Showing {events.length} of {pagination.total} events
              </p>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-white/20 px-4 py-2 text-white hover:bg-white/10 disabled:opacity-50 transition-all"
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
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                          : 'border border-white/20 text-white hover:bg-white/10'
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
                  className="rounded-lg border border-white/20 px-4 py-2 text-white hover:bg-white/10 disabled:opacity-50 transition-all"
                >
                  Next
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
