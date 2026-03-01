'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsArrowLeft,
  BsBoxArrowRight,
  BsPerson,
  BsCalendar,
  BsClock,
  BsCalendarCheck,
  BsCheckCircle,
  BsXCircle,
  BsJournalText,
  BsQuestionCircle,
  BsSend,
  BsCalendarPlus,
  BsXLg,
} from 'react-icons/bs';

interface ExitInterview {
  id: string;
  employeeId: string;
  employee: { id: string; name: string; email: string };
  departureDate: string;
  reason: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  responses?: ExitInterviewResponse[] | string;
  managerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExitInterviewResponse {
  question: string;
  answer: string;
}

const EXIT_INTERVIEW_QUESTIONS = [
  'What is your primary reason for leaving?',
  'What did you enjoy most about working here?',
  'What could we have done to retain you?',
  'How would you rate the management and leadership?',
  'Any additional feedback for the organization?',
];

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
  PENDING: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20 border-yellow-500/30',
    icon: BsClock,
    label: 'Pending',
  },
  SCHEDULED: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    icon: BsCalendarCheck,
    label: 'Scheduled',
  },
  COMPLETED: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30',
    icon: BsCheckCircle,
    label: 'Completed',
  },
  CANCELLED: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    icon: BsXCircle,
    label: 'Cancelled',
  },
};

export default function ExitInterviewDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const interviewId = params?.interviewId as string;

  const [interview, setInterview] = useState<ExitInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<string[]>(EXIT_INTERVIEW_QUESTIONS.map(() => ''));
  const [managerNotes, setManagerNotes] = useState('');

  // Auth guard
  useEffect(() => {
    if (authStatus === 'loading') return;
    if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
      router.push('/login');
    }
  }, [session, authStatus, router]);

  // Fetch interview details
  useEffect(() => {
    if (session && interviewId) {
      fetchInterview();
    }
  }, [session, interviewId]);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exit-interviews/${interviewId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Interview not found');
          router.push('/dashboard/manager/exit-interviews');
          return;
        }
        throw new Error('Failed to fetch interview');
      }
      const data = await response.json();
      const interviewData = data.interview || data;
      setInterview(interviewData);

      // If completed, parse responses for display
      if (interviewData.status === 'COMPLETED' && interviewData.responses) {
        const parsed = parseResponses(interviewData.responses);
        setAnswers(parsed.map((r: ExitInterviewResponse) => r.answer));
        setManagerNotes(interviewData.managerNotes || '');
      } else {
        setManagerNotes(interviewData.managerNotes || '');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      toast.error('Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const parseResponses = (responses: ExitInterviewResponse[] | string | undefined): ExitInterviewResponse[] => {
    if (!responses) return [];
    if (typeof responses === 'string') {
      try {
        return JSON.parse(responses);
      } catch {
        return [];
      }
    }
    return responses;
  };

  const handleCompleteInterview = async () => {
    // Validate all questions answered
    const unanswered = answers.findIndex((a) => !a.trim());
    if (unanswered !== -1) {
      toast.error(`Please answer question ${unanswered + 1}`);
      return;
    }

    setSubmitting(true);
    try {
      const responses = EXIT_INTERVIEW_QUESTIONS.map((question, index) => ({
        question,
        answer: answers[index],
      }));

      const response = await fetch(`/api/exit-interviews/${interviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          managerNotes,
          status: 'COMPLETED',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete interview');
      }

      toast.success('Exit interview completed successfully');
      await fetchInterview();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete interview';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: 'SCHEDULED' | 'CANCELLED') => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/exit-interviews/${interviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update status`);
      }

      toast.success(
        newStatus === 'SCHEDULED'
          ? 'Interview scheduled successfully'
          : 'Interview cancelled'
      );
      await fetchInterview();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === 'loading' || !session || loading) {
    return (
      <DashboardLayout type="manager">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!interview) {
    return (
      <DashboardLayout type="manager">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <BsBoxArrowRight className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Interview Not Found</h3>
          <button
            onClick={() => router.push('/dashboard/manager/exit-interviews')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20 transition-all"
          >
            <BsArrowLeft className="w-4 h-4" />
            Back to Exit Interviews
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[interview.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const isEditable = interview.status === 'PENDING' || interview.status === 'SCHEDULED';
  const isCompleted = interview.status === 'COMPLETED';
  const isCancelled = interview.status === 'CANCELLED';
  const parsedResponses = isCompleted ? parseResponses(interview.responses) : [];

  return (
    <DashboardLayout type="manager">
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-3 space-y-4">
          {/* Back Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => router.push('/dashboard/manager/exit-interviews')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
            >
              <BsArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Exit Interviews
            </button>
          </motion.div>

          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-xl"
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/20 rounded-lg">
                    <BsBoxArrowRight className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Exit Interview</h2>
                    <p className="text-sm text-gray-400">
                      {interview.employee?.name || 'Unknown Employee'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-sm">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <BsPerson className="w-4 h-4" />
                    {interview.employee?.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <BsCalendar className="w-4 h-4" />
                    Departure:{' '}
                    {new Date(interview.departureDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig.bgColor} ${statusConfig.color}`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Reason */}
            {interview.reason && (
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Reason for Departure
                </h4>
                <p className="text-sm text-gray-300 bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                  {interview.reason}
                </p>
              </div>
            )}

            {/* Action Buttons for PENDING/SCHEDULED */}
            {isEditable && (
              <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center gap-3 flex-wrap">
                {interview.status === 'PENDING' && (
                  <button
                    onClick={() => handleStatusChange('SCHEDULED')}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <BsCalendarPlus className="w-4 h-4" />
                    Schedule Interview
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all disabled:opacity-50"
                >
                  <BsXLg className="w-3.5 h-3.5" />
                  Cancel Interview
                </button>
              </div>
            )}
          </motion.div>

          {/* Interview Questions Form (for PENDING/SCHEDULED) */}
          {isEditable && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-xl space-y-6"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BsQuestionCircle className="w-5 h-5 text-purple-400" />
                Exit Interview Questions
              </h3>

              {EXIT_INTERVIEW_QUESTIONS.map((question, qIndex) => (
                <div key={qIndex}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <span className="inline-flex items-start gap-1.5">
                      <span className="text-purple-400 font-semibold mt-0.5">Q{qIndex + 1}.</span>
                      <span>{question}</span>
                    </span>
                  </label>
                  <textarea
                    value={answers[qIndex]}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[qIndex] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    placeholder="Enter the employee's response..."
                    rows={3}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                  />
                </div>
              ))}

              {/* Manager Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <BsJournalText className="inline w-3.5 h-3.5 mr-1 text-purple-400" />
                  Manager Notes
                </label>
                <textarea
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="Add any additional notes or observations..."
                  rows={4}
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                />
              </div>

              {/* Complete Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCompleteInterview}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <BsCheckCircle className="w-4 h-4" />
                      Complete Interview
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Completed Interview - Read Only */}
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-green-500/20 shadow-xl space-y-5"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BsCheckCircle className="w-5 h-5 text-green-400" />
                Interview Responses
              </h3>

              {parsedResponses.length > 0 ? (
                parsedResponses.map((response, rIndex) => (
                  <div key={rIndex}>
                    <p className="text-sm font-medium text-gray-300 mb-1.5 flex items-start gap-1.5">
                      <BsQuestionCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="text-green-400 font-semibold">Q{rIndex + 1}.</span>{' '}
                        {response.question}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 ml-5">
                      {response.answer}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No responses recorded.</p>
              )}

              {/* Manager Notes */}
              {interview.managerNotes && (
                <div className="pt-4 border-t border-gray-700/50">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BsJournalText className="w-3.5 h-3.5 text-green-400" />
                    Manager Notes
                  </h4>
                  <p className="text-sm text-gray-300 bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 whitespace-pre-wrap">
                    {interview.managerNotes}
                  </p>
                </div>
              )}

              <div className="pt-2 text-xs text-gray-500">
                Completed on{' '}
                {new Date(interview.updatedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </motion.div>
          )}

          {/* Cancelled Interview */}
          {isCancelled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-8 border border-red-500/20 shadow-xl text-center"
            >
              <BsXCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Interview Cancelled</h3>
              <p className="text-sm text-gray-500">
                This exit interview was cancelled and no responses were recorded.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
