'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';

import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';
import { BsPlus, BsSearch, BsCalendarEvent, BsFilter, BsCheckCircle, BsClock, BsArrowCounterclockwise } from 'react-icons/bs';
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

function AdminEventsContent() {
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
      <div className="fixed inset-0 top-16 left-0 md:left-60 right-0 bottom-0 bg-surface-primary flex flex-col overflow-hidden z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none bg-grid" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden">
          {/* Toolbar */}
          <div className="flex-shrink-0 pb-3">
            <PageToolbar
              searchValue={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              searchPlaceholder="Search events..."
              actions={[
                {
                  label: 'Create Event',
                  onClick: () => {
                    setEditingEvent(null);
                    setIsFormOpen(true);
                  },
                  variant: 'primary',
                },
              ]}
              hasActiveFilters={status !== '' || eventType !== ''}
              onClearFilters={handleClearFilters}
            >
              <FilterSelect
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                options={[
                  { value: 'SCHEDULED', label: 'Scheduled' },
                  { value: 'ONGOING', label: 'Ongoing' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
                placeholder="All Statuses"
              />
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

          {/* Stats Section - Fixed */}
          <div className="flex-shrink-0 pb-3">
            {(() => {
              const scheduledCount = events.filter(e => e.status === 'SCHEDULED').length;
              const ongoingCount = events.filter(e => e.status === 'ONGOING').length;
              const completedCount = events.filter(e => e.status === 'COMPLETED').length;
              
              const statItems: StatItem[] = [
                {
                  title: 'Total Events',
                  value: pagination.total || 0,
                  icon: <BsCalendarEvent className="w-4 h-4" />,
                  gradient: 'from-blue-500 to-cyan-500',
                  bgColor: 'bg-blue-500/10',
                  borderColor: 'border-blue-500/30'
                },
                {
                  title: 'Scheduled',
                  value: scheduledCount,
                  icon: <BsClock className="w-4 h-4" />,
                  gradient: 'from-amber-500 to-orange-500',
                  bgColor: 'bg-amber-500/10',
                  borderColor: 'border-amber-500/30'
                },
                {
                  title: 'Completed',
                  value: completedCount,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                  gradient: 'from-emerald-500 to-teal-500',
                  bgColor: 'bg-emerald-500/10',
                  borderColor: 'border-emerald-500/30'
                }
              ];
              return <StatsSection stats={statItems} variant="auto" />;
            })()}
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
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-cyan-500/30'
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

export default function AdminEventsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout type="admin">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white/60">Loading events...</div>
        </div>
      </DashboardLayout>
    }>
      <AdminEventsContent />
    </Suspense>
  );
}
