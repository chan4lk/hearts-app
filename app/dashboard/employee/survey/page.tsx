'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsClipboard2Check,
  BsClipboard2,
  BsCheckCircle,
  BsClock,
  BsSend,
  BsChevronDown,
  BsChevronUp,
  BsQuestionCircle,
} from 'react-icons/bs';

interface SurveyResponse {
  question: string;
  answer: string;
}

interface Survey {
  id: string;
  title?: string;
  status: 'PENDING' | 'SUBMITTED';
  responses?: SurveyResponse[] | string;
  createdAt: string;
  updatedAt: string;
}

const SURVEY_QUESTIONS = [
  'How would you rate your onboarding experience?',
  'Are the job expectations clear to you?',
  'How is the communication with your team and manager?',
  'What suggestions do you have for improvement?',
  'How would you describe the company culture?',
];

export default function SurveyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [expandedSurveyId, setExpandedSurveyId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(session.user.role)) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Fetch surveys
  useEffect(() => {
    if (session) {
      fetchSurveys();
    }
  }, [session]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/surveys');
      if (!response.ok) throw new Error('Failed to fetch surveys');
      const data = await response.json();
      const surveyList: Survey[] = data.surveys || data || [];
      setSurveys(surveyList);

      // Initialize answers for pending surveys
      const initialAnswers: Record<string, string[]> = {};
      surveyList.forEach((survey: Survey) => {
        if (survey.status === 'PENDING') {
          initialAnswers[survey.id] = SURVEY_QUESTIONS.map(() => '');
        }
      });
      setAnswers(initialAnswers);

      // Auto-expand the first pending survey
      const firstPending = surveyList.find((s: Survey) => s.status === 'PENDING');
      if (firstPending) {
        setExpandedSurveyId(firstPending.id);
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (surveyId: string, questionIndex: number, value: string) => {
    setAnswers((prev) => {
      const surveyAnswers = [...(prev[surveyId] || SURVEY_QUESTIONS.map(() => ''))];
      surveyAnswers[questionIndex] = value;
      return { ...prev, [surveyId]: surveyAnswers };
    });
  };

  const handleSubmitSurvey = async (surveyId: string) => {
    const surveyAnswers = answers[surveyId];
    if (!surveyAnswers) return;

    // Validate all questions have answers
    const unanswered = surveyAnswers.findIndex((a) => !a.trim());
    if (unanswered !== -1) {
      toast.error(`Please answer question ${unanswered + 1}`);
      return;
    }

    setSubmittingId(surveyId);
    try {
      const responses = SURVEY_QUESTIONS.map((question, index) => ({
        question,
        answer: surveyAnswers[index],
      }));

      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit survey');
      }

      toast.success('Survey submitted successfully');
      await fetchSurveys();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit survey';
      toast.error(message);
    } finally {
      setSubmittingId(null);
    }
  };

  const parseResponses = (responses: SurveyResponse[] | string | undefined): SurveyResponse[] => {
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

  const pendingSurveys = surveys.filter((s) => s.status === 'PENDING');
  const submittedSurveys = surveys.filter((s) => s.status === 'SUBMITTED');

  if (status === 'loading' || !session) {
    return (
      <DashboardLayout type="employee">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="employee">
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-3 space-y-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-5 shadow-lg"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            </div>
            <div className="relative space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BsClipboard2Check className="w-6 h-6" />
                Employee Surveys
              </h2>
              <p className="text-white/80 text-sm">
                Share your feedback to help us improve the workplace
              </p>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <BsClock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{pendingSurveys.length}</p>
                  <p className="text-xs text-gray-400">Pending Surveys</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <BsCheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{submittedSurveys.length}</p>
                  <p className="text-xs text-gray-400">Completed</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 bg-gray-900/80 backdrop-blur-sm rounded-lg px-5 py-3">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-sm">Loading surveys...</span>
              </div>
            </div>
          ) : surveys.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-12 border border-gray-700/50 shadow-xl text-center"
            >
              <BsClipboard2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Surveys Available</h3>
              <p className="text-sm text-gray-500">
                There are no surveys assigned to you at this time.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Pending Surveys */}
              {pendingSurveys.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <BsClock className="w-4 h-4" />
                    Pending Surveys ({pendingSurveys.length})
                  </h3>

                  {pendingSurveys.map((survey, surveyIndex) => {
                    const isExpanded = expandedSurveyId === survey.id;
                    const surveyAnswers = answers[survey.id] || SURVEY_QUESTIONS.map(() => '');

                    return (
                      <motion.div
                        key={survey.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: surveyIndex * 0.05 }}
                        className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl border border-amber-500/30 shadow-xl overflow-hidden"
                      >
                        {/* Survey Header */}
                        <button
                          onClick={() => setExpandedSurveyId(isExpanded ? null : survey.id)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                              <BsClipboard2 className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">
                                {survey.title || 'Employee Survey'}
                              </h4>
                              <p className="text-xs text-gray-400">
                                Created{' '}
                                {new Date(survey.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">
                              Pending
                            </span>
                            {isExpanded ? (
                              <BsChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <BsChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {/* Survey Form */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 space-y-5 border-t border-gray-700/50 pt-4">
                                {SURVEY_QUESTIONS.map((question, qIndex) => (
                                  <div key={qIndex}>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                      <span className="inline-flex items-center gap-1.5">
                                        <BsQuestionCircle className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-purple-400 font-semibold">
                                          Q{qIndex + 1}.
                                        </span>{' '}
                                        {question}
                                      </span>
                                    </label>
                                    <textarea
                                      value={surveyAnswers[qIndex]}
                                      onChange={(e) =>
                                        handleAnswerChange(survey.id, qIndex, e.target.value)
                                      }
                                      placeholder="Type your answer here..."
                                      rows={3}
                                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                                    />
                                  </div>
                                ))}

                                {/* Submit Button */}
                                <div className="flex justify-end pt-2">
                                  <button
                                    onClick={() => handleSubmitSurvey(survey.id)}
                                    disabled={submittingId === survey.id}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {submittingId === survey.id ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                      </>
                                    ) : (
                                      <>
                                        <BsSend className="w-4 h-4" />
                                        Submit Survey
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Submitted Surveys */}
              {submittedSurveys.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider flex items-center gap-2">
                    <BsCheckCircle className="w-4 h-4" />
                    Completed Surveys ({submittedSurveys.length})
                  </h3>

                  {submittedSurveys.map((survey, surveyIndex) => {
                    const isExpanded = expandedSurveyId === survey.id;
                    const parsedResponses = parseResponses(survey.responses);

                    return (
                      <motion.div
                        key={survey.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: surveyIndex * 0.05 }}
                        className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl border border-green-500/20 shadow-xl overflow-hidden"
                      >
                        {/* Survey Header */}
                        <button
                          onClick={() => setExpandedSurveyId(isExpanded ? null : survey.id)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <BsCheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">
                                {survey.title || 'Employee Survey'}
                              </h4>
                              <p className="text-xs text-gray-400">
                                Submitted{' '}
                                {new Date(survey.updatedAt || survey.createdAt).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-md border border-green-500/30">
                              Submitted
                            </span>
                            {isExpanded ? (
                              <BsChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <BsChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {/* Read-only Responses */}
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
                                {parsedResponses.length > 0 ? (
                                  parsedResponses.map((response, rIndex) => (
                                    <div key={rIndex}>
                                      <p className="text-sm font-medium text-gray-300 mb-1.5 flex items-start gap-1.5">
                                        <BsQuestionCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span>
                                          <span className="text-green-400 font-semibold">
                                            Q{rIndex + 1}.
                                          </span>{' '}
                                          {response.question}
                                        </span>
                                      </p>
                                      <p className="text-sm text-gray-400 bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 ml-5">
                                        {response.answer}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-500 italic">
                                    No responses recorded.
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
