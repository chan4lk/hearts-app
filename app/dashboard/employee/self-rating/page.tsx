"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Goal } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  BsStarFill,
  BsCheckCircle,
  BsClipboardData,
  BsBarChart,
  BsCalendar,
  BsFilter,
  BsGrid,
  BsList,
  BsStar,
  BsArrowUpRight,
  BsLightningCharge,
  BsTrophy,
  BsAward,
  BsGraphUp,
  BsPeople,
  BsRocket,
  BsLightbulb,
  BsBriefcase,
  BsBullseye
} from "react-icons/bs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";

interface GoalWithRating extends Goal {
  rating?: {
    id: string;
    score: number;
    comments: string;
    updatedAt?: Date;
  };
}

const RATING_COLORS = {
  1: 'bg-red-500/10 text-red-400',
  2: 'bg-orange-500/10 text-orange-400',
  3: 'bg-yellow-500/10 text-yellow-400',
  4: 'bg-blue-500/10 text-blue-400',
  5: 'bg-green-500/10 text-green-400'
};

const RATING_LABELS = {
  1: 'Needs Improvement',
  2: 'Below Average',
  3: 'Average',
  4: 'Above Average',
  5: 'Excellent'
};

const RATING_DESCRIPTIONS = {
  1: 'Performance is below expectations and needs significant improvement.',
  2: 'Performance is below average and requires improvement in several areas.',
  3: 'Performance meets basic expectations but could be improved.',
  4: 'Performance exceeds expectations in most areas.',
  5: 'Performance consistently exceeds expectations and demonstrates excellence.'
};

const RATING_HOVER_COLORS = {
  1: 'hover:bg-red-500/20 hover:text-red-300',
  2: 'hover:bg-orange-500/20 hover:text-orange-300',
  3: 'hover:bg-yellow-500/20 hover:text-yellow-300',
  4: 'hover:bg-blue-500/20 hover:text-blue-300',
  5: 'hover:bg-green-500/20 hover:text-green-300'
};

export default function SelfRatingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [ratingStatus, setRatingStatus] = useState<string>('all');
  const [ratingComments, setRatingComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    // Allow both employees and managers to access this page
    if (session.user?.role !== 'EMPLOYEE' && session.user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }

    fetchGoals();
  }, [session, router]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals/self");
      if (!response.ok) throw new Error("Failed to fetch goals");
      const data = await response.json();
      
      if (!data.goals || !Array.isArray(data.goals)) {
        throw new Error("Invalid response format");
      }
      
      // Transform goals to include ratings
      const goalsWithRatings = await Promise.all(data.goals.map(async (goal: Goal) => {
        try {
          const ratingResponse = await fetch(`/api/goals/${goal.id}/ratings`);
          if (ratingResponse.ok) {
            const ratingData = await ratingResponse.json();
            return {
              ...goal,
              rating: ratingData.ratings?.find((r: any) => r.selfRatedById === session?.user?.id)
            };
          }
          return goal;
        } catch (error) {
          console.error(`Error fetching rating for goal ${goal.id}:`, error);
          return goal;
        }
      }));
      
      setGoals(goalsWithRatings);
      toast.success("Goals loaded successfully");
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals. Please try again.");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfRating = async (goalId: string, value: number, comments: string = '') => {
    if (isNaN(value)) return;

    try {
      setSubmitting(prev => ({ ...prev, [goalId]: true }));

      const response = await fetch(`/api/goals/${goalId}/self-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: value,
          comments: comments || ratingComments[goalId] || ''
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update rating');
      }

      const updatedRating = await response.json();
      
      setGoals(goals.map(goal => 
        goal.id === goalId 
          ? { 
              ...goal, 
              rating: { 
                id: updatedRating.id, 
                score: value,
                comments: updatedRating.comments || '',
                updatedAt: updatedRating.updatedAt
              } 
            } 
          : goal
      ));

      // Clear comments for this goal after successful submission
      setRatingComments(prev => {
        const newComments = { ...prev };
        delete newComments[goalId];
        return newComments;
      });

      toast.success('Self-rating updated successfully');
    } catch (error: any) {
      console.error('Error updating rating:', error);
      toast.error(error.message || 'Failed to update rating');
    } finally {
      setSubmitting(prev => ({ ...prev, [goalId]: false }));
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filterStatus === 'all' && filterRating === 'all' && ratingStatus === 'all') return true;
    if (filterStatus !== 'all' && goal.status !== filterStatus) return false;
    if (filterRating !== 'all' && goal.rating?.score !== parseInt(filterRating)) return false;
    if (ratingStatus === 'rated' && !goal.rating) return false;
    if (ratingStatus === 'unrated' && goal.rating) return false;
    return true;
  });

  const getLayoutType = (role?: string): "manager" | "employee" | "admin" => {
    if (!role) return "employee";
    const roleLower = role.toLowerCase();
    if (roleLower === "manager" || roleLower === "employee" || roleLower === "admin") {
      return roleLower as "manager" | "employee" | "admin";
    }
    return "employee";
  };

  if (loading) {
    return (
      <DashboardLayout type={getLayoutType(session?.user?.role)}>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-pulse"></div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout type={getLayoutType(session?.user?.role)}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Floating Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl rounded-3xl p-8 text-white shadow-2xl border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl" />
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                      Self Rating
                    </h1>
                    <p className="text-xl text-indigo-100/90">
                      {session?.user?.role === 'MANAGER' 
                        ? 'Rate your performance on your goals'
                        : 'Rate your performance on assigned goals'}
                    </p>
                  </div>
                  <div className="mt-6 lg:mt-0 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                    >
                      <BsStarFill className="text-lg" />
                      Rate Goals
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                    >
                      <BsBarChart className="text-lg" />
                      View Stats
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg">
                    <BsClipboardData className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Goals</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {goals.length}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-3">
                  <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg">
                    <BsCheckCircle className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Rated Goals</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {goals.filter(g => g.rating?.score).length}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-400 mb-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-lg">
                    <BsBarChart className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Average Rating</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {goals.length > 0
                    ? (goals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0) / goals.length).toFixed(1)
                    : '0.0'}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Filters Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg">
                  <BsFilter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
              </div>
              
              {/* View Mode */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">View</span>
                <div className="flex bg-gray-100/50 dark:bg-gray-700/50 rounded-lg p-1 backdrop-blur-sm">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center w-8 h-8 rounded transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                    }`}
                    onClick={() => setViewMode('list')}
                  >
                    <BsList className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center w-8 h-8 rounded transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                    }`}
                    onClick={() => setViewMode('grid')}
                  >
                    <BsGrid className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-600/50">
                  <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50">All Statuses</SelectItem>
                  <SelectItem value="PENDING" className="text-amber-600 dark:text-amber-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Pending</SelectItem>
                  <SelectItem value="APPROVED" className="text-emerald-600 dark:text-emerald-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Approved</SelectItem>
                  <SelectItem value="REJECTED" className="text-rose-600 dark:text-rose-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Rejected</SelectItem>
                  <SelectItem value="COMPLETED" className="text-blue-600 dark:text-blue-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterRating}
                onValueChange={setFilterRating}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-600/50">
                  <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50">All Ratings</SelectItem>
                  <SelectItem value="1" className="text-red-600 dark:text-red-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Needs Improvement</SelectItem>
                  <SelectItem value="2" className="text-orange-600 dark:text-orange-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Below Average</SelectItem>
                  <SelectItem value="3" className="text-yellow-600 dark:text-yellow-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Average</SelectItem>
                  <SelectItem value="4" className="text-blue-600 dark:text-blue-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Above Average</SelectItem>
                  <SelectItem value="5" className="text-green-600 dark:text-green-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Excellent</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={ratingStatus}
                onValueChange={setRatingStatus}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300">
                  <SelectValue placeholder="Filter by rating status" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-600/50">
                  <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50">All Goals</SelectItem>
                  <SelectItem value="rated" className="text-emerald-600 dark:text-emerald-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Rated Goals</SelectItem>
                  <SelectItem value="unrated" className="text-amber-600 dark:text-amber-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50">Unrated Goals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Goals List */}
          <motion.div 
            variants={containerVariants}
            className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}
          >
            {filteredGoals.map((goal) => (
              <motion.div
                key={goal.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{goal.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap font-medium ${
                        goal.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                        goal.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        goal.status === 'REJECTED' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                        goal.status === 'MODIFIED' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                        'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Self Rating</Label>
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <motion.button
                            key={rating}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelfRating(goal.id, rating)}
                            disabled={submitting[goal.id]}
                            className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                              goal.rating?.score === rating
                                ? RATING_COLORS[rating as keyof typeof RATING_COLORS]
                                : 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 border border-gray-200/50 dark:border-gray-600/50'
                            } ${RATING_HOVER_COLORS[rating as keyof typeof RATING_HOVER_COLORS]} hover:shadow-lg`}
                          >
                            <BsStarFill className="w-4 h-4" />
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {goal.rating?.score && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50"
                      >
                        <p className={`text-sm font-medium mb-2 ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                          {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS]}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
} 