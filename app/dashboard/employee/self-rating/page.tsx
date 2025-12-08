"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { toast } from "sonner";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { HeroSection } from "./components/HeroSection";
import { StatsSection } from "./components/StatsSection";
import Filters from "./components/Filters";
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { Pagination } from '@/app/components/shared/Pagination';
import { Goal, FilterStatus, RatingStatus, FilterRating } from "@/app/components/shared/types";
import { BsX, BsPersonCheck, BsStarFill, BsArrowRight, BsStar } from 'react-icons/bs';

export default function SelfRatingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [submittingRatingId, setSubmittingRatingId] = useState<string | null>(null);
  const [ratingComments, setRatingComments] = useState<Record<string, string>>({});
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalsVersion, setGoalsVersion] = useState(0); // Version counter to force table refresh
  
  // Initialize with type-safe values
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [ratingStatus, setRatingStatus] = useState<RatingStatus>('all');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showSelfRatingsModal, setShowSelfRatingsModal] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (!['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(session.user.role)) {
      toast.error('You do not have permission to access this page');
      router.push('/dashboard');
      return;
    }
    fetchGoals();
  }, [session, router, status]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      
      // Build query params with pagination and filters
      const params = new URLSearchParams({
        view: 'my-goals',
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(filterStatus && filterStatus !== 'all' && { status: filterStatus }),
        ...(selectedPriority && { priority: selectedPriority })
      });
      
      const goalsResponse = await fetch(`/api/goals?${params}`);

      if (!goalsResponse.ok) {
        throw new Error("Failed to fetch goals");
      }

      const goalsData = await goalsResponse.json();
      
      if (!goalsData.goals || !Array.isArray(goalsData.goals)) {
        throw new Error("Invalid goals response format");
      }

      // Use all goals from the API (already filtered by employeeId in the API)
      // This includes both assigned goals and self-created goals
      const allEmployeeGoals = goalsData.goals;
      
      // Set pagination if available
      if (goalsData.pagination) {
        setPagination(goalsData.pagination);
      }

      let ratingsData = { ratings: [] };
      try {
        const ratingsResponse = await fetch("/api/goals/ratings/self");
        if (ratingsResponse.ok) {
          ratingsData = await ratingsResponse.json();
        }
      } catch (error) {
        console.warn('Failed to fetch ratings, proceeding without them:', error);
      }

      const goalsWithRatings = allEmployeeGoals.map((goal: Goal) => ({
        ...goal,
        rating: ratingsData.ratings?.find((r: any) => r.goalId === goal.id) || goal.rating
      }));
      
      setGoals(goalsWithRatings);
      toast.success("Goals loaded successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load goals";
      toast.error(message);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfRating = async (goalId: string, value: number) => {
    if (isNaN(value) || submittingRatingId === goalId) return;

    // Find the current goal to preserve fields
    const currentGoal = goals.find(g => g.id === goalId);
    if (!currentGoal) {
      toast.error('Goal not found');
      return;
    }

    const isClearingRating = value === 0;

    // OPTIMISTIC UPDATE: Update UI immediately before API call
    const optimisticRating = isClearingRating ? {
      ...(currentGoal.rating || {}),
      id: currentGoal.rating?.id || null,
      selfScore: null,
      score: currentGoal.rating?.managerScore || null, // Keep manager score if exists
      selfComments: null,
      comments: currentGoal.rating?.managerComments || currentGoal.rating?.comments || null,
      selfRatedAt: null,
      updatedAt: new Date().toISOString(),
      goalId: goalId
    } : {
      ...(currentGoal.rating || {}),
      id: currentGoal.rating?.id || 'temp',
      selfScore: value,
      score: value, // Keep for backward compatibility
      selfComments: ratingComments[goalId] || currentGoal.rating?.selfComments || '',
      comments: ratingComments[goalId] || currentGoal.rating?.comments || '',
      selfRatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      goalId: goalId
    };

    const optimisticGoal: Goal = {
      ...currentGoal,
      rating: isClearingRating && !currentGoal.rating?.managerScore ? null : optimisticRating as any
    };

    // Update local state IMMEDIATELY (optimistic update)
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? optimisticGoal : goal
      )
    );

    setSubmittingRatingId(goalId);

    try {
      const response = await fetch(`/api/goals/${goalId}/self-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: isClearingRating ? 0 : value,
          comments: isClearingRating ? null : (ratingComments[goalId] || '')
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update rating');
      }

      const updatedRating = await response.json();

      // Update with server response (sync with server)
      // Force a complete refresh by creating new goal objects to ensure React detects changes
      setGoals(prevGoals =>
        prevGoals.map(goal => {
          if (goal.id !== goalId) return goal;

          // If rating was cleared and no manager rating exists, set rating to null
          if (isClearingRating && !updatedRating.managerScore && !updatedRating.id) {
            return {
              ...goal,
              rating: null,
              updatedAt: new Date().toISOString() // Force update timestamp
            };
          }

          // Otherwise, update with server response - create completely new object to force re-render
          const updatedGoal: Goal = {
                ...goal,
            rating: updatedRating.id ? {
                  id: updatedRating.id,
              goalId: goalId,
              selfScore: updatedRating.selfScore || null,
              score: updatedRating.score || updatedRating.selfScore || updatedRating.managerScore || null,
              managerScore: updatedRating.managerScore || goal.rating?.managerScore || null,
              selfComments: updatedRating.selfComments || updatedRating.comments || null,
              comments: updatedRating.comments || updatedRating.selfComments || updatedRating.managerComments || null,
              managerComments: updatedRating.managerComments || goal.rating?.managerComments || null,
              selfRatedAt: updatedRating.selfRatedAt || null,
              managerRatedAt: updatedRating.managerRatedAt || goal.rating?.managerRatedAt || null,
              updatedAt: updatedRating.updatedAt || new Date().toISOString(),
              createdAt: goal.rating?.createdAt || new Date().toISOString()
            } as any : null,
            updatedAt: new Date().toISOString() // Force update timestamp
          };

          return updatedGoal;
        })
      );

      setRatingComments(prev => {
        const newComments = { ...prev };
        delete newComments[goalId];
        return newComments;
      });

      // Increment version to force table refresh
      setGoalsVersion(prev => prev + 1);

      if (isClearingRating) {
        toast.success('Self-rating cleared');
      } else {
      toast.success(`Self-rating updated to ${value} stars`);
      }
    } catch (error) {
      // REVERT optimistic update on error
      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? currentGoal : goal
        )
      );
      
      const message = error instanceof Error ? error.message : 'Failed to update rating';
      toast.error(message);
    } finally {
      setSubmittingRatingId(null);
    }
  };

  const filteredGoals = useMemo(() => {
    // Show all goals assigned to the employee (both assigned and self-created)
    return goals.filter(goal => {
      const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
      const matchesRating = filterRating === 'all' || goal.rating?.selfScore === parseInt(filterRating) || goal.rating?.score === parseInt(filterRating);
      const matchesRatingStatus = 
        ratingStatus === 'all' || 
        (ratingStatus === 'rated' && (goal.rating?.selfScore || goal.rating?.score)) || 
        (ratingStatus === 'unrated' && !goal.rating?.selfScore && !goal.rating?.score);
      const matchesPriority = !selectedPriority || goal.priority === selectedPriority;
      
      return matchesStatus && matchesRating && matchesRatingStatus && matchesPriority;
    });
  }, [goals, filterStatus, filterRating, ratingStatus, selectedPriority, session?.user?.id]);

  const stats = useMemo(() => {
    const ratedGoals = goals.filter(g => g.rating?.score);
    const totalRating = ratedGoals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0);
    const averageRating = ratedGoals.length > 0 ? (totalRating / ratedGoals.length).toFixed(1) : '0.0';

    return {
      total: goals.length,
      rated: ratedGoals.length,
      average: averageRating
    };
  }, [goals]);

  const getLayoutType = (role?: string): "manager" | "employee" | "admin" => {
    if (!role) return "employee";
    const roleLower = role.toLowerCase();
    if (roleLower === "manager" || roleLower === "employee" || roleLower === "admin") {
      return roleLower as "manager" | "employee" | "admin";
    }
    return "employee";
  };
  return (
    <DashboardLayout type="employee">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
          {/* Hero Section */}
          <HeroSection userRole={session?.user?.role} />

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StatsSection goals={goals} onViewSelfRatings={() => setShowSelfRatingsModal(true)} />
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Filters
              selectedStatus={filterStatus === 'all' ? '' : filterStatus}
              onStatusChange={(value) => setFilterStatus(value === '' ? 'all' : value as FilterStatus)}
              selectedRating={filterRating === 'all' ? '' : filterRating}
              onRatingChange={(value) => setFilterRating(value === '' ? 'all' : value as FilterRating)}
              selectedRatingStatus={ratingStatus === 'all' ? '' : ratingStatus}
              onRatingStatusChange={(value) => setRatingStatus(value === '' ? 'all' : value as RatingStatus)}
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
            />
          </motion.div>

          {/* Goals Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl">
              <div className="p-4">
                <GoalsTable
                  key={`goals-table-v${goalsVersion}`}
                  goals={filteredGoals}
                  selectedStatus={filterStatus === 'all' ? '' : filterStatus}
                  onStatusChange={(status) => {
                    setFilterStatus(status === '' ? 'all' : status as FilterStatus);
                    setPage(1); // Reset to first page on filter change
                  }}
                  onGoalClick={(goal) => setSelectedGoal(goal as Goal)}
                  onStatusUpdate={(goalId, newStatus, updatedGoal) => {
                    setGoals(prevGoals =>
                      prevGoals.map(goal =>
                        goal.id === goalId ? { ...goal, status: updatedGoal.status, updatedAt: new Date().toISOString() } : goal
                      )
                    );
                  }}
                  showRating={true}
                  onRatingChange={handleSelfRating}
                  submittingRating={submittingRatingId}
                  showActions={false}
                />
                
                {/* Pagination */}
                {pagination && (
                  <div className="mt-6 pt-4 border-t border-gray-700/50">
                    <Pagination
                      page={pagination.page}
                      limit={pagination.limit}
                      total={pagination.total}
                      totalPages={pagination.totalPages}
                      hasNext={pagination.hasNext}
                      hasPrev={pagination.hasPrev}
                      onPageChange={(newPage) => {
                        setPage(newPage);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onLimitChange={(newLimit) => {
                        setLimit(newLimit);
                        setPage(1);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Goal Detail Modal with Rating */}
          <AnimatePresence>
            {selectedGoal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                onClick={() => setSelectedGoal(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-2xl border border-white/10"
                >
                  <GoalDetailModal
                    goal={selectedGoal}
                    onClose={() => setSelectedGoal(null)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Self Ratings Modal */}
          <AnimatePresence>
            {showSelfRatingsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4"
                onClick={() => setShowSelfRatingsModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border-2 border-yellow-500/40 flex flex-col"
                >
                  {/* Compact Header - Sticky */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-yellow-900/40 via-yellow-800/40 to-orange-900/40 backdrop-blur-md border-b-2 border-yellow-500/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg">
                        <BsStar className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Self Ratings</h3>
                        <p className="text-[11px] text-yellow-200/80">
                          {(() => {
                            const ratedGoals = goals.filter(goal => goal.rating?.selfScore || goal.rating?.score);
                            const totalRating = ratedGoals.reduce((acc, goal) => acc + (goal.rating?.selfScore || goal.rating?.score || 0), 0);
                            const averageRating = ratedGoals.length > 0 ? (totalRating / ratedGoals.length).toFixed(1) : '0.0';
                            return `${ratedGoals.length} rated • Avg: ${averageRating}/5`;
                          })()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSelfRatingsModal(false)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="Close"
                    >
                      <BsX className="w-5 h-5 text-gray-300 hover:text-white" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto flex-1 p-4">
                    {(() => {
                      // Show all goals (both assigned and self-created) that have self ratings
                      const ratedGoals = goals.filter(goal => goal.rating?.selfScore || goal.rating?.score);
                      
                      if (ratedGoals.length === 0) {
                        return (
                          <div className="text-center py-16">
                            <div className="mb-4 inline-flex p-4 bg-yellow-500/10 rounded-full">
                              <BsStar className="w-12 h-12 text-yellow-400/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Self Ratings Yet</h3>
                            <p className="text-sm text-gray-400">You haven't rated any goals yet. Start rating your goals to track your progress.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {ratedGoals.map((goal, index) => {
                            const rating = goal.rating?.selfScore || goal.rating?.score || 0;
                            const ratingColors = {
                              1: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: 'from-red-500 to-red-600' },
                              2: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: 'from-orange-500 to-orange-600' },
                              3: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: 'from-yellow-500 to-yellow-600' },
                              4: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: 'from-blue-500 to-blue-600' },
                              5: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', icon: 'from-green-500 to-green-600' }
                            };
                            const ratingStyle = ratingColors[rating as keyof typeof ratingColors] || { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', icon: 'from-gray-500 to-gray-600' };
                            const ratingLabels = {
                              1: "Needs Improvement",
                              2: "Below Average",
                              3: "Average",
                              4: "Above Average",
                              5: "Excellent"
                            };

                            return (
                              <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.01, y: -2 }}
                                onClick={() => {
                                  setSelectedGoal(goal);
                                  // Keep self ratings modal open
                                }}
                                className="group relative bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border-2 border-gray-700/50 hover:border-yellow-500/60 transition-all cursor-pointer hover:shadow-lg hover:shadow-yellow-500/10"
                              >
                                {/* Rating Badge */}
                                <div className="absolute top-3 right-3">
                                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${ratingStyle.bg} border ${ratingStyle.border} backdrop-blur-sm`}>
                                    <div className={`p-1 rounded bg-gradient-to-r ${ratingStyle.icon}`}>
                                      <BsStarFill className="w-3 h-3 text-white" />
                                    </div>
                                    <span className={`text-sm font-bold ${ratingStyle.text}`}>{rating}/5</span>
                                  </div>
                                </div>

                                <div className="pr-20">
                                  {/* Goal Title */}
                                  <h4 className="text-base font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors line-clamp-1">
                                    {goal.title}
                                  </h4>
                                  
                                  {/* Description */}
                                  {goal.description && (
                                    <p className="text-sm text-gray-400 line-clamp-2 mb-3 group-hover:text-gray-300 transition-colors">
                                      {goal.description}
                                    </p>
                                  )}

                                  {/* Rating Details */}
                                  <div className="flex items-center gap-3 flex-wrap mb-3">
                                    <div className={`px-2.5 py-1 rounded-md ${ratingStyle.bg} border ${ratingStyle.border}`}>
                                      <span className={`text-xs font-semibold ${ratingStyle.text}`}>
                                        {ratingLabels[rating as keyof typeof ratingLabels] || 'Not Rated'}
                                      </span>
                                    </div>
                                    {goal.rating?.selfRatedAt && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(goal.rating.selfRatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    )}
                                  </div>

                                  {/* Self Comments */}
                                  {(goal.rating?.selfComments || goal.rating?.comments) && (
                                    <div className="mt-3 p-3 bg-black/30 rounded-lg border border-yellow-500/20">
                                      <div className="flex items-start gap-2">
                                        <div className="p-1 bg-yellow-500/20 rounded flex-shrink-0 mt-0.5">
                                          <BsStar className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <p className="text-sm text-gray-300 italic flex-1">
                                          "{goal.rating?.selfComments || goal.rating?.comments}"
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Click Indicator */}
                                  <div className="mt-3 flex items-center gap-2 text-xs text-yellow-400/70 group-hover:text-yellow-400 transition-colors">
                                    <span>View details</span>
                                    <BsArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
} 