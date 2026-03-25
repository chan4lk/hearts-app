'use client';

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';

import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';
import { BsPlus, BsSearch, BsCalendarEvent, BsFilter, BsCheckCircle, BsClock, BsArrowCounterclockwise, BsCalendar2Week } from 'react-icons/bs';
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
    } catch (error) { // handled silently
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
    } catch (error) { // handled silently
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
    } catch (error) { // handled silently
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
    } catch (error) { // handled silently
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
          {/* Events Hub Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0 mb-4 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[rgb(var(--color-warning))]/8 via-[rgb(var(--color-accent))]/5 to-[rgb(var(--color-success))]/8 border border-theme shadow-theme-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[rgb(var(--color-warning))] via-[rgb(var(--color-accent))] to-[rgb(var(--color-success))]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[rgb(var(--color-warning))]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-warning-muted border border-[rgb(var(--color-warning))]/20 flex items-center justify-center">
                  <BsCalendar2Week className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-primary">Events Hub</h1>
                  <p className="text-xs text-secondary">Create, schedule, and manage organizational events</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-theme">
                  <BsCalendarEvent className="w-3.5 h-3.5 text-secondary" />
                  <span className="text-xs font-medium text-secondary">{pagination.total || 0} Events</span>
                </div>
              </div>
            </div>
          </motion.div>

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
              // Single-pass count instead of 3 separate .filter() calls
              const sc: Record<string, number> = {};
              for (const e of events) sc[e.status] = (sc[e.status] || 0) + 1;
              const scheduledCount = sc['SCHEDULED'] || 0;
              const ongoingCount = sc['ONGOING'] || 0;
              const completedCount = sc['COMPLETED'] || 0;
              
              const statItems: StatItem[] = [
                {
                  title: 'Total Events',
                  value: pagination.total || 0,
                  icon: <BsCalendarEvent className="w-4 h-4" />,
                },
                {
                  title: 'Scheduled',
                  value: scheduledCount,
                  icon: <BsClock className="w-4 h-4" />,
                },
                {
                  title: 'Completed',
                  value: completedCount,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                }
              ];
              return <StatsSection stats={statItems} />;
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
              <div className="relative bg-surface-elevated rounded-2xl border border-theme overflow-hidden shadow-theme-sm hover:shadow-theme-lg transition-all duration-300 flex flex-col h-full">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-warning))]/50 via-[rgb(var(--color-accent))]/50 to-[rgb(var(--color-success))]/50" />
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
              <div className="flex-shrink-0 pt-4 pb-3 border-t border-theme">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary">
                    Showing {events.length} of {pagination.total} events
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="rounded-xl border border-theme px-4 py-2 text-secondary hover:bg-surface-tertiary hover:text-primary disabled:opacity-50 transition-all duration-300 focus-ring"
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
                            className={`rounded-xl px-3 py-1 text-sm font-medium transition-all duration-300 focus-ring ${
                              page === p
                                ? 'bg-accent hover:opacity-90 text-[rgb(var(--color-text-inverse))] shadow-theme-sm'
                                : 'border border-theme text-secondary hover:bg-surface-tertiary hover:text-primary'
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
                      className="rounded-xl border border-theme px-4 py-2 text-secondary hover:bg-surface-tertiary hover:text-primary disabled:opacity-50 transition-all duration-300 focus-ring"
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
          <div className="text-[rgb(var(--color-text-inverse))]/60">Loading events...</div>
        </div>
      </DashboardLayout>
    }>
      <AdminEventsContent />
    </Suspense>
  );
}
