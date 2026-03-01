'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import InitiateFeedbackModal from './components/InitiateFeedbackModal';
import {
  BsPlus,
  BsPeople,
  BsClockHistory,
  BsCheckCircle,
  BsXCircle,
  BsArrowRight,
  BsChatDots,
  BsCalendarCheck,
  BsSearch,
  BsFunnel,
} from 'react-icons/bs';

interface FeedbackReviewer {
  id: string;
  reviewerId: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
}

interface FeedbackRound {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reviews: FeedbackReviewer[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

const TYPE_LABELS: Record<string, string> = {
  THREE_MONTH: '3-Month Review',
  ANNUAL: 'Annual Review',
};

export default function ManagerFeedbackPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [rounds, setRounds] = useState<FeedbackRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
      router.push('/login');
      return;
    }
    fetchRounds();
  }, [session, sessionStatus, router]);

  const fetchRounds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feedback-rounds');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback rounds');
      }
      const data = await response.json();
      setRounds(Array.isArray(data) ? data : data.rounds || []);
    } catch (error) {
      console.error('Error fetching feedback rounds:', error);
      toast.error('Failed to load feedback rounds');
      setRounds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    fetchRounds();
    toast.success('360 feedback round initiated successfully');
  };

  const filteredRounds = rounds.filter((round) => {
    const matchesSearch =
      searchQuery === '' ||
      round.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      round.employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || round.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: rounds.length,
    pending: rounds.filter((r) => r.status === 'PENDING').length,
    inProgress: rounds.filter((r) => r.status === 'IN_PROGRESS').length,
    completed: rounds.filter((r) => r.status === 'COMPLETED').length,
  };

  const getReviewerProgress = (reviews: FeedbackReviewer[]) => {
    const submitted = reviews.filter((r) => r.status === 'SUBMITTED').length;
    return { submitted, total: reviews.length };
  };

  return (
    <DashboardLayout type="manager">
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 shadow-lg"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BsChatDots className="w-5 h-5" />
                  360 Feedback Management
                </h2>
                <p className="text-white/90 text-xs">
                  Initiate and manage 360-degree feedback rounds for your team
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all backdrop-blur-sm border border-white/20"
              >
                <BsPlus className="w-5 h-5" />
                <span className="text-sm font-medium">Initiate 360 Review</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { label: 'Total Rounds', value: stats.total, icon: BsPeople, color: 'purple' },
              { label: 'Pending', value: stats.pending, icon: BsClockHistory, color: 'yellow' },
              { label: 'In Progress', value: stats.inProgress, icon: BsCalendarCheck, color: 'blue' },
              { label: 'Completed', value: stats.completed, icon: BsCheckCircle, color: 'green' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                    <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
              <div className="relative">
                <BsFunnel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Rounds List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            {loading ? (
              <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-12 border border-gray-700/50 text-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading feedback rounds...</p>
              </div>
            ) : filteredRounds.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-12 border border-gray-700/50 text-center">
                <BsChatDots className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Feedback Rounds</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No rounds match your filters. Try adjusting your search criteria.'
                    : 'Get started by initiating a 360 feedback round for a team member.'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <BsPlus className="w-4 h-4" />
                    Initiate First Review
                  </motion.button>
                )}
              </div>
            ) : (
              filteredRounds.map((round, index) => {
                const statusCfg = STATUS_CONFIG[round.status] || STATUS_CONFIG.PENDING;
                const progress = getReviewerProgress(round.reviews);

                return (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.005, y: -1 }}
                    onClick={() => router.push(`/dashboard/manager/feedback/${round.id}`)}
                    className="group bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/40 transition-all cursor-pointer hover:shadow-lg hover:shadow-purple-500/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {round.employee.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                              {round.employee.name}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}
                            >
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{TYPE_LABELS[round.type] || round.type}</span>
                            <span>|</span>
                            <span>
                              {new Date(round.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span>|</span>
                            <span className="flex items-center gap-1">
                              <BsPeople className="w-3 h-3" />
                              {progress.submitted}/{progress.total} reviewed
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Arrow */}
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block w-24">
                          <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all"
                              style={{
                                width: `${progress.total > 0 ? (progress.submitted / progress.total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <BsArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </div>

        {/* Initiate Feedback Modal */}
        <InitiateFeedbackModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
