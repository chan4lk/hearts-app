'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BsPlus, BsSearch, BsX } from 'react-icons/bs';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-white">Event Management</h1>
              <p className="mt-2 text-white/60">
                Create and manage upcoming events for your organization
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingEvent(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-semibold text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 transition-all"
            >
              <BsPlus className="text-xl" /> Create Event
            </motion.button>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none hover:border-white/20 transition-colors"
              >
                <option value="">All Event Types</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none hover:border-white/20 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearFilters}
                className="rounded-lg border border-white/20 px-3 py-2 text-white hover:bg-white/10 transition-all"
              >
                Clear Filters
              </motion.button>
            </div>
          </motion.div>

          {/* Events Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <EventsTable
              events={events}
              onEdit={handleEdit}
              onDelete={handleDeleteEvent}
              onView={handleView}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
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
            )}
          </motion.div>
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
