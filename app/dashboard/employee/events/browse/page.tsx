'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BsSearch, BsPlus, BsX, BsCheckLg, BsArrowRight, BsCalendar, BsFilter } from 'react-icons/bs';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Filters from '@/app/components/shared/Filters';

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
      <div className="fixed inset-0 top-16 left-0 md:left-64 right-0 bottom-0 bg-surface-primary flex flex-col overflow-hidden z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none bg-grid" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 pb-3">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-xl p-4 shadow-lg bg-gradient-to-r from-teal-600 to-cyan-600"
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              <div className="relative">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Browse Events
                  </h2>
                  <p className="text-white/90 text-xs">Discover and register for upcoming events in your organization</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Section - Fixed */}
          <div className="flex-shrink-0 pb-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0 * 0.05 }}
                className="relative overflow-hidden bg-blue-500/10 backdrop-blur-sm rounded-xl p-3 border-2 border-blue-500/30 hover:border-opacity-60 transition-all duration-300 group hover:shadow-xl hover:scale-105 flex items-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg flex-shrink-0">
                    <BsSearch className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl font-bold text-white">{events.length}</div>
                    <div className="text-xs font-medium text-gray-400">Available</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1 * 0.05 }}
                className="relative overflow-hidden bg-emerald-500/10 backdrop-blur-sm rounded-xl p-3 border-2 border-emerald-500/30 hover:border-opacity-60 transition-all duration-300 group hover:shadow-xl hover:scale-105 flex items-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg flex-shrink-0">
                    <BsCalendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl font-bold text-white">{events.filter(e => !isCapacityFull(e)).length}</div>
                    <div className="text-xs font-medium text-gray-400">Open Seats</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 2 * 0.05 }}
                className="relative overflow-hidden bg-purple-500/10 backdrop-blur-sm rounded-xl p-3 border-2 border-purple-500/30 hover:border-opacity-60 transition-all duration-300 group hover:shadow-xl hover:scale-105 flex items-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg flex-shrink-0">
                    <BsCheckLg className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl font-bold text-white">{events.filter(e => isCapacityFull(e)).length}</div>
                    <div className="text-xs font-medium text-gray-400">Full</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 3 * 0.05 }}
                className="relative overflow-hidden bg-teal-500/10 backdrop-blur-sm rounded-xl p-3 border-2 border-teal-500/30 hover:border-opacity-60 transition-all duration-300 group hover:shadow-xl hover:scale-105 flex items-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg flex-shrink-0">
                    <BsFilter className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl font-bold text-white">{pagination.pages}</div>
                    <div className="text-xs font-medium text-gray-400">Pages</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex-shrink-0 pb-3">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border-2 border-gray-700/50">
              <div className="flex gap-3 items-start justify-between">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md w-full">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
                    <div className="p-1.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500">
                      <BsSearch className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium placeholder-gray-400 transition-all duration-200 hover:border-opacity-70 hover:shadow-sm"
                  />
                </div>

                {/* Shared Filters */}
                <Filters
                  filters={[
                    {
                      id: 'eventType',
                      label: 'Event Type',
                      value: eventType,
                      onChange: (value: string) => {
                        setEventType(value);
                        setPage(1);
                      },
                      options: [
                        { value: '', label: 'All Event Types' },
                        ...eventTypes.map(type => ({ value: type, label: type.replace(/_/g, ' ') }))
                      ],
                      icon: <BsCalendar className="w-3 h-3 text-white" />,
                      gradient: 'from-teal-500 to-cyan-600'
                    }
                  ]}
                  onClear={() => {
                    setSearch('');
                    setEventType('');
                    setPage(1);
                  }}
                />
              </div>
            </div>
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
                    className="group rounded-xl border border-theme bg-surface-elevated p-5 backdrop-blur-xl hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 transition-all cursor-default"
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

                {/* Empty State */}
                {events.length === 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-theme bg-surface-elevated p-12 text-center backdrop-blur-xl col-span-full"
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
              </div>
            </motion.div>

            {/* Pagination - Fixed at bottom */}
            {pagination.pages > 1 && (
              <div className="flex-shrink-0 pt-4 pb-3 border-t border-gray-700/50 mt-4">
                <div className="flex items-center justify-between">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
