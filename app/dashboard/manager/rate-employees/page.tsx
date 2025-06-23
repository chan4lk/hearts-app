"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BsPersonLinesFill } from "react-icons/bs";
import { toast } from "sonner";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { GoalWithRating, EmployeeStats } from "./types";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import EmployeeFilter from "./components/EmployeeFilter";
import GoalCard from "./components/GoalCard";

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
    if (isNaN(value) || !goalId) {
      toast.error('Invalid rating value or goal ID');
      return;
    }

    try {
      setSubmitting(true);
      
      // First verify the goal exists and can be rated
      const goal = goals.find(g => g.id === goalId);
      if (!goal) {
        throw new Error('Goal not found');
      }

      const response = await fetch(`/api/goals/${goalId}/manager-rating`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          score: value,
          comments: ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to update rating');
      }

      const data = await response.json();

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

      // Update employee stats
      const stats = calculateEmployeeStats(goals.map(goal => 
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
      ));
      setEmployeeStats(stats);

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
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-pulse"></div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="manager">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Floating Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-6 space-y-8">
          <HeroSection />
          <StatsSection goals={goals} viewMode={viewMode} setViewMode={setViewMode} />
          <EmployeeFilter 
            filterEmployee={filterEmployee} 
            setFilterEmployee={setFilterEmployee} 
            employeeStats={employeeStats} 
          />

          {/* Goals Grid */}
          <AnimatePresence>
            {filteredGoals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/20 dark:border-gray-700/50 shadow-lg"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-700/50 dark:to-gray-600/50 mb-4">
                  <BsPersonLinesFill className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No goals found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filterEmployee !== 'all'
                    ? "This employee has no goals to rate"
                    : "There are no goals available for rating"}
                </p>
              </motion.div>
            ) : (
              <motion.div 
                initial="hidden"
                animate="visible"
                className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}
              >
                {filteredGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    submitting={submitting}
                    onRatingChange={handleRatingChange}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
} 