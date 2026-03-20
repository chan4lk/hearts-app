'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BsSearch, BsCalendarPlus, BsArrowRight, BsFilter, BsCheckLg, BsArrowCounterclockwise } from 'react-icons/bs';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { EventParticipationCard } from '@/app/components/events/EventParticipationCard';
import { FeedbackModal } from '@/app/components/events/FeedbackModal';
import Filters from '@/app/components/shared/Filters';

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
  const searchParams = useSearchParams();
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [status, setStatus] = useState(searchParams.get('status') || '');
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
    } catch (error) {
      console.error('Error fetching participations:', error);
      toast.error('Failed to fetch your events');
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
      console.error('Error updating status:', error);
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
      console.error('Error updating role:', error);
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
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const upcomingEvents = participations.filter(
    (p) => new Date(p.event.endDate) > new Date()
  );
  const pastEvents = participations.filter(
    (p) => new Date(p.event.endDate) <= new Date()
  );

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
                    My Events
                  </h2>
                  <p className="text-white/90 text-xs">Track your participation and manage event feedback</p>
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
                    <BsFilter className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl font-bold text-white">{participations.length}</div>
                    <div className="text-xs font-medium text-gray-400">Total Events</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1 * 0.05 }}
                className="relative overflow-hidden bg-blue-500/10 backdrop-blur-sm rounded-xl p-3 border-2 border-blue-500/30 hover:border-opacity-60 transition-all duration-300 group hover:shadow-xl hover:scale-105 flex items-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg flex-shrink-0">
                    <BsSearch className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl font-bold text-white">{upcomingEvents.length}</div>
                    <div className="text-xs font-medium text-gray-400">Upcoming</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 2 * 0.05 }}
                className="relative overflow-hidden bg-emerald-500/10 backdrop-blur-sm rounded-xl p-3 border-2 border-emerald-500/30 hover:border-opacity-60 transition-all duration-300 group hover:shadow-xl hover:scale-105 flex items-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg flex-shrink-0">
                    <BsCalendarPlus className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl font-bold text-white">{pastEvents.filter((p) => p.participationStatus === 'ATTENDED').length}</div>
                    <div className="text-xs font-medium text-gray-400">Attended</div>
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
                    <BsCalendarPlus className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl font-bold text-white">{participations.reduce((sum, p) => sum + (p.hoursContributed || 0), 0)}h</div>
                    <div className="text-xs font-medium text-gray-400">Total Hours</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Filters - Fixed */}
          <div className="flex-shrink-0 pb-3">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border-2 border-gray-700/50">
              <Filters
                selectedStatus={status}
                onStatusChange={(value: string) => {
                  setStatus(value);
                  setPage(1);
                }}
                statusOptions={[
                  { value: '', label: 'All Participation Status' },
                  { value: 'REGISTERED', label: 'Registered' },
                  { value: 'ATTENDED', label: 'Attended' },
                  { value: 'NO_SHOW', label: 'No Show' },
                  { value: 'CANCELLED', label: 'Cancelled' }
                ]}
                onClear={() => {
                  setStatus('');
                  setPage(1);
                }}
              />
            </div>
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
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <BsCalendarPlus className="text-teal-400" />
                    </div>
                    Upcoming Events
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <BsCheckLg className="text-emerald-400" />
                    </div>
                    Past Events
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  className="rounded-xl border border-theme bg-surface-elevated p-12 text-center backdrop-blur-xl"
                >
                  <div className="inline-flex p-4 bg-teal-500/10 rounded-full mb-4">
                    <BsCalendarPlus className="text-5xl text-teal-400/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
                  <p className="text-white/60 mb-6">
                    Browse available events and register to participate
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/dashboard/employee/events/browse'}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-3 font-semibold text-white hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/30 transition-all"
                  >
                    Browse Events
                    <BsArrowRight className="text-lg" />
                  </motion.button>
                </motion.div>
              )}
            </motion.div>

            {/* Pagination - Fixed at bottom */}
            {pagination.pages > 1 && (
              <div className="flex-shrink-0 pt-4 pb-3 border-t border-gray-700/50 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">
                    Showing {participations.length} of {pagination.total} events
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

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => {
            setIsFeedbackOpen(false);
            setSelectedEventId(null);
          }}
          onSubmit={handleSubmitFeedback}
        />
      </div>
    </DashboardLayout>
  );
}

export default function EmployeeEventsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout type="employee">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white/60">Loading events...</div>
        </div>
      </DashboardLayout>
    }>
      <EmployeeEventsContent />
    </Suspense>
  );
}
