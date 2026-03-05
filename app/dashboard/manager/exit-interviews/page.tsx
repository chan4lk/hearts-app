'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsBoxArrowRight,
  BsPlus,
  BsPerson,
  BsCalendar,
  BsX,
  BsChevronRight,
  BsClock,
  BsCalendarCheck,
  BsCheckCircle,
  BsXCircle,
  BsJournalText,
  BsFilter,
} from 'react-icons/bs';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface ExitInterview {
  id: string;
  employeeId: string;
  employee: { id: string; name: string; email: string };
  departureDate: string;
  reason: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  responses?: any;
  managerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  PENDING: {
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: BsClock,
    label: 'Pending',
  },
  SCHEDULED: {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: BsCalendarCheck,
    label: 'Scheduled',
  },
  COMPLETED: {
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: BsCheckCircle,
    label: 'Completed',
  },
  CANCELLED: {
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: BsXCircle,
    label: 'Cancelled',
  },
};

export default function ExitInterviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState<ExitInterview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Flag departure form state
  const [flagForm, setFlagForm] = useState({
    employeeId: '',
    departureDate: '',
    reason: '',
  });
  const [flagErrors, setFlagErrors] = useState<Record<string, string>>({});

  // Auth guard
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Fetch data
  useEffect(() => {
    if (session) {
      fetchInterviews();
      fetchEmployees();
    }
  }, [session]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exit-interviews');
      if (!response.ok) throw new Error('Failed to fetch exit interviews');
      const data = await response.json();
      setInterviews(data.exitInterviews || data.interviews || data || []);
    } catch (error) {
      console.error('Error fetching exit interviews:', error);
      toast.error('Failed to load exit interviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees/assigned');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(
        (data.employees || []).map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
        }))
      );
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleFlagDeparture = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const errors: Record<string, string> = {};
    if (!flagForm.employeeId) errors.employeeId = 'Please select an employee';
    if (!flagForm.departureDate) errors.departureDate = 'Please select a departure date';
    if (!flagForm.reason || flagForm.reason.trim().length < 5)
      errors.reason = 'Please provide a reason (at least 5 characters)';

    setFlagErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFlagSubmitting(true);
    try {
      const response = await fetch('/api/exit-interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flagForm),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to flag departure');
      }

      toast.success('Departure flagged successfully');
      setShowFlagForm(false);
      setFlagForm({ employeeId: '', departureDate: '', reason: '' });
      setFlagErrors({});
      await fetchInterviews();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to flag departure';
      toast.error(message);
    } finally {
      setFlagSubmitting(false);
    }
  };

  // Filter interviews
  const filteredInterviews = interviews.filter((interview) => {
    if (filterStatus !== 'all' && interview.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const statusCounts = {
    PENDING: interviews.filter((i) => i.status === 'PENDING').length,
    SCHEDULED: interviews.filter((i) => i.status === 'SCHEDULED').length,
    COMPLETED: interviews.filter((i) => i.status === 'COMPLETED').length,
    CANCELLED: interviews.filter((i) => i.status === 'CANCELLED').length,
  };

  if (status === 'loading' || !session) {
    return (
      <DashboardLayout type="manager">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="manager">
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl p-5 shadow-lg"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BsBoxArrowRight className="w-6 h-6" />
                  Exit Interviews
                </h2>
                <p className="text-white/80 text-sm">
                  Manage employee departures and conduct exit interviews
                </p>
              </div>
              <button
                onClick={() => setShowFlagForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium backdrop-blur-sm"
              >
                <BsPlus className="w-5 h-5" />
                Flag Departure
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={statusKey}
                  onClick={() =>
                    setFilterStatus(filterStatus === statusKey ? 'all' : statusKey)
                  }
                  className={`bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-4 border shadow-xl transition-all hover:scale-[1.02] ${
                    filterStatus === statusKey
                      ? 'border-purple-500/50 ring-1 ring-purple-500/30'
                      : 'border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                      <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-white">
                        {statusCounts[statusKey as keyof typeof statusCounts]}
                      </p>
                      <p className="text-xs text-gray-400">{config.label}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>

          {/* Flag Departure Modal */}
          <AnimatePresence>
            {showFlagForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowFlagForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-lg border border-gray-700/50"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BsBoxArrowRight className="w-5 h-5 text-rose-400" />
                      Flag Employee Departure
                    </h3>
                    <button
                      onClick={() => setShowFlagForm(false)}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <BsX className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleFlagDeparture} className="p-5 space-y-4">
                    {/* Employee Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        <BsPerson className="inline w-3.5 h-3.5 mr-1 text-rose-400" />
                        Employee
                      </label>
                      <select
                        value={flagForm.employeeId}
                        onChange={(e) =>
                          setFlagForm((prev) => ({ ...prev, employeeId: e.target.value }))
                        }
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      >
                        <option value="">Select an employee...</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.email})
                          </option>
                        ))}
                      </select>
                      {flagErrors.employeeId && (
                        <p className="text-xs text-red-400 mt-1">{flagErrors.employeeId}</p>
                      )}
                    </div>

                    {/* Departure Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        <BsCalendar className="inline w-3.5 h-3.5 mr-1 text-rose-400" />
                        Departure Date
                      </label>
                      <input
                        type="date"
                        value={flagForm.departureDate}
                        onChange={(e) =>
                          setFlagForm((prev) => ({ ...prev, departureDate: e.target.value }))
                        }
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      />
                      {flagErrors.departureDate && (
                        <p className="text-xs text-red-400 mt-1">{flagErrors.departureDate}</p>
                      )}
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        <BsJournalText className="inline w-3.5 h-3.5 mr-1 text-rose-400" />
                        Reason for Departure
                      </label>
                      <textarea
                        value={flagForm.reason}
                        onChange={(e) =>
                          setFlagForm((prev) => ({ ...prev, reason: e.target.value }))
                        }
                        placeholder="Describe the reason for departure..."
                        rows={4}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      />
                      {flagErrors.reason && (
                        <p className="text-xs text-red-400 mt-1">{flagErrors.reason}</p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowFlagForm(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={flagSubmitting}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {flagSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Flag Departure'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50 shadow-xl"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-gray-400">
                <BsFilter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="ml-auto text-sm text-gray-400">
                {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? 's' : ''}
              </div>
            </div>
          </motion.div>

          {/* Interviews List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 bg-gray-900/80 backdrop-blur-sm rounded-lg px-5 py-3">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-sm">Loading exit interviews...</span>
              </div>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-12 border border-gray-700/50 shadow-xl text-center"
            >
              <BsBoxArrowRight className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Exit Interviews</h3>
              <p className="text-sm text-gray-500 mb-6">
                {filterStatus !== 'all'
                  ? 'No interviews found with the selected status.'
                  : 'No employee departures have been flagged yet.'}
              </p>
              <button
                onClick={() => setShowFlagForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-medium rounded-lg transition-all"
              >
                <BsPlus className="w-5 h-5" />
                Flag Departure
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredInterviews.map((interview, index) => {
                const statusConfig = STATUS_CONFIG[interview.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <button
                      onClick={() =>
                        router.push(`/dashboard/manager/exit-interviews/${interview.id}`)
                      }
                      className="w-full bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50 shadow-xl hover:border-purple-500/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-white font-semibold">
                              {interview.employee?.name || 'Unknown Employee'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${statusConfig.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <BsCalendar className="w-3 h-3" />
                              Departure:{' '}
                              {new Date(interview.departureDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <BsClock className="w-3 h-3" />
                              Created:{' '}
                              {new Date(interview.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {interview.reason && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                              {interview.reason}
                            </p>
                          )}
                        </div>
                        <BsChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
