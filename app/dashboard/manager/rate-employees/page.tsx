"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Goal, Rating, User } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  BsPersonLinesFill,
  BsStar,
  BsStarFill,
  BsCheck2Circle,
  BsExclamationCircle,
  BsArrowRight,
  BsFilter,
  BsGrid,
  BsList,
  BsCheckCircle,
  BsHourglassSplit,
  BsClipboardData,
  BsBarChart,
  BsCalendar,
  BsLightningCharge,
  BsStars,
  BsPeople,
  BsRocket,
  BsLightbulb,
  BsBriefcase,
  BsBullseye,
  BsArrowUpRight,
  BsTrophy,
  BsAward,
  BsGraphUp
} from "react-icons/bs";

interface GoalWithRating extends Goal {
  rating?: {
    id: string;
    score: number;
    comments?: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface EmployeeStats {
  id: string;
  name: string;
  totalGoals: number;
  ratedGoals: number;
}

const RATING_LABELS = {
  1: "Needs Improvement",
  2: "Below Expectations",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding"
} as const;

const RATING_DESCRIPTIONS = {
  1: "Performance consistently falls below expected standards. Significant improvement needed in key areas.",
  2: "Performance occasionally meets standards but improvement is needed to fully meet expectations.",
  3: "Performance consistently meets job requirements and expectations. Demonstrates solid competence.",
  4: "Performance frequently exceeds job requirements. Demonstrates strong skills and initiative.",
  5: "Performance consistently exceeds all expectations. Demonstrates exceptional achievements."
} as const;

const RATING_COLORS = {
  1: "text-red-400 border-red-500 bg-red-500/10",
  2: "text-orange-400 border-orange-500 bg-orange-500/10",
  3: "text-yellow-400 border-yellow-500 bg-yellow-500/10",
  4: "text-green-400 border-green-500 bg-green-500/10",
  5: "text-blue-400 border-blue-500 bg-blue-500/10"
} as const;

const RATING_HOVER_COLORS = {
  1: "hover:bg-red-500 hover:text-white",
  2: "hover:bg-orange-500 hover:text-white",
  3: "hover:bg-yellow-500 hover:text-white",
  4: "hover:bg-green-500 hover:text-white",
  5: "hover:bg-blue-500 hover:text-white"
} as const;

export default function RateEmployeesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }

    fetchEmployeeGoals();
  }, [session, router]);

  useEffect(() => {
    const stats = calculateEmployeeStats(goals);
    setEmployeeStats(stats);
  }, [goals]);

  const calculateEmployeeStats = (goals: GoalWithRating[]): EmployeeStats[] => {
    const statsMap = new Map<string, EmployeeStats>();
    
    goals.forEach(goal => {
      const { employee } = goal;
      const currentStats = statsMap.get(employee.id) || {
        id: employee.id,
        name: employee.name,
        totalGoals: 0,
        ratedGoals: 0
      };
      
      currentStats.totalGoals++;
      if (goal.rating?.score) {
        currentStats.ratedGoals++;
      }
      
      statsMap.set(employee.id, currentStats);
    });
    
    return Array.from(statsMap.values());
  };

  const fetchEmployeeGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals/manager");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch goals");
      }
      
      const data = await response.json();
      console.log('Fetched goals:', data); // Debug log
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: expected an array of goals");
      }
      
      setGoals(data);
      toast.success("Goals loaded successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load goals";
      console.error("Error fetching goals:", error);
      toast.error(errorMessage);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = async (goalId: string, value: number) => {
    if (isNaN(value)) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/goals/${goalId}/manager-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: value,
          comments: ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update rating');
      }

      // Update the goals state with the new rating
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                rating: { 
                  id: data.id, 
                  score: value,
                  comments: data.comments || ''
                } 
              } 
            : goal
        )
      );

      toast.success('Rating updated successfully');
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update rating');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filterEmployee !== 'all' && goal.employee.id !== filterEmployee) return false;
    if (filterRating !== 'all' && goal.rating?.score !== parseInt(filterRating)) return false;
    return true;
  });

  if (loading) {
    return (
      <DashboardLayout type="manager">
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
    <DashboardLayout type="manager">
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
                      Rate Employees
                    </h1>
                    <p className="text-xl text-indigo-100/90">Evaluate and provide feedback on employee performance</p>
                  </div>
                  <div className="mt-6 lg:mt-0 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                    >
                      <BsStars className="text-lg" />
                      Review Performance
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                    >
                      <BsBarChart className="text-lg" />
                      Analytics
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Header Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 rounded-xl">
                  <BsStarFill className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Performance Rating</h2>
                  <p className="text-gray-600 dark:text-gray-400">Evaluate and provide feedback on employee goals</p>
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">View Mode:</span>
                <div className="flex items-center gap-1 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm p-1 rounded-xl border border-white/20 dark:border-gray-600/50">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('list')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      viewMode === 'list' 
                        ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-md' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <BsList className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('grid')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-md' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <BsGrid className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <motion.div 
              variants={itemVariants}
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm border border-blue-200/20 dark:border-blue-600/20 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <BsClipboardData className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Goals</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm border border-emerald-200/20 dark:border-emerald-600/20 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <BsCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Rated Goals</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {goals.filter(g => g.rating?.score).length}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 backdrop-blur-sm border border-amber-200/20 dark:border-amber-600/20 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <BsBarChart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Average Rating</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {goals.length > 0
                    ? (goals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0) / goals.length).toFixed(1)
                    : '0.0'}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Employee Filter */}
          <motion.div variants={itemVariants} className="flex justify-end">
            <div className="relative group min-w-[280px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsFilter className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full rounded-xl">
                  <div className="flex items-center gap-2">
                    <BsPersonLinesFill className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <SelectValue placeholder="Filter by employee..." />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-600/50">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <BsPersonLinesFill className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">All Employees</span>
                    </div>
                  </SelectItem>
                  {employeeStats.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-2">
                          <BsPersonLinesFill className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{emp.name}</span>
                        </div>
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full">
                          {emp.ratedGoals}/{emp.totalGoals} rated
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Goals Grid */}
          <motion.div variants={itemVariants}>
            {filteredGoals.length === 0 ? (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/20 dark:border-gray-700/50 shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-700/50 dark:to-gray-600/50 mb-4">
                  <BsPersonLinesFill className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No goals found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filterEmployee !== 'all'
                    ? "This employee has no goals to rate"
                    : "There are no goals available for rating"}
                </p>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}
              >
                {filteredGoals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl"
                  >
                    <div className="p-6 space-y-4">
                      {/* Employee Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-lg">{goal.employee.name[0]}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{goal.employee.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{goal.employee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <BsCalendar className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(goal.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Goal Content */}
                      <div className="space-y-3">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {goal.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                          {goal.description}
                        </p>
                      </div>

                      {/* Rating Section */}
                      <div className="space-y-4 pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance Rating</Label>
                          {goal.rating?.score && (
                            <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                              {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <motion.button
                              key={rating}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRatingChange(goal.id, rating)}
                              disabled={submitting}
                              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                                goal.rating?.score === rating
                                  ? RATING_COLORS[rating as keyof typeof RATING_COLORS]
                                  : 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-600/50'
                              } ${RATING_HOVER_COLORS[rating as keyof typeof RATING_HOVER_COLORS]} ${
                                submitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                              }`}
                            >
                              <BsStarFill className="w-4 h-4" />
                              <span className="text-xs font-medium">{rating}</span>
                            </motion.button>
                          ))}
                        </div>

                        {goal.rating?.score && (
                          <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-600/50">
                            <p className={`text-sm font-medium mb-2 ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                              {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS]}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
} 