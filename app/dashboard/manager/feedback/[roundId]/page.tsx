'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsArrowLeft,
  BsPerson,
  BsCheckCircle,
  BsClockHistory,
  BsXCircle,
  BsChatDots,
  BsStarFill,
  BsStar,
  BsCalendarCheck,
  BsCalendar3,
  BsPeople,
  BsTrash,
  BsExclamationTriangle,
  BsLightbulb,
  BsTrophy,
  BsArrowUp,
} from 'react-icons/bs';

interface ReviewerDetail {
  id: string;
  reviewerId: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  score?: number;
  comments?: string;
  strengths?: string;
  improvements?: string;
  submittedAt?: string;
}

interface FeedbackRoundDetail {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department?: string;
    position?: string;
  };
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reviews: ReviewerDetail[];
  averageScore?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof BsClockHistory }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: BsClockHistory },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: BsCalendarCheck },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: BsCheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: BsXCircle },
};

const TYPE_LABELS: Record<string, string> = {
  THREE_MONTH: '3-Month Review',
  ANNUAL: 'Annual Review',
};

const REVIEWER_STATUS: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof BsClockHistory }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: BsClockHistory },
  SUBMITTED: { label: 'Submitted', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: BsCheckCircle },
};

export default function FeedbackRoundDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const roundId = params?.roundId as string;

  const [round, setRound] = useState<FeedbackRoundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
      router.push('/login');
      return;
    }
    if (roundId) {
      fetchRoundDetail();
    }
  }, [session, sessionStatus, router, roundId]);

  const fetchRoundDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feedback-rounds/${roundId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback round');
      }
      const data = await response.json();
      setRound(data.round || data);
    } catch (error) {
      console.error('Error fetching round detail:', error);
      toast.error('Failed to load feedback round details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await fetch(`/api/feedback-rounds/${roundId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel round');
      }
      toast.success('Feedback round cancelled successfully');
      router.push('/dashboard/manager/feedback');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel round';
      toast.error(errorMessage);
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const getAggregatedResults = () => {
    if (!round) return null;
    const submittedReviews = round.reviews.filter((r) => r.status === 'SUBMITTED');
    if (submittedReviews.length === 0) return null;

    const scores = submittedReviews.filter((r) => r.score !== undefined && r.score !== null).map((r) => r.score!);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const allComments = submittedReviews.filter((r) => r.comments).map((r) => r.comments!);
    const allStrengths = submittedReviews.filter((r) => r.strengths).map((r) => r.strengths!);
    const allImprovements = submittedReviews.filter((r) => r.improvements).map((r) => r.improvements!);

    return { averageScore, allComments, allStrengths, allImprovements, submittedCount: submittedReviews.length };
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= Math.round(score) ? (
              <BsStarFill className="w-4 h-4 text-yellow-400" />
            ) : (
              <BsStar className="w-4 h-4 text-gray-600" />
            )}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout type="manager">
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading feedback round...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!round) {
    return (
      <DashboardLayout type="manager">
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <BsChatDots className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Round Not Found</h3>
            <p className="text-sm text-gray-400 mb-4">This feedback round does not exist or has been removed.</p>
            <button
              onClick={() => router.push('/dashboard/manager/feedback')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              <BsArrowLeft className="w-4 h-4" />
              Back to Feedback
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[round.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;
  const progress = {
    submitted: round.reviews.filter((r) => r.status === 'SUBMITTED').length,
    total: round.reviews.length,
  };
  const aggregated = round.status === 'COMPLETED' ? getAggregatedResults() : null;

  return (
    <DashboardLayout type="manager">
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-3 space-y-4">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push('/dashboard/manager/feedback')}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <BsArrowLeft className="w-4 h-4" />
            Back to Feedback Rounds
          </motion.button>

          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {round.employee.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{round.employee.name}</h2>
                  <p className="text-sm text-gray-400">{round.employee.email}</p>
                  {round.employee.department && (
                    <p className="text-xs text-gray-500">{round.employee.department}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusCfg.label}
                </span>
                {round.status !== 'COMPLETED' && round.status !== 'CANCELLED' && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30"
                  >
                    <BsTrash className="w-3 h-3" />
                    Cancel Round
                  </button>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {round.type === 'THREE_MONTH' ? (
                  <BsCalendar3 className="w-4 h-4 text-purple-400" />
                ) : (
                  <BsCalendarCheck className="w-4 h-4 text-purple-400" />
                )}
                <span>{TYPE_LABELS[round.type] || round.type}</span>
              </div>
              <span className="text-gray-600">|</span>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <BsClockHistory className="w-4 h-4" />
                <span>
                  Created{' '}
                  {new Date(round.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <span className="text-gray-600">|</span>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <BsPeople className="w-4 h-4" />
                <span>
                  {progress.submitted}/{progress.total} reviewed
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${progress.total > 0 ? (progress.submitted / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Reviewers Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BsPeople className="w-5 h-5 text-purple-400" />
              Reviewers
            </h3>
            <div className="space-y-3">
              {round.reviews.map((review, index) => {
                const reviewerStatus = REVIEWER_STATUS[review.status] || REVIEWER_STATUS.PENDING;
                const ReviewerIcon = reviewerStatus.icon;
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-gray-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium text-xs">
                          {review.reviewer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{review.reviewer.name}</p>
                        <p className="text-xs text-gray-400">{review.reviewer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.status === 'SUBMITTED' && review.score !== undefined && (
                        <div className="flex items-center gap-1 mr-2">
                          <BsStarFill className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-400">{review.score}/5</span>
                        </div>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${reviewerStatus.bg} ${reviewerStatus.color} border ${reviewerStatus.border}`}
                      >
                        <ReviewerIcon className="w-3 h-3" />
                        {reviewerStatus.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Aggregated Results (only when COMPLETED) */}
          {round.status === 'COMPLETED' && aggregated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {/* Score Overview */}
              <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-green-500/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BsTrophy className="w-5 h-5 text-yellow-400" />
                  Aggregated Results
                </h3>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">{aggregated.averageScore.toFixed(1)}</p>
                    <div className="mt-1">{renderStars(aggregated.averageScore)}</div>
                    <p className="text-xs text-gray-400 mt-1">Average Score</p>
                  </div>
                  <div className="h-16 w-px bg-gray-700/50" />
                  <div>
                    <p className="text-sm text-gray-400">
                      Based on <span className="text-white font-medium">{aggregated.submittedCount}</span> reviewer
                      {aggregated.submittedCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comments */}
              {aggregated.allComments.length > 0 && (
                <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <BsChatDots className="w-4 h-4 text-purple-400" />
                    Comments
                  </h3>
                  <div className="space-y-3">
                    {aggregated.allComments.map((comment, i) => (
                      <div
                        key={i}
                        className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/30"
                      >
                        <p className="text-sm text-gray-300 italic">"{comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {aggregated.allStrengths.length > 0 && (
                <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-green-500/20">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <BsLightbulb className="w-4 h-4 text-green-400" />
                    Strengths
                  </h3>
                  <div className="space-y-3">
                    {aggregated.allStrengths.map((strength, i) => (
                      <div
                        key={i}
                        className="p-3 bg-green-500/5 rounded-lg border border-green-500/20"
                      >
                        <p className="text-sm text-gray-300">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas for Improvement */}
              {aggregated.allImprovements.length > 0 && (
                <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/20">
                  <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                    <BsArrowUp className="w-4 h-4 text-yellow-400" />
                    Areas for Improvement
                  </h3>
                  <div className="space-y-3">
                    {aggregated.allImprovements.map((improvement, i) => (
                      <div
                        key={i}
                        className="p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20"
                      >
                        <p className="text-sm text-gray-300">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Cancel Confirmation Modal */}
          {showCancelConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={() => setShowCancelConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-sm p-6"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <BsExclamationTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Cancel Feedback Round</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Are you sure you want to cancel this feedback round? This action cannot be undone and all pending
                    reviews will be discarded.
                  </p>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Keep Round
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {cancelling ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <BsTrash className="w-3.5 h-3.5" />
                          Cancel Round
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
