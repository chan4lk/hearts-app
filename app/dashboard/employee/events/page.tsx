'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BsSearch, BsCalendarPlus, BsArrowRight, BsFilter } from 'react-icons/bs';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { EventParticipationCard } from '@/app/components/events/EventParticipationCard';
import { FeedbackModal } from '@/app/components/events/FeedbackModal';

interface Participation {
  id: string;
  eventId: string;
  participationStatus: string;
  hoursContributed?: number;
  feedback?: string;
  registeredAt: string;
  event: any;
}

export default function EmployeeEventsPage() {
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

      toast.success(`Participation updated to ${newStatus}`);
      fetchParticipations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update participation status');
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white">My Events</h1>
                <p className="mt-2 text-white/60">
                  Track your participation and manage event feedback
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-teal-400">
                  {participations.length}
                </div>
                <p className="text-sm text-white/60">Events</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 backdrop-blur-xl hover:border-blue-500/50 transition-all"
            >
              <p className="text-sm text-white/60 mb-2">Upcoming Events</p>
              <p className="text-3xl font-bold text-blue-300">{upcomingEvents.length}</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 backdrop-blur-xl hover:border-green-500/50 transition-all"
            >
              <p className="text-sm text-white/60 mb-2">Attended Events</p>
              <p className="text-3xl font-bold text-green-300">
                {pastEvents.filter((p) => p.participationStatus === 'ATTENDED').length}
              </p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-teal-500/5 p-4 backdrop-blur-xl hover:border-teal-500/50 transition-all"
            >
              <p className="text-sm text-white/60 mb-2">Total Hours</p>
              <p className="text-3xl font-bold text-teal-300">
                {participations.reduce((sum, p) => sum + (p.hoursContributed || 0), 0)}h
              </p>
            </motion.div>
          </motion.div>

          {/* Filters */}
          {participations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border-2 border-teal-500/20 bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-teal-500/5 p-4 backdrop-blur-xl"
            >
              <div className="relative max-w-xs">
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
                  <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Participation Status</option>
                  <option value="REGISTERED" style={{ backgroundColor: '#1f2937', color: '#93c5fd' }}>Registered</option>
                  <option value="ATTENDED" style={{ backgroundColor: '#1f2937', color: '#86efac' }}>Attended</option>
                  <option value="NO_SHOW" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>No Show</option>
                  <option value="CANCELLED" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>Cancelled</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
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
                    onAddFeedback={handleAddFeedback}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Past Events Section */}
          {pastEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <BsCalendarPlus className="text-amber-400" />
                </div>
                Past Events
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((participation) => (
                  <EventParticipationCard
                    key={participation.id}
                    participation={participation}
                    onUpdateStatus={handleUpdateStatus}
                    onAddFeedback={handleAddFeedback}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {participations.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl"
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
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
          )}
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
