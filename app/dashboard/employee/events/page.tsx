'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BsSearch, BsCalendarPlus, BsArrowRight, BsFilter, BsCheckLg } from 'react-icons/bs';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { useToast } from '@/app/components/shared/Toast';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';
import { EventParticipationCard } from '@/app/components/events/EventParticipationCard';
import { FeedbackModal } from '@/app/components/events/FeedbackModal';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

interface Participation {
  id: string;
  eventId: string;
  participationStatus: string;
  hoursContributed?: number;
  feedback?: string;
  registeredAt: string;
  event: any;
}

function EmployeeEventsContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  const fetchParticipations = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(status && { status }),
      });

      const response = await fetch(`/api/events/participation?${params}`);
      if (!response.ok) throw new Error('Failed to fetch participations');

      const data = await response.json();
      setParticipations(data.participations);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch your events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipations();
  }, [page, status]);

  const handleUpdateStatus = async (eventId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/events/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          participationStatus: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Attendance updated to ${newStatus}`);
      fetchParticipations();
    } catch (error) {
      toast.error('Failed to update participation status');
    }
  };

  const handleUpdateRole = async (
    eventId: string,
    data: { toastmasterRole?: string; heartsTalkRole?: string }
  ) => {
    try {
      const response = await fetch('/api/events/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...data }),
      });

      if (!response.ok) throw new Error('Failed to update role');

      toast.success('Role updated');
      fetchParticipations();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleAddFeedback = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsFeedbackOpen(true);
  };

  const handleSubmitFeedback = async (data: {
    hoursContributed: number;
    feedback: string;
  }) => {
    if (!selectedEventId) return;

    try {
      const response = await fetch('/api/events/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          hoursContributed: data.hoursContributed,
          feedback: data.feedback,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      toast.success('Feedback submitted successfully');
      fetchParticipations();
      setIsFeedbackOpen(false);
      setSelectedEventId(null);
    } catch (error) {
      throw error;
    }
  };

  // Memoize event filtering to avoid creating new Date() objects on every render
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    return {
      upcomingEvents: participations.filter(p => new Date(p.event.endDate) > now),
      pastEvents: participations.filter(p => new Date(p.event.endDate) <= now)
    };
  }, [participations]);

  return (
    <DashboardLayout type="employee">
      {isLoading ? <LoadingSkeleton variant="page" /> : error ? <ErrorState message={error} onRetry={() => { setError(null); fetchParticipations(); }} /> :
      <div className="fixed inset-0 top-16 left-0 md:left-60 right-0 bottom-0 bg-surface-primary flex flex-col overflow-hidden z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none bg-grid" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden">
          {/* Page Header */}
          <div className="flex-shrink-0 pb-4">
            <PageHeader
              title="My Events"
              description="Events you've participated in"
            />
          </div>

          {/* Stats Section */}
          <div className="flex-shrink-0 pb-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Events', value: participations.length, icon: <BsFilter className="w-4 h-4" />, color: 'text-info' },
                { label: 'Upcoming', value: upcomingEvents.length, icon: <BsSearch className="w-4 h-4" />, color: 'text-accent' },
                { label: 'Attended', value: pastEvents.filter((p) => p.participationStatus === 'ATTENDED').length, icon: <BsCalendarPlus className="w-4 h-4" />, color: 'text-success' },
                { label: 'Total Hours', value: `${participations.reduce((sum, p) => sum + (p.hoursContributed || 0), 0)}h`, icon: <BsCalendarPlus className="w-4 h-4" />, color: 'text-warning' },
              ].map((stat, i) => (
                <div key={i} className="relative overflow-hidden group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-surface-elevated border border-theme hover:border-[rgba(var(--color-accent),0.2)] hover:shadow-theme-sm transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-accent))]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -bottom-4 -right-4 text-5xl font-black text-primary/[0.02] select-none">{typeof stat.value === 'number' ? stat.value : ''}</div>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center ${stat.color} group-hover:scale-110 transition-all duration-300`}>{stat.icon}</div>
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
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPage(1);
              }}
              searchPlaceholder="Search events..."
              hasActiveFilters={status !== ''}
              onClearFilters={() => {
                setStatus('');
                setSearchQuery('');
                setPage(1);
              }}
            >
              <FilterSelect
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                options={[
                  { value: 'REGISTERED', label: 'Registered' },
                  { value: 'ATTENDED', label: 'Attended' },
                  { value: 'NO_SHOW', label: 'No Show' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
                placeholder="All Participation Status"
              />
            </PageToolbar>
          </div>

          {/* Events Content - Scrollable Container */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex flex-col overflow-y-auto min-h-0 space-y-6 pb-4"
            >
              {/* Upcoming Events Section */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <div className="p-2 bg-cat-personal rounded-xl">
                      <BsCalendarPlus className="text-cat-personal" />
                    </div>
                    Upcoming Events
                    <span className="ml-2 text-xs font-medium text-secondary bg-surface-secondary px-2 py-0.5 rounded-full">{upcomingEvents.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingEvents.map((participation) => (
                      <EventParticipationCard
                        key={participation.id}
                        participation={participation}
                        onUpdateStatus={handleUpdateStatus}
                        onUpdateRole={handleUpdateRole}
                        onAddFeedback={handleAddFeedback}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Events Section */}
              {pastEvents.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <div className="p-2 bg-success-muted rounded-xl">
                      <BsCheckLg className="text-success" />
                    </div>
                    Past Events
                    <span className="ml-2 text-xs font-medium text-secondary bg-surface-secondary px-2 py-0.5 rounded-full">{pastEvents.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {pastEvents.map((participation) => (
                      <EventParticipationCard
                        key={participation.id}
                        participation={participation}
                        onUpdateStatus={handleUpdateStatus}
                        onUpdateRole={handleUpdateRole}
                        onAddFeedback={handleAddFeedback}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {participations.length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-theme bg-surface-elevated p-12 text-center backdrop-blur-xl"
                >
                  <div className="inline-flex p-4 bg-cat-personal rounded-2xl mb-4">
                    <BsCalendarPlus className="text-5xl text-cat-personal/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-2">No events yet</h3>
                  <p className="text-secondary mb-6">
                    Browse available events and register to participate
                  </p>
                  <Link
                    href="/dashboard/employee/events/browse"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent hover:opacity-90 px-6 py-3 font-semibold text-[rgb(var(--color-text-inverse))] transition-all duration-300 focus-ring"
                  >
                    Browse Events
                    <BsArrowRight className="text-lg" />
                  </Link>
                </motion.div>
              )}
            </motion.div>

            {/* Pagination - Fixed at bottom */}
            {pagination.pages > 1 && (
              <div className="flex-shrink-0 pt-4 pb-3 border-t border-theme mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary">
                    Showing {participations.length} of {pagination.total} events
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="rounded-xl border border-theme px-4 py-2 text-secondary hover:bg-surface-secondary hover:text-primary disabled:opacity-50 transition-all duration-300 focus-ring"
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
                          className={`rounded-xl px-3 py-1 text-sm font-medium transition-all duration-300 focus-ring ${
                            page === p
                              ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-theme-sm'
                              : 'border border-theme text-secondary hover:bg-surface-secondary hover:text-primary'
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
                      className="rounded-xl border border-theme px-4 py-2 text-secondary hover:bg-surface-secondary hover:text-primary disabled:opacity-50 transition-all duration-300 focus-ring"
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => {
            setIsFeedbackOpen(false);
            setSelectedEventId(null);
          }}
          onSubmit={handleSubmitFeedback}
        />
      </div>}
    </DashboardLayout>
  );
}

export default function EmployeeEventsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout type="employee">
        <LoadingSkeleton variant="page" />
      </DashboardLayout>
    }>
      <EmployeeEventsContent />
    </Suspense>
  );
}
