"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BsPersonLinesFill } from "react-icons/bs";
import { toast } from "sonner";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingComponent from '@/app/components/LoadingScreen';

import { GoalWithRatingExtended, EmployeeStats } from "@/app/components/shared/types";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import EmployeeFilter from "./components/EmployeeFilter";
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';

export default function RateEmployeesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithRatingExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithRatingExtended | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchEmployeeGoals();
  }, [session, router]);

  useEffect(() => {
    const stats = calculateEmployeeStats(goals);
    setEmployeeStats(stats);
  }, [goals]);

  const calculateEmployeeStats = (goals: GoalWithRatingExtended[]): EmployeeStats[] => {
    const statsMap = new Map<string, EmployeeStats>();

    goals.forEach(goal => {
      const { employee } = goal;
      const currentStats = statsMap.get(employee.id) || {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        totalGoals: 0,
        pendingGoals: 0,
        approvedGoals: 0,
        rejectedGoals: 0,
        ratedGoals: 0,
        isActive: true // Default to true since GoalWithRatingExtended doesn't include this info
      };

      currentStats.totalGoals++;
      if (goal.rating?.managerScore ?? goal.rating?.score) {
        currentStats.ratedGoals++;
      }
      
      // Update status-based counters
      if (goal.status === 'PENDING') currentStats.pendingGoals++;
      if (goal.status === 'APPROVED') currentStats.approvedGoals++;
      if (goal.status === 'REJECTED') currentStats.rejectedGoals++;
      
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
                  goalId: goalId,
                  managerScore: value,
                  score: value, // Keep for backward compatibility
                  managerComments: data.managerComments || '',
                  comments: data.managerComments || '',
                  managerRatedAt: data.managerRatedAt,
                  updatedAt: data.updatedAt
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
                goalId: goalId,
                managerScore: value,
                score: value,
                managerComments: data.managerComments || '',
                comments: data.managerComments || ''
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
    return <LoadingComponent />;
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
          <StatsSection goals={goals} viewMode={'list'} setViewMode={() => {}} />
          <EmployeeFilter 
            filterEmployee={filterEmployee} 
            setFilterEmployee={setFilterEmployee} 
            employeeStats={employeeStats} 
          />

          {/* Goals Table */}
          <GoalsTable
            goals={filteredGoals}
            onGoalClick={(goal) => setSelectedGoal(goal as GoalWithRatingExtended)}
            showEmployee={true}
            showManager={true}
          />

          {/* Goal Detail Modal */}
          {selectedGoal && (
            <GoalDetailModal
              goal={selectedGoal}
              onClose={() => setSelectedGoal(null)}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 