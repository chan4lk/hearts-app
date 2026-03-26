'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Goal, GoalWithRatingExtended, EmployeeStats } from '@/app/components/shared/types';

import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

import { BsClipboardData, BsCheckCircle, BsXCircle, BsPencil } from 'react-icons/bs';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { useToast } from '@/app/components/shared/Toast';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { Pagination } from '@/app/components/shared/Pagination';


export default function ApproveGoalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  
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

    fetchGoals();
  }, [session, router, page, limit, selectedEmployee, selectedStatus, selectedPriority]);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query params for pending approval view with pagination
      const params = new URLSearchParams({
        view: 'pending-approval',
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(selectedStatus && selectedStatus !== '' && { status: selectedStatus }),
        ...(selectedPriority && selectedPriority !== '' && { priority: selectedPriority }),
        ...(selectedEmployee && selectedEmployee !== 'all' && { employeeId: selectedEmployee })
      });

      // Fetch pending goals using unified API
      const goalsResponse = await fetch(`/api/goals?${params.toString()}`);
      if (!goalsResponse.ok) {
        throw new Error('Failed to fetch goals');
      }
      const responseData = await goalsResponse.json();
      const goalsData = responseData.goals || [];
      
      // Set pagination if available
      if (responseData.pagination) {
        setPagination(responseData.pagination);
      }

      // Fetch ALL assigned employees (not just those with pending goals)
      const employeesResponse = await fetch(`/api/employees/assigned`);
      if (!employeesResponse.ok) {
        throw new Error('Failed to fetch employees');
      }
      const employeesData = await employeesResponse.json();

      // Transform the goals data to include required properties
      const transformedGoals = goalsData.map((goal: any) => ({
        ...goal,
        updatedAt: goal.updatedAt || goal.createdAt,
        isApprovalProcess: true,
        approvalProcessId: goal.approvalProcessId || null,
        managerId: goal.managerId || null,
        employee: {
          ...goal.employee,
          role: goal.employee.role || 'EMPLOYEE',
          isActive: goal.employee.isActive ?? true,
          createdAt: goal.employee.createdAt || goal.createdAt,
          updatedAt: goal.employee.updatedAt || goal.updatedAt || goal.createdAt,
        }
      }));

      setGoals(transformedGoals);

      // Build employee statistics from ALL assigned employees
      const statsMap = new Map<string, EmployeeStats>();

      // First, add all assigned employees to the map
      if (employeesData.employees) {
        employeesData.employees.forEach((emp: any) => {
          statsMap.set(emp.id, {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            totalGoals: 0,
            pendingGoals: 0,
            approvedGoals: 0,
            rejectedGoals: 0,
            ratedGoals: 0,
            isActive: emp.isActive ?? true
          });
        });
      }

      // Then, update stats based on pending goals
      transformedGoals.forEach((goal: Goal) => {
        if (!goal.employee) return;

        const stats = statsMap.get(goal.employee.id);
        if (stats) {
          stats.totalGoals++;
          if (goal.status === 'PENDING') stats.pendingGoals++;
          if (goal.status === 'APPROVED') stats.approvedGoals++;
          if (goal.status === 'REJECTED') stats.rejectedGoals++;
        }
      });

      setEmployeeStats(Array.from(statsMap.values()));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load goals';
      setError(errorMessage);
      setGoals([]);
      setEmployeeStats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (goal: Goal, action: 'approve' | 'reject', comment?: string) => {
    setSelectedGoal(goal);
    setSelectedGoalDetails(null); // Close the details modal
    
    // Optimistically update the UI immediately
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const updatedGoal: Goal = {
      ...goal,
      status: newStatus,
      managerComments: comment || null
    };
    
    // Update local state immediately
    setGoals(prevGoals => prevGoals.filter(g => g.id !== goal.id));
    setSelectedGoal(null);
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/goals/${goal.id}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerComments: comment || '' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} goal`);
      }

      toast.success(`Goal ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      
      // Optionally refresh to get the latest data, but UI is already updated
      // Only refresh if needed for stats or other data
      await fetchGoals();
    } catch (err) {
      // Revert optimistic update on error
      setGoals(prevGoals => [...prevGoals, goal]);
      toast.error(`Failed to ${action} goal`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = (goalId: string, updatedGoal: Goal | GoalWithRatingExtended) => {
    // Store original goal for potential revert
    const originalGoal = goals.find(g => g.id === goalId);
    
    // Optimistically update the goals list IMMEDIATELY - update the goal status (don't remove it)
    // Use functional update to ensure we're working with latest state
    setGoals(prevGoals => {
      const updated = prevGoals.map(g => g.id === goalId ? updatedGoal as Goal : g);
      return updated;
    });
    
    // Close modal immediately
    setSelectedGoalDetails(null);
    
    // Update employee stats optimistically using the updatedGoal
    if (updatedGoal.employee) {
      setEmployeeStats(prevStats => 
        prevStats.map(stat => {
          if (updatedGoal.employee && updatedGoal.employee.id === stat.id) {
            return {
              ...stat,
              pendingGoals: Math.max(0, stat.pendingGoals - 1),
              approvedGoals: stat.approvedGoals + 1
            };
          }
          return stat;
        })
      );
    }
    
    // Make API call in background and revert on error
    fetch(`/api/goals/${goalId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerComments: (updatedGoal as Goal).managerComments || '' }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to approve goal');
      }
      // Success - no need to revert, UI is already updated
    })
    .catch(err => {
      // Revert optimistic update on error - restore original goal state
      if (originalGoal) {
        setGoals(prevGoals => 
          prevGoals.map(g => g.id === goalId ? originalGoal : g)
        );
        if (originalGoal.employee) {
          setEmployeeStats(prevStats => 
            prevStats.map(stat => {
              if (originalGoal.employee && originalGoal.employee.id === stat.id) {
                return {
                  ...stat,
                  pendingGoals: stat.pendingGoals + 1,
                  approvedGoals: Math.max(0, stat.approvedGoals - 1)
                };
              }
              return stat;
            })
          );
        }
      }
      toast.error('Failed to approve goal. Please try again.');
    });
  };

  const handleReject = (goalId: string, updatedGoal: Goal | GoalWithRatingExtended) => {
    // Store original goal for potential revert
    const originalGoal = goals.find(g => g.id === goalId);
    
    // Optimistically update the goals list IMMEDIATELY - update the goal status (don't remove it)
    // Use functional update to ensure we're working with latest state
    setGoals(prevGoals => {
      const updated = prevGoals.map(g => g.id === goalId ? updatedGoal as Goal : g);
      return updated;
    });
    
    // Close modal immediately
    setSelectedGoalDetails(null);
    
    // Update employee stats optimistically using the updatedGoal
    if (updatedGoal.employee) {
      setEmployeeStats(prevStats => 
        prevStats.map(stat => {
          if (updatedGoal.employee && updatedGoal.employee.id === stat.id) {
            return {
              ...stat,
              pendingGoals: Math.max(0, stat.pendingGoals - 1),
              rejectedGoals: stat.rejectedGoals + 1
            };
          }
          return stat;
        })
      );
    }
    
    // Make API call in background and revert on error
    fetch(`/api/goals/${goalId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerComments: (updatedGoal as Goal).managerComments || '' }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to reject goal');
      }
      // Success - no need to revert, UI is already updated
    })
    .catch(err => {
      // Revert optimistic update on error - restore original goal state
      if (originalGoal) {
        setGoals(prevGoals => 
          prevGoals.map(g => g.id === goalId ? originalGoal : g)
        );
        if (originalGoal.employee) {
          setEmployeeStats(prevStats => 
            prevStats.map(stat => {
              if (originalGoal.employee && originalGoal.employee.id === stat.id) {
                return {
                  ...stat,
                  pendingGoals: stat.pendingGoals + 1,
                  rejectedGoals: Math.max(0, stat.rejectedGoals - 1)
                };
              }
              return stat;
            })
          );
        }
      }
      toast.error('Failed to reject goal. Please try again.');
    });
  };

  const handleClearFilters = () => {
    setSelectedStatus('');
    setSelectedPriority('');
    setPage(1);
  };

  // Server-side filtering is done, but we keep client-side filtering for view switching if needed
  const filteredGoals = goals;
  return (
    <DashboardLayout type="manager">
      {isLoading ? <LoadingSkeleton variant="page" /> : error ? <ErrorState message={error} onRetry={() => { setError(null); fetchGoals(); }} /> :
      <div className="max-w-7xl mx-auto space-y-6">
          <PageHeader
            title="Goal Approvals"
            description="Review and approve team goals"
            badge="Manager"
          />

          <div className="bg-surface-elevated rounded-2xl p-4 border border-theme space-y-4 relative overflow-hidden transition-all duration-300 hover:shadow-theme-sm">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
            <PageToolbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setPage(1);
              }}
              searchPlaceholder="Search goals..."
              hasActiveFilters={selectedStatus !== '' || selectedPriority !== ''}
              onClearFilters={() => {
                handleClearFilters();
                setSearchQuery('');
              }}
            >
              <FilterSelect
                value={selectedStatus}
                onChange={(value) => {
                  setSelectedStatus(value);
                  setPage(1);
                }}
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
                placeholder="All Status"
              />
              <FilterSelect
                value={selectedPriority}
                onChange={(value) => {
                  setSelectedPriority(value);
                  setPage(1);
                }}
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'CRITICAL', label: 'Critical' },
                ]}
                placeholder="All Priority"
              />
            </PageToolbar>

            {(() => {
              // Single-pass count instead of 3 separate .filter() calls
              const sc: Record<string, number> = {};
              for (const g of goals) sc[g.status] = (sc[g.status] || 0) + 1;
              const pendingCount = (sc['PENDING'] || 0) + (sc['DRAFT'] || 0);
              const approvedCount = sc['APPROVED'] || 0;
              const rejectedCount = sc['REJECTED'] || 0;
              
              const statItems: StatItem[] = [
                {
                  title: 'Total Goals',
                  value: goals.length,
                  icon: <BsClipboardData className="w-4 h-4" />,
                },
                {
                  title: 'Pending',
                  value: pendingCount,
                  icon: <BsPencil className="w-4 h-4" />,
                },
                {
                  title: 'Approved',
                  value: approvedCount,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                },
                {
                  title: 'Rejected',
                  value: rejectedCount,
                  icon: <BsXCircle className="w-4 h-4" />,
                }
              ];
              return <StatsSection stats={statItems} />;
            })()}
          </div>

          {/* Goals Table */}
          <div className="relative bg-surface-elevated rounded-2xl border border-theme overflow-hidden transition-all duration-300 hover:shadow-theme-sm">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
            <div className="p-4">
              <GoalsTable
                goals={filteredGoals}
                onGoalClick={(goal) => setSelectedGoalDetails(goal)}
                onStatusUpdate={(goalId, newStatus, updatedGoal) => {
              // Handle status update - keep goal in list regardless of status (DRAFT, APPROVED, or REJECTED)
              // Always update the goal in the list (don't remove it)
              setGoals(prevGoals => 
                prevGoals.map(g => g.id === goalId ? updatedGoal as Goal : g)
              );
              
              // Update employee stats
              if (updatedGoal.employee) {
                setEmployeeStats(prevStats => 
                  prevStats.map(stat => {
                    if (updatedGoal.employee && updatedGoal.employee.id === stat.id) {
                      const oldGoal = goals.find(g => g.id === goalId);
                      const oldStatus = oldGoal?.status;
                      const newStatusValue = newStatus;
                      
                      let stats = { ...stat };
                      
                      // Decrement old status
                      if (oldStatus === 'PENDING' || oldStatus === 'DRAFT') {
                        stats.pendingGoals = Math.max(0, stats.pendingGoals - 1);
                      } else if (oldStatus === 'APPROVED') {
                        stats.approvedGoals = Math.max(0, stats.approvedGoals - 1);
                      } else if (oldStatus === 'REJECTED') {
                        stats.rejectedGoals = Math.max(0, stats.rejectedGoals - 1);
                      }
                      
                      // Increment new status
                      if (newStatusValue === 'APPROVED') {
                        stats.approvedGoals = stats.approvedGoals + 1;
                      } else if (newStatusValue === 'REJECTED') {
                        stats.rejectedGoals = stats.rejectedGoals + 1;
                      } else if (newStatusValue === 'PENDING' || newStatusValue === 'DRAFT') {
                        stats.pendingGoals = stats.pendingGoals + 1;
                      }
                      
                      return stats;
                    }
                    return stat;
                  })
                );
              }
            }}
                showEmployee={true}
                showManager={false}
              />
              
              {/* Pagination */}
              {pagination && (
                <div className="mt-6 pt-4 border-t border-theme">
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

          {/* Goal Details Modal */}
          {selectedGoalDetails && (
            <GoalDetailModal
              goal={selectedGoalDetails}
              onClose={() => setSelectedGoalDetails(null)}
            />
          )}
      </div>}
    </DashboardLayout>
  );
}