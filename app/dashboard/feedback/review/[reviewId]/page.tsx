'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsStarFill,
  BsStar,
  BsChatDots,
  BsPerson,
  BsLightbulb,
  BsArrowUp,
  BsSend,
  BsCalendar3,
  BsCalendarCheck,
  BsCheckCircle,
  BsExclamationCircle,
} from 'react-icons/bs';

interface ReviewDetail {
  id: string;
  roundId: string;
  reviewerId: string;
  status: string;
  score?: number;
  comments?: string;
  strengths?: string;
  improvements?: string;
  submittedAt?: string;
  round: {
    id: string;
    type: string;
    status: string;
    employee: {
      id: string;
      name: string;
      email: string;
      department?: string;
      position?: string;
    };
  };
}

const TYPE_LABELS: Record<string, string> = {
  THREE_MONTH: '3-Month Review',
  ANNUAL: 'Annual Review',
};

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
};

const RATING_COLORS: Record<number, { text: string; bg: string; border: string }> = {
  1: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  2: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  3: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  4: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  5: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
};

export default function FeedbackReviewPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const reviewId = params?.reviewId as string;

  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [score, setScore] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [comments, setComments] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  const [errors, setErrors] = useState<{ score?: string; comments?: string }>({});

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (reviewId) {
      fetchReview();
    }
  }, [session, sessionStatus, router, reviewId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feedback-reviews/${reviewId}`);
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('You are not authorized to access this review');
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch review');
      }
      const data = await response.json();
      setReview(data);

      // Pre-fill if already submitted (for viewing)
      if (data.score) setScore(data.score);
      if (data.comments) setComments(data.comments);
      if (data.strengths) setStrengths(data.strengths);
      if (data.improvements) setImprovements(data.improvements);
    } catch (error) {
      console.error('Error fetching review:', error);
      toast.error('Failed to load review details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { score?: string; comments?: string } = {};

    if (score === 0) {
      newErrors.score = 'Please select a rating';
    }
    if (!comments.trim() || comments.trim().length < 10) {
      newErrors.comments = 'Comments must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/feedback-reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          comments: comments.trim(),
          strengths: strengths.trim() || undefined,
          improvements: improvements.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit review');
      }

      toast.success('Feedback submitted successfully!');
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getDashboardType = (): 'employee' | 'manager' => {
    if (session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN') {
      return 'manager';
    }
    return 'employee';
  };

  const isAlreadySubmitted = review?.status === 'SUBMITTED';

  if (loading) {
    return (
      <DashboardLayout type={session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN' ? 'manager' : 'employee'}>
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading review...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!review) {
    return (
      <DashboardLayout type={getDashboardType()}>
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <BsChatDots className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Review Not Found</h3>
            <p className="text-sm text-gray-400">This review does not exist or you do not have access.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type={getDashboardType()}>
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-4 py-3 space-y-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 shadow-lg"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <BsChatDots className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">360 Feedback Review</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-base">
                    {review.round.employee.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold">{review.round.employee.name}</p>
                  <div className="flex items-center gap-2 text-white/80 text-xs mt-0.5">
                    {review.round.type === 'THREE_MONTH' ? (
                      <BsCalendar3 className="w-3 h-3" />
                    ) : (
                      <BsCalendarCheck className="w-3 h-3" />
                    )}
                    <span>{TYPE_LABELS[review.round.type] || review.round.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Already Submitted Banner */}
          {isAlreadySubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3"
            >
              <BsCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-400">Review Already Submitted</p>
                <p className="text-xs text-gray-400">
                  You submitted this review on{' '}
                  {review.submittedAt
                    ? new Date(review.submittedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'a previous date'}
                  . Your feedback is shown below for reference.
                </p>
              </div>
            </motion.div>
          )}

          {/* Rating Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <BsStarFill className="w-4 h-4 text-yellow-400" />
              <h3 className="text-base font-bold text-white">Overall Rating</h3>
              {errors.score && (
                <span className="text-xs text-red-400 ml-auto flex items-center gap-1">
                  <BsExclamationCircle className="w-3 h-3" />
                  {errors.score}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoveredStar || score);
                const ratingColor = RATING_COLORS[hoveredStar || score] || { text: 'text-gray-600' };
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={isAlreadySubmitted}
                    onMouseEnter={() => !isAlreadySubmitted && setHoveredStar(star)}
                    onMouseLeave={() => !isAlreadySubmitted && setHoveredStar(0)}
                    onClick={() => {
                      if (!isAlreadySubmitted) {
                        setScore(star);
                        setErrors((prev) => ({ ...prev, score: undefined }));
                      }
                    }}
                    className={`transition-all transform ${
                      isAlreadySubmitted ? 'cursor-default' : 'cursor-pointer hover:scale-125'
                    }`}
                  >
                    {isActive ? (
                      <BsStarFill className={`w-10 h-10 ${ratingColor.text} transition-colors`} />
                    ) : (
                      <BsStar className="w-10 h-10 text-gray-600 hover:text-gray-500 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>

            {(hoveredStar > 0 || score > 0) && (
              <div className="text-center">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    RATING_COLORS[hoveredStar || score]?.bg || ''
                  } ${RATING_COLORS[hoveredStar || score]?.text || ''} border ${
                    RATING_COLORS[hoveredStar || score]?.border || ''
                  }`}
                >
                  {RATING_LABELS[hoveredStar || score]}
                </span>
              </div>
            )}
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <BsChatDots className="w-4 h-4 text-purple-400" />
              <h3 className="text-base font-bold text-white">Comments</h3>
              <span className="text-xs text-red-400 ml-1">*</span>
            </div>
            {errors.comments && (
              <p className="text-xs text-red-400 mb-2 flex items-center gap-1">
                <BsExclamationCircle className="w-3 h-3" />
                {errors.comments}
              </p>
            )}
            <textarea
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                if (e.target.value.trim().length >= 10) {
                  setErrors((prev) => ({ ...prev, comments: undefined }));
                }
              }}
              disabled={isAlreadySubmitted}
              placeholder="Share your feedback about this person's performance, collaboration, and contributions..."
              rows={4}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors resize-none ${
                errors.comments ? 'border-red-500/50' : 'border-gray-700/50'
              } ${isAlreadySubmitted ? 'opacity-70 cursor-default' : ''}`}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comments.length} characters {comments.length < 10 && '(min 10)'}
            </p>
          </motion.div>

          {/* Strengths Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <BsLightbulb className="w-4 h-4 text-green-400" />
              <h3 className="text-base font-bold text-white">Strengths</h3>
              <span className="text-xs text-gray-500 ml-1">(Optional)</span>
            </div>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              disabled={isAlreadySubmitted}
              placeholder="What does this person do well? What are their key strengths?"
              rows={3}
              className={`w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500/50 transition-colors resize-none ${
                isAlreadySubmitted ? 'opacity-70 cursor-default' : ''
              }`}
            />
          </motion.div>

          {/* Areas for Improvement */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <BsArrowUp className="w-4 h-4 text-yellow-400" />
              <h3 className="text-base font-bold text-white">Areas for Improvement</h3>
              <span className="text-xs text-gray-500 ml-1">(Optional)</span>
            </div>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              disabled={isAlreadySubmitted}
              placeholder="What areas could this person improve in? Any constructive suggestions?"
              rows={3}
              className={`w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-500/50 transition-colors resize-none ${
                isAlreadySubmitted ? 'opacity-70 cursor-default' : ''
              }`}
            />
          </motion.div>

          {/* Submit Button */}
          {!isAlreadySubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex justify-end pb-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <BsSend className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
