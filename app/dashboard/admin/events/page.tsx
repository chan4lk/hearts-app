'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BsPlus, BsSearch, BsX, BsCalendarEvent, BsFilter } from 'react-icons/bs';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import EventStatsSection from './components/StatsSection';
import { EventFormModal } from '@/app/components/events/EventFormModal';
import { EventsTable } from '@/app/components/events/EventsTable';
import { EventDetailsModal } from '@/app/components/events/EventDetailsModal';

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  location?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  status: string;
  createdBy: { name: string };
  participations: any[];
}

export default function AdminEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [eventType, setEventType] = useState(searchParams.get('eventType') || '');
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status && { status }),
        ...(eventType && { eventType }),
      });

      const response = await fetch(`/api/admin/events?${params}`);
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
  }, [page, search, status, eventType]);

  const handleCreateEvent = async (formData: any) => {
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create event');

      toast.success('Event created successfully');
      fetchEvents();
      setIsFormOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  const handleUpdateEvent = async (formData: any) => {
    if (!editingEvent) return;

    try {
      const response = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update event');

      toast.success('Event updated successfully');
      fetchEvents();
      setIsFormOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleView = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setEventType('');
    setPage(1);
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

  return (
    <DashboardLayout type="admin">
      <div className="fixed inset-0 top-16 left-0 md:left-64 right-0 bottom-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 pb-3">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-xl p-6 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Event Management
                  </h2>
                  <p className="text-white/90 text-xs">Create and manage upcoming events for your organization</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingEvent(null);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 font-semibold text-white shadow-lg shadow-white/10 transition-all border border-white/20 whitespace-nowrap"
                >
                  <BsPlus className="text-lg" /> Create Event
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Stats Section - Fixed */}
          <div className="flex-shrink-0 pb-3">
            <EventStatsSection
              events={{
                total: pagination.total || 0,
                scheduled: events.filter((e) => e.status === 'SCHEDULED').length,
                ongoing: events.filter((e) => e.status === 'ONGOING').length,
                completed: events.filter((e) => e.status === 'COMPLETED').length,
                cancelled: events.filter((e) => e.status === 'CANCELLED').length,
              }}
            />
          </div>

          {/* Filters - Fixed */}
          <div className="flex-shrink-0 pb-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border-2 border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 p-4 backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <div className="p-1.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600">
                    <BsSearch className="w-3.5 h-3.5 text-white" />
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
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 hover:border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 placeholder-gray-400 transition-all duration-200 text-sm font-medium"
                />
              </div>

              {/* Event Type Select */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <div className="p-1.5 rounded-md bg-gradient-to-r from-purple-500 to-pink-600">
                    <BsCalendarEvent className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <select
                  value={eventType}
                  onChange={(e) => {
                    setEventType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 hover:border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200 text-sm font-medium appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center'
                  }}
                >
                  <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Event Types</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type} style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <div className="p-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600">
                    <BsFilter className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 hover:border-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 text-sm font-medium appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center'
                  }}
                >
                  <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Statuses</option>
                  <option value="SCHEDULED" style={{ backgroundColor: '#1f2937', color: '#93c5fd' }}>Scheduled</option>
                  <option value="ONGOING" style={{ backgroundColor: '#1f2937', color: '#86efac' }}>Ongoing</option>
                  <option value="COMPLETED" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Completed</option>
                  <option value="CANCELLED" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>Cancelled</option>
                </select>
              </div>

              {/* Clear Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearFilters}
                className="rounded-lg border border-white/20 px-4 py-2.5 text-white hover:bg-white/10 hover:border-white/30 transition-all font-medium text-sm"
              >
                Clear Filters
              </motion.button>
            </div>
          </motion.div>
          </div>

          {/* Events Table - Scrollable Container */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col h-full">
                <div className="p-4 flex flex-col flex-1 overflow-hidden min-h-0">
                  <EventsTable
                    events={events}
                    onEdit={handleEdit}
                    onDelete={handleDeleteEvent}
                    onView={handleView}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </motion.div>

            {/* Pagination - Fixed at bottom */}
            {pagination.pages > 1 && (
              <div className="flex-shrink-0 pt-4 pb-3 border-t border-gray-700/50">
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
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                        (p) => (
                          <motion.button
                            key={p}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setPage(p)}
                            className={`rounded-lg px-3 py-1 text-sm font-medium transition-all ${
                              page === p
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                                : 'border border-white/20 text-white hover:bg-white/10'
                            }`}
                          >
                            {p}
                          </motion.button>
                        )
                      )}
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

        {/* Modals */}
        <EventFormModal
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
          initialData={editingEvent}
        />
        <EventDetailsModal
          isOpen={isDetailsOpen}
          event={selectedEvent}
          onClose={() => setIsDetailsOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
