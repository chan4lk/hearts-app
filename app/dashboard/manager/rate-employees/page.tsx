"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { GoalWithRatingExtended, EmployeeStats } from "@/app/components/shared/types";
import HeroSection from "@/app/components/shared/HeroSection";
import StatsSection, { StatItem } from "@/app/components/shared/StatsSection";
import Filters from "@/app/components/shared/Filters";
import { HERO_GRADIENTS } from "@/app/components/shared/filterConfig";
import { BsClipboardData, BsCheckCircle, BsPercent, BsStarFill as BsStarIcon } from 'react-icons/bs';
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { Pagination } from '@/app/components/shared/Pagination';

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
  const [selectedPriority, setSelectedPriority] = useState('');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithRatingExtended | null>(null);
  
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
    if (!session) {
      router.push('/login');
      return;
    }
    if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchEmployeeGoals();
  }, [session, router, page, limit, filterEmployee, filterRating, selectedStatus, selectedPriority]);

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
      // Only count goals with managerScore (not fallback to score)
      const managerScore = goal.rating?.managerScore;
      if (managerScore !== null && managerScore !== undefined && managerScore > 0) {
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
      
      // Build query params with pagination and filters - use unified API with COMPLETED status
      const params = new URLSearchParams({
        view: 'team-goals',
        status: 'COMPLETED', // Only COMPLETED goals for rating
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(filterEmployee && filterEmployee !== 'all' && { employeeId: filterEmployee }),
        ...(selectedStatus && selectedStatus !== '' && { status: selectedStatus }),
        ...(selectedPriority && selectedPriority !== '' && { priority: selectedPriority })
      });
      
      const response = await fetch(`/api/goals?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to fetch goals");
      }
      
      const data = await response.json();
      
      // Unified API returns { goals: [], pagination: {}, ... }
      const goalsData = Array.isArray(data) ? data : (data.goals || []);
      
      setGoals(goalsData);
      
      // Set pagination if available
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
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
    if (isNaN(value) || !goalId) return;
    
    // Handle "Not Rated" (0) - remove the rating
    if (value === 0) {
      const currentGoal = goals.find(g => g.id === goalId);
      if (!currentGoal) {
        toast.error('Goal not found');
        return;
      }

      // Optimistically update UI to remove rating
      const goalWithoutRating: GoalWithRatingExtended = {
        ...currentGoal,
        rating: currentGoal.rating ? {
          ...currentGoal.rating,
          managerScore: undefined,
          score: currentGoal.rating.selfScore || undefined,
          managerRatedAt: undefined,
          managerRatedById: undefined,
          updatedAt: new Date().toISOString()
        } : currentGoal.rating
      };

      // Update local state IMMEDIATELY (optimistic update)
      setGoals(prevGoals => {
        const updatedGoals = prevGoals.map(goal =>
          goal.id === goalId ? goalWithoutRating : goal
        );
        
        // Update employee stats immediately
        const stats = calculateEmployeeStats(updatedGoals);
        setEmployeeStats(stats);
        
        return updatedGoals;
      });

      setSubmittingRatingId(goalId);
      setSubmitting(true);

      try {
        // Call API to remove rating
        const response = await fetch(`/api/goals/${goalId}/manager-rating`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            score: 0, // 0 means remove rating
            comments: ''
          })
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          const errorMessage = errorData.message || errorData.error || `Failed to remove rating (${response.status})`;
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Update with server response
        setGoals(prevGoals => {
          const updatedGoals = prevGoals.map(goal =>
            goal.id === goalId
              ? {
                  ...goal,
                  rating: data.id ? {
                    ...goal.rating,
                    id: data.id,
                    goalId: goalId,
                    managerScore: data.score !== null && data.score !== undefined ? data.score : undefined,
                    score: data.score !== null && data.score !== undefined ? data.score : (data.selfScore || undefined),
                    selfScore: data.selfScore || goal.rating?.selfScore,
                    managerComments: data.comments || undefined,
                    comments: data.comments || goal.rating?.selfComments || undefined,
                    managerRatedAt: data.managerRatedAt || undefined,
                    managerRatedById: data.managerRatedBy?.id || undefined,
                    updatedAt: data.updatedAt || new Date().toISOString()
                  } : (goal.rating ? {
                    ...goal.rating,
                    managerScore: undefined,
                    score: goal.rating.selfScore || undefined,
                    managerRatedAt: undefined,
                    managerRatedById: undefined,
                    updatedAt: new Date().toISOString()
                  } : null)
                }
              : goal
          );
          
          // Update employee stats with server response
          const stats = calculateEmployeeStats(updatedGoals);
          setEmployeeStats(stats);
          
          return updatedGoals;
        });

        toast.success('Rating removed successfully');
      } catch (error) {
        // REVERT optimistic update on error
        setGoals(prevGoals => {
          const revertedGoals = prevGoals.map(goal =>
            goal.id === goalId ? currentGoal : goal
          );
          
          // Revert employee stats
          const stats = calculateEmployeeStats(revertedGoals);
          setEmployeeStats(stats);
          
          return revertedGoals;
        });
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove rating';
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
        setSubmittingRatingId(null);
      }

      return;
    }
    
    // Find the current goal to preserve fields
    const currentGoal = goals.find(g => g.id === goalId);
    if (!currentGoal) {
      toast.error('Goal not found');
      return;
    }

    // OPTIMISTIC UPDATE: Update UI immediately before API call
    const optimisticRating = {
      ...(currentGoal.rating || {}),
      id: currentGoal.rating?.id || 'temp',
      goalId: goalId,
      managerScore: value,
      score: value, // Keep for backward compatibility
      managerComments: currentGoal.rating?.managerComments || '',
      comments: currentGoal.rating?.managerComments || currentGoal.rating?.comments || '',
      managerRatedAt: new Date().toISOString(),
      managerRatedById: session?.user?.id || currentGoal.rating?.managerRatedById,
      updatedAt: new Date().toISOString()
    };

    const optimisticGoal: GoalWithRatingExtended = {
      ...currentGoal,
      rating: optimisticRating as any
    };

    // Update local state IMMEDIATELY (optimistic update)
    setGoals(prevGoals => {
      const updatedGoals = prevGoals.map(goal =>
        goal.id === goalId ? optimisticGoal : goal
      );
      
      // Update employee stats immediately with optimistic data
      const stats = calculateEmployeeStats(updatedGoals);
      setEmployeeStats(stats);
      
      return updatedGoals;
    });

    setSubmittingRatingId(goalId);
    setSubmitting(true);

    try {


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
      // REVERT optimistic update on error
      setGoals(prevGoals => {
        const revertedGoals = prevGoals.map(goal =>
          goal.id === goalId ? currentGoal : goal
        );
        
        // Revert employee stats
        const stats = calculateEmployeeStats(revertedGoals);
        setEmployeeStats(stats);
        
        return revertedGoals;
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update rating';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
      setSubmittingRatingId(null);
    }
  };

  // Server-side filtering is done, but keep client-side filtering for rating filter
  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      if (!goal.employee) return false;
      // Rating filter is client-side only (not supported by API)
      if (filterRating !== 'all' && (goal.rating?.managerScore || goal.rating?.score) !== parseInt(filterRating)) return false;
      return false;
    });
  }, [goals, filterRating]);

  const handleClearFilters = () => {
    setSelectedStatus('');
    setSelectedPriority('');
    setPage(1);
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

        <div className="relative z-10 p-4 space-y-4">
          <HeroSection 
            title="Rate Employees"
            subtitle="Provide performance ratings for employee goals"
            gradient={HERO_GRADIENTS.MANAGER}
          />

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-gray-700/50 space-y-4">
            {(() => {
              const ratedCount = goals.filter(g => g.rating?.managerScore || g.rating?.score).length;
              const unratedCount = goals.length - ratedCount;
              const avgRating = goals.length > 0 
                ? (goals.reduce((sum, g) => sum + (g.rating?.managerScore || g.rating?.score || 0), 0) / goals.length).toFixed(1)
                : '0.0';
              
              const statItems: StatItem[] = [
                {
                  title: 'Total Goals',
                  value: goals.length,
                  icon: <BsClipboardData className="w-4 h-4" />,
                  gradient: 'from-indigo-500 to-purple-500',
                  bgColor: 'bg-indigo-500/10',
                  borderColor: 'border-indigo-500/30'
                },
                {
                  title: 'Rated',
                  value: ratedCount,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                  gradient: 'from-emerald-500 to-teal-500',
                  bgColor: 'bg-emerald-500/10',
                  borderColor: 'border-emerald-500/30'
                },
                {
                  title: 'Pending',
                  value: unratedCount,
                  icon: <BsPercent className="w-4 h-4" />,
                  gradient: 'from-amber-500 to-orange-500',
                  bgColor: 'bg-amber-500/10',
                  borderColor: 'border-amber-500/30'
                },
                {
                  title: 'Avg Rating',
                  value: `${avgRating}★`,
                  icon: <BsStarIcon className="w-4 h-4" />,
                  gradient: 'from-yellow-500 to-orange-500',
                  bgColor: 'bg-yellow-500/10',
                  borderColor: 'border-yellow-500/30'
                }
              ];
              return <StatsSection stats={statItems} variant="auto" />;
            })()}
          </div>

          <Filters
            selectedStatus={selectedStatus}
            onStatusChange={(value) => {
              setSelectedStatus(value);
              setPage(1);
            }}
            selectedPriority={selectedPriority}
            onPriorityChange={(value) => {
              setSelectedPriority(value);
              setPage(1);
            }}
            filters={[
              {
                id: 'employee',
                label: 'Employee',
                value: filterEmployee,
                onChange: (value) => {
                  setFilterEmployee(value);
                  setPage(1);
                },
                options: [
                  { value: 'all', label: 'All Employees' },
                  ...employeeStats.map(emp => ({ value: emp.id, label: emp.name }))
                ],
                gradient: 'from-blue-500 to-indigo-500'
              },
              {
                id: 'rating',
                label: 'Rating',
                value: filterRating,
                onChange: (value) => {
                  setFilterRating(value);
                  setPage(1);
                },
                options: [
                  { value: 'all', label: 'All Ratings' },
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' }
                ],
                gradient: 'from-amber-500 to-orange-500'
              }
            ]}
            onClear={() => {
              setFilterEmployee('all');
              setFilterRating('all');
              setSelectedStatus('');
              setSelectedPriority('');
              setPage(1);
            }}
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
