"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingComponent from '@/app/components/LoadingScreen';

import { GoalWithRatingExtended, EmployeeStats } from "@/app/components/shared/types";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import Filters from "./components/Filters";
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';

export default function RateEmployeesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithRatingExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingRatingId, setSubmittingRatingId] = useState<string | null>(null);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState('');
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
      if (!employee) return; // Skip if employee is null
      
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
    if (isNaN(value) || !goalId || value === 0) {
      return; // Don't submit if value is 0 (Not Rated)
    }

    // Find the goal to restore if update fails
    const goalToRestore = goals.find(g => g.id === goalId);
    if (!goalToRestore) {
      toast.error('Goal not found');
      return;
    }

    // Optimistic update - update UI immediately (allows changing rating)
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              rating: {
                ...goal.rating, // Preserve existing rating properties (like selfScore)
                id: goal.rating?.id || '',
                goalId: goalId,
                managerScore: value,
                score: value,
                managerComments: goal.rating?.managerComments || '',
                comments: goal.rating?.comments || '',
                managerRatedAt: new Date().toISOString(),
                managerRatedById: session?.user?.id || goal.rating?.managerRatedById,
                updatedAt: new Date().toISOString()
              }
            }
          : goal
      )
    );

    try {
      setSubmitting(true);
      setSubmittingRatingId(goalId);

      console.log('Submitting rating:', { goalId, value });

      const response = await fetch(`/api/goals/${goalId}/manager-rating`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          score: value,
          comments: '' // Allow empty comments
        })
      });

      console.log('Rating response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        const errorMessage = errorData.message || errorData.error || `Failed to update rating (${response.status})`;
        console.error('Rating error:', errorMessage, errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Rating updated successfully:', data);

      // Update with server response to ensure data consistency
      setGoals(prevGoals => {
        const updatedGoals = prevGoals.map(goal =>
          goal.id === goalId
            ? {
                ...goal,
                rating: {
                  ...goal.rating, // Preserve existing rating properties (like selfScore)
                  id: data.id || goal.rating?.id || '',
                  goalId: goalId,
                  managerScore: value,
                  score: value, // Keep for backward compatibility
                  managerComments: data.managerComments || goal.rating?.managerComments || '',
                  comments: data.managerComments || goal.rating?.comments || '',
                  managerRatedAt: data.managerRatedAt || new Date().toISOString(),
                  managerRatedById: session?.user?.id || goal.rating?.managerRatedById,
                  updatedAt: data.updatedAt || new Date().toISOString()
                }
              }
            : goal
        );
        
        // Update employee stats with the updated goals
        const stats = calculateEmployeeStats(updatedGoals);
        setEmployeeStats(stats);
        
        return updatedGoals;
      });

      toast.success(`Rating updated to ${value} stars`);
    } catch (error) {
      console.error('Error updating rating:', error);
      // Revert optimistic update on error
      if (goalToRestore) {
        setGoals(prevGoals =>
          prevGoals.map(goal =>
            goal.id === goalId ? goalToRestore : goal
          )
        );
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update rating';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
      setSubmittingRatingId(null);
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (!goal.employee) return false;
    if (filterEmployee !== 'all' && goal.employee.id !== filterEmployee) return false;
    if (filterRating !== 'all' && (goal.rating?.managerScore || goal.rating?.score) !== parseInt(filterRating)) return false;
    if (selectedStatus && goal.status !== selectedStatus) return false;
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
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-4 space-y-4">
          <HeroSection />

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-gray-700/50 space-y-4">
            <StatsSection goals={goals} employeesCount={employeeStats.length} />
          </div>

          <Filters
            selectedEmployee={filterEmployee}
            onEmployeeChange={setFilterEmployee}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedRating={filterRating}
            onRatingChange={setFilterRating}
            employeeStats={employeeStats}
          />

          {/* Goals Table */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/50 overflow-hidden shadow-lg">
            <div className="p-4">
              <GoalsTable
                goals={filteredGoals}
                onGoalClick={(goal) => setSelectedGoal(goal as GoalWithRatingExtended)}
                onRatingChange={handleRatingChange}
                showEmployee={true}
                showManager={false}
                showRating={true}
                submittingRating={submittingRatingId}
                disableStatusUpdate={true}
              />
            </div>
          </div>

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