'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import MeetingForm from './components/MeetingForm';
import {
  BsJournalText,
  BsPlus,
  BsCalendar,
  BsPerson,
  BsTag,
  BsListCheck,
  BsChevronDown,
  BsChevronUp,
  BsPencil,
  BsTrash,
  BsFilter,
  BsArrowRight,
  BsSearch,
} from 'react-icons/bs';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Meeting {
  id: string;
  employeeId: string;
  employee: { id: string; name: string; email: string };
  type: string;
  date: string;
  notes: string;
  actionItems: string;
  nextSteps: string;
  feedbackRoundId?: string;
  createdAt: string;
  updatedAt: string;
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  THREE_MONTH_REVIEW: '3-Month Review',
  SIX_MONTH_REVIEW: '6-Month Review',
  ANNUAL_REVIEW: 'Annual Review',
  FEEDBACK_DISCUSSION: 'Feedback Discussion',
  GENERAL: 'General',
};

const MEETING_TYPE_COLORS: Record<string, string> = {
  THREE_MONTH_REVIEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SIX_MONTH_REVIEW: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  ANNUAL_REVIEW: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  FEEDBACK_DISCUSSION: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  GENERAL: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function MeetingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      fetchMeetings();
      fetchEmployees();
    }
  }, [session]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meetings');
      if (!response.ok) throw new Error('Failed to fetch meetings');
      const data = await response.json();
      setMeetings(data.meetings || data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
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

  const handleCreateMeeting = async (formData: any) => {
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create meeting');
      }

      toast.success('Meeting minutes saved successfully');
      setShowForm(false);
      await fetchMeetings();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create meeting';
      toast.error(message);
      throw error;
    }
  };

  const handleUpdateMeeting = async (formData: any) => {
    if (!editingMeeting) return;

    try {
      const response = await fetch(`/api/meetings/${editingMeeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update meeting');
      }

      toast.success('Meeting minutes updated successfully');
      setEditingMeeting(null);
      setShowForm(false);
      await fetchMeetings();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update meeting';
      toast.error(message);
      throw error;
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting record?')) return;

    setDeletingId(meetingId);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete meeting');

      toast.success('Meeting deleted successfully');
      setExpandedMeetingId(null);
      await fetchMeetings();
    } catch (error) {
      toast.error('Failed to delete meeting');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setShowForm(true);
    setExpandedMeetingId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter meetings
  const filteredMeetings = meetings.filter((meeting) => {
    if (filterEmployee !== 'all' && meeting.employeeId !== filterEmployee) return false;
    return true;
  });

  // Group meetings by date
  const groupedMeetings = filteredMeetings.reduce<Record<string, Meeting[]>>((groups, meeting) => {
    const dateKey = new Date(meeting.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(meeting);
    return groups;
  }, {});

  // Sort date groups (newest first)
  const sortedDateKeys = Object.keys(groupedMeetings).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const getActionItemCount = (actionItems: string): number => {
    if (!actionItems || !actionItems.trim()) return 0;
    return actionItems.split('\n').filter((line) => line.trim()).length;
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
            className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 shadow-lg"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BsJournalText className="w-6 h-6" />
                  Meeting Minutes
                </h2>
                <p className="text-white/80 text-sm">
                  Record and track meeting notes, action items, and follow-ups
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingMeeting(null);
                  setShowForm(!showForm);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium backdrop-blur-sm"
              >
                <BsPlus className="w-5 h-5" />
                New Meeting Minutes
              </button>
            </div>
          </motion.div>

          {/* Create/Edit Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MeetingForm
                  onSubmit={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingMeeting(null);
                  }}
                  initialData={
                    editingMeeting
                      ? {
                          employeeId: editingMeeting.employeeId,
                          type: editingMeeting.type,
                          date: new Date(editingMeeting.date).toISOString().split('T')[0],
                          notes: editingMeeting.notes,
                          actionItems: editingMeeting.actionItems,
                          nextSteps: editingMeeting.nextSteps,
                          feedbackRoundId: editingMeeting.feedbackRoundId,
                        }
                      : undefined
                  }
                  employees={employees}
                />
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
              <div className="flex items-center gap-2">
                <BsPerson className="w-4 h-4 text-gray-400" />
                <select
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="all">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ml-auto text-sm text-gray-400">
                {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''}
              </div>
            </div>
          </motion.div>

          {/* Meetings List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 bg-gray-900/80 backdrop-blur-sm rounded-lg px-5 py-3">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-sm">Loading meetings...</span>
              </div>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-12 border border-gray-700/50 shadow-xl text-center"
            >
              <BsJournalText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Meeting Minutes</h3>
              <p className="text-sm text-gray-500 mb-6">
                {filterEmployee !== 'all'
                  ? 'No meetings found for the selected employee.'
                  : 'Start by recording your first meeting minutes.'}
              </p>
              <button
                onClick={() => {
                  setEditingMeeting(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-medium rounded-lg transition-all"
              >
                <BsPlus className="w-5 h-5" />
                Create Meeting Minutes
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {sortedDateKeys.map((dateKey, groupIndex) => (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.05 }}
                >
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <BsCalendar className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-purple-400">{dateKey}</h3>
                    <div className="flex-1 h-px bg-gray-700/50" />
                    <span className="text-xs text-gray-500">
                      {groupedMeetings[dateKey].length} meeting{groupedMeetings[dateKey].length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Meeting Cards */}
                  <div className="space-y-3">
                    {groupedMeetings[dateKey].map((meeting, index) => {
                      const isExpanded = expandedMeetingId === meeting.id;
                      const actionItemCount = getActionItemCount(meeting.actionItems);

                      return (
                        <motion.div
                          key={meeting.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-xl overflow-hidden hover:border-purple-500/30 transition-all"
                        >
                          {/* Card Header - Always visible */}
                          <button
                            onClick={() =>
                              setExpandedMeetingId(isExpanded ? null : meeting.id)
                            }
                            className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-800/30 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                <span className="text-white font-semibold truncate">
                                  {meeting.employee?.name || 'Unknown Employee'}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                                    MEETING_TYPE_COLORS[meeting.type] || MEETING_TYPE_COLORS.GENERAL
                                  }`}
                                >
                                  {MEETING_TYPE_LABELS[meeting.type] || meeting.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <BsCalendar className="w-3 h-3" />
                                  {new Date(meeting.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                {actionItemCount > 0 && (
                                  <span className="flex items-center gap-1 text-purple-400">
                                    <BsListCheck className="w-3 h-3" />
                                    {actionItemCount} action item{actionItemCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              {!isExpanded && meeting.notes && (
                                <p className="text-sm text-gray-500 mt-1.5 line-clamp-1">
                                  {meeting.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-gray-400">
                              {isExpanded ? (
                                <BsChevronUp className="w-4 h-4" />
                              ) : (
                                <BsChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 space-y-4 border-t border-gray-700/50 pt-4">
                                  {/* Notes */}
                                  {meeting.notes && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <BsJournalText className="w-3.5 h-3.5 text-purple-400" />
                                        Notes
                                      </h4>
                                      <p className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                        {meeting.notes}
                                      </p>
                                    </div>
                                  )}

                                  {/* Action Items */}
                                  {meeting.actionItems && meeting.actionItems.trim() && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <BsListCheck className="w-3.5 h-3.5 text-purple-400" />
                                        Action Items
                                      </h4>
                                      <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                        {meeting.actionItems.split('\n').filter(line => line.trim()).map((item, i) => (
                                          <div
                                            key={i}
                                            className="flex items-start gap-2 py-1 text-sm text-gray-300"
                                          >
                                            <span className="text-purple-400 mt-0.5">-</span>
                                            <span>{item.trim()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Next Steps */}
                                  {meeting.nextSteps && meeting.nextSteps.trim() && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <BsArrowRight className="w-3.5 h-3.5 text-purple-400" />
                                        Next Steps
                                      </h4>
                                      <p className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                        {meeting.nextSteps}
                                      </p>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex items-center gap-3 pt-2 border-t border-gray-700/30">
                                    <button
                                      onClick={() => handleEditClick(meeting)}
                                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20 transition-all"
                                    >
                                      <BsPencil className="w-3.5 h-3.5" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMeeting(meeting.id)}
                                      disabled={deletingId === meeting.id}
                                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all disabled:opacity-50"
                                    >
                                      {deletingId === meeting.id ? (
                                        <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                      ) : (
                                        <BsTrash className="w-3.5 h-3.5" />
                                      )}
                                      Delete
                                    </button>
                                    <span className="ml-auto text-xs text-gray-600">
                                      Updated{' '}
                                      {new Date(meeting.updatedAt || meeting.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
