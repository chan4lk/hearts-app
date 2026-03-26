'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';
import { PageHeader } from '@/app/components/shared/PageHeader';
import MetricStrip, { Metric } from '@/app/components/shared/MetricStrip';
import { useToast } from '@/app/components/shared/Toast';

import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';
import { BsPlus } from 'react-icons/bs';
import { EventFormModal } from '@/app/components/events/EventFormModal';
import { EventsTable } from '@/app/components/events/EventsTable';
import { EventDetailsModal } from '@/app/components/events/EventDetailsModal';
import { usePagination, useModalState } from '@/app/hooks';

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
  const toast = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formModal = useModalState<Event>();
  const detailsModal = useModalState<Event>();
  const { page, setPage } = usePagination({ initialPage: parseInt(searchParams.get('page') || '1') });
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
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
      formModal.close();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateEvent = async (formData: any) => {
    if (!formModal.data) return;

    try {
      const response = await fetch(`/api/admin/events/${formModal.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update event');

      toast.success('Event updated successfully');
      fetchEvents();
      formModal.close();
    } catch (error) {
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
      toast.error('Failed to delete event');
    }
  };

  const handleEdit = (event: Event) => {
    formModal.open(event);
  };

  const handleView = (event: Event) => {
    detailsModal.open(event);
  };

  const handleCloseForm = () => {
    formModal.close();
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

  if (isLoading) {
    return (
      <DashboardLayout type="admin">
        <LoadingSkeleton variant="page" />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout type="admin">
        <ErrorState message={error} onRetry={() => { setError(null); fetchEvents(); }} />
      </DashboardLayout>
    );
  }

  if (events.length === 0 && !search && !status && !eventType) {
    return (
      <DashboardLayout type="admin">
        <EmptyState title="No events found" description="There are no events yet. Create your first event to get started." actionLabel="Create Event" onAction={() => { formModal.open(); }} />
      </DashboardLayout>
    );
  }

  // Single-pass count instead of 3 separate .filter() calls
  const sc: Record<string, number> = {};
  for (const e of events) sc[e.status] = (sc[e.status] || 0) + 1;
  const scheduledCount = sc['SCHEDULED'] || 0;
  const ongoingCount = sc['ONGOING'] || 0;
  const completedCount = sc['COMPLETED'] || 0;

  const metrics: Metric[] = [
    {
      label: 'Total Events',
      value: pagination.total || 0,
      color: 'accent',
    },
    {
      label: 'Scheduled',
      value: scheduledCount,
      color: 'info',
    },
    {
      label: 'Ongoing',
      value: ongoingCount,
      color: 'warning',
    },
    {
      label: 'Completed',
      value: completedCount,
      color: 'success',
    }
  ];

  return (
    <DashboardLayout type="admin">
      <div className="fixed inset-0 top-14 left-0 md:left-56 right-0 bottom-0 bg-surface-primary flex flex-col overflow-hidden z-0">
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden space-y-6">
          {/* Page Header */}
          <PageHeader
            title="Event Management"
            description="Create, schedule, and manage organizational events"
            badge="Admin"
          />

          {/* Metric Strip */}
          <MetricStrip metrics={metrics} />

          {/* Toolbar */}
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
                  formModal.open();
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

          {/* Events Table - Scrollable Container */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="bg-surface-elevated rounded-2xl border border-theme overflow-hidden shadow-theme-sm flex flex-col h-full">
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
            </div>

            {/* Pagination - Fixed at bottom */}
            {pagination.pages > 1 && (
              <div className="flex-shrink-0 pt-4 pb-3 border-t border-theme">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary">
                    Showing {events.length} of {pagination.total} events
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="rounded-xl border border-theme px-4 py-2 text-secondary hover:bg-surface-tertiary hover:text-primary disabled:opacity-50 transition-all duration-200 focus-ring"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`rounded-xl px-3 py-1 text-sm font-medium transition-all duration-200 focus-ring ${
                              page === p
                                ? 'bg-accent hover:opacity-90 text-[rgb(var(--color-text-inverse))] shadow-theme-sm'
                                : 'border border-theme text-secondary hover:bg-surface-tertiary hover:text-primary'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                      disabled={page === pagination.pages}
                      className="rounded-xl border border-theme px-4 py-2 text-secondary hover:bg-surface-tertiary hover:text-primary disabled:opacity-50 transition-all duration-200 focus-ring"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modals — outside fixed container for correct z-index */}
      <EventFormModal
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSubmit={formModal.data ? handleUpdateEvent : handleCreateEvent}
        initialData={formModal.data}
      />
      <EventDetailsModal
        isOpen={detailsModal.isOpen}
        event={detailsModal.data}
        onClose={detailsModal.close}
      />
    </DashboardLayout>
  );
}

export default function AdminEventsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout type="admin">
        <LoadingSkeleton variant="page" />
      </DashboardLayout>
    }>
      <AdminEventsContent />
    </Suspense>
  );
}
