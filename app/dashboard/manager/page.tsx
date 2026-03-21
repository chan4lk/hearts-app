'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';
import GoalsSection from './components/GoalsSection';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { Pagination } from '@/app/components/shared/Pagination';
import AIPerformanceInsights from '@/app/components/ai/AIPerformanceInsights';
import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';


import { BsStars, BsLightbulb, BsCheckCircle, BsXCircle, BsPeople, BsPencil } from 'react-icons/bs';

import { Goal, EmployeeStats, DashboardStats } from '@/app/components/shared/types';

export default function ManagerDashboard() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState({ total: 0, active: 0 });
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const { data: session } = useSession();
  
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

  // Helper function to check if a goal belongs to the current user
  const isCurrentUserGoal = (goal: Goal) => {
    return goal.employee?.email === session?.user?.email;
  };

  // Helper function to check if goal is manager-assigned (by current manager)
  const isAssignedGoal = (goal: Goal): boolean => {
    // Goal is assigned if it has a managerId set and matches current manager
    return !!(goal.managerId && goal.managerId === session?.user?.id);
  };

  // Helper function to check if goal is employee self-created
  const isSelfCreatedGoal = (goal: Goal): boolean => {
    // Goal is self-created if:
    // 1. createdBy exists and matches the employee
    // 2. AND either no managerId or managerId is null/empty
    return !!(
      goal.createdBy 
      && goal.createdBy.id === goal.employeeId 
      && (!goal.managerId || goal.managerId === null || goal.managerId === '')
    );
  };

  // Memoize filtered goals for stats (avoid recalculating on every render)
  const filteredGoalsForStats = useMemo(() => goals.filter(g => {
    if (!g.employee || isCurrentUserGoal(g)) return false;
    if (selectedEmployee && selectedEmployee !== 'all') {
      return g.employee.email === selectedEmployee;
    }
    return true;
  }), [goals, selectedEmployee, session?.user?.email]);

  // Memoize statistics calculation
  const stats: DashboardStats = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    for (const g of filteredGoalsForStats) {
      statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
    }
    return {
      employeeGoals: {
        total: filteredGoalsForStats.length,
        draft: statusCounts['DRAFT'] || 0,
        pending: statusCounts['PENDING'] || 0,
        approved: statusCounts['APPROVED'] || 0,
        rejected: statusCounts['REJECTED'] || 0,
        modified: statusCounts['MODIFIED'] || 0,
        completed: statusCounts['COMPLETED'] || 0,
      },
      employeeCount: selectedEmployee && selectedEmployee !== 'all' ? 1 : employeeCounts.total,
      activeEmployees: selectedEmployee && selectedEmployee !== 'all' ? 1 : employeeCounts.active
    };
  }, [filteredGoalsForStats, selectedEmployee, employeeCounts]);

  // Memoize role-based statistics
  const roleStats = useMemo(() => ({
    admins: employees.filter(emp => emp.role === 'ADMIN').length,
    managers: employees.filter(emp => emp.role === 'MANAGER').length,
    employees: employees.filter(emp => emp.role === 'EMPLOYEE').length,
    totalUsers: employees.length
  }), [employees]);

  // Fetch employees once on mount (not on every filter change)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const empResponse = await fetch('/api/employees/assigned');
        if (!empResponse.ok) throw new Error('Failed to fetch assigned employees');
        const empData = await empResponse.json();
        const employeesList = empData.employees || [];
        setEmployees(employeesList);
        setEmployeeCounts({
          total: employeesList.length || 0,
          active: employeesList.filter((emp: any) => emp.isActive !== false).length || 0
        });
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, [session?.user?.email]);

  // Fetch goals when filters/pagination change (separate from employees)
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      // Convert selectedEmployee email to employeeId
      let employeeIdFilter: string | undefined;
      if (selectedEmployee && selectedEmployee !== 'all') {
        const selectedEmp = employees.find((emp: any) => emp.email === selectedEmployee);
        if (selectedEmp) employeeIdFilter = selectedEmp.id;
      }

      const params = new URLSearchParams({
        view: 'team-goals',
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(selectedStatus && selectedStatus !== '' && { status: selectedStatus }),
        ...(selectedPriority && { priority: selectedPriority }),
        ...(employeeIdFilter && { employeeId: employeeIdFilter })
      });

      const goalResponse = await fetch(`/api/goals?${params}`);
      if (!goalResponse.ok) throw new Error('Failed to fetch goals');
      const goalData = await goalResponse.json();
      setGoals(goalData.goals || []);
      if (goalData.pagination) setPagination(goalData.pagination);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedStatus, selectedPriority, selectedEmployee, employees]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Add session/role check
  useEffect(() => {
    if (!session) return;
    if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
      window.location.href = '/login';
    }
  }, [session]);

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoalDetails(goal);
  };

  // Handler for priority update - only for assigned goals
  const handlePriorityUpdate = (goalId: string, newPriority: string, updatedGoal: Goal) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? updatedGoal : goal
      )
    );
  };

  // Handler for due date update - only for assigned goals
  const handleDueDateUpdate = (goalId: string, newDueDate: string, updatedGoal: Goal) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? updatedGoal : goal
      )
    );
  };

  // Handler for status update - for all goals (but restricted to approved/rejected for non-assigned)
  const handleStatusUpdate = (goalId: string, newStatus: string, updatedGoal: Goal) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? updatedGoal : goal
      )
    );
  };
  return (
    <DashboardLayout type="manager">
      <div className="max-w-7xl mx-auto space-y-5">
          {/* Stats Section */}
          {(() => {
            const statItems: StatItem[] = [
              {
                title: 'Total Goals',
                value: stats.employeeGoals.total,
                icon: <BsStars className="w-4 h-4" />,
                gradient: 'from-indigo-500 to-purple-500',
                bgColor: 'bg-indigo-500/10',
                borderColor: 'border-indigo-500/30',
                onClick: () => {
                  setSelectedStatus('');
                  setPage(1);
                }
              },
              {
                title: 'Draft',
                value: stats.employeeGoals.draft,
                icon: <BsPencil className="w-4 h-4" />,
                gradient: 'from-gray-500 to-slate-500',
                bgColor: 'bg-gray-500/10',
                borderColor: 'border-gray-500/30',
                onClick: () => {
                  setSelectedStatus('DRAFT');
                  setPage(1);
                }
              },
              {
                title: 'Approved',
                value: stats.employeeGoals.approved,
                icon: <BsCheckCircle className="w-4 h-4" />,
                gradient: 'from-emerald-500 to-teal-500',
                bgColor: 'bg-emerald-500/10',
                borderColor: 'border-emerald-500/30',
                onClick: () => {
                  setSelectedStatus('APPROVED');
                  setPage(1);
                }
              },
              {
                title: 'Rejected',
                value: stats.employeeGoals.rejected,
                icon: <BsXCircle className="w-4 h-4" />,
                gradient: 'from-rose-500 to-red-500',
                bgColor: 'bg-rose-500/10',
                borderColor: 'border-rose-500/30',
                onClick: () => {
                  setSelectedStatus('REJECTED');
                  setPage(1);
                }
              },
              {
                title: 'Completed',
                value: stats.employeeGoals.completed,
                icon: <BsCheckCircle className="w-4 h-4" />,
                gradient: 'from-green-500 to-emerald-500',
                bgColor: 'bg-green-500/10',
                borderColor: 'border-green-500/30',
                onClick: () => {
                  setSelectedStatus('COMPLETED');
                  setPage(1);
                }
              },
              {
                title: 'Total Employees',
                value: stats.employeeCount,
                icon: <BsPeople className="w-4 h-4" />,
                gradient: 'from-cyan-500 to-blue-500',
                bgColor: 'bg-cyan-500/10',
                borderColor: 'border-cyan-500/30'
              }
            ];
            return <StatsSection stats={statItems} variant="auto" />;
          })()}

          {/* Toolbar + Filters */}
          <PageToolbar
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            searchPlaceholder="Search goals..."
            hasActiveFilters={selectedStatus !== '' || selectedEmployee !== 'all' || selectedPriority !== ''}
            onClearFilters={() => {
              setSelectedStatus('');
              setSelectedEmployee('all');
              setSelectedPriority('');
              setSearchQuery('');
              setPage(1);
            }}
            actions={[
              {
                label: showAIInsights ? 'Hide AI Insights' : 'AI Insights',
                onClick: () => setShowAIInsights(!showAIInsights),
                variant: showAIInsights ? 'secondary' : 'primary',
                icon: <BsStars className="w-3.5 h-3.5" />,
              },
            ]}
          >
            <FilterSelect
              value={selectedEmployee}
              onChange={(value) => {
                setSelectedEmployee(value || 'all');
                setPage(1);
              }}
              options={employees.map(emp => ({ value: emp.email, label: emp.name }))}
              placeholder="All Employees"
            />
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
                { value: 'COMPLETED', label: 'Completed' },
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

          {/* AI Performance Insights for Selected Employee */}
          {showAIInsights && selectedEmployee !== 'all' && (
            <div className="bg-surface-elevated rounded-xl p-5 border border-theme shadow-theme-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <BsLightbulb className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-primary">AI Performance Insights</h3>
                  <p className="text-[12px] text-secondary">
                    Analysis for {employees.find(e => e.email === selectedEmployee)?.name || 'selected employee'}
                  </p>
                </div>
              </div>
              <AIPerformanceInsights
                userId={employees.find(e => e.email === selectedEmployee)?.id}
                autoLoad={true}
              />
            </div>
          )}

          {/* AI Insights Prompt (when no employee selected) */}
          {showAIInsights && selectedEmployee === 'all' && (
            <div className="bg-surface-elevated rounded-xl p-8 border border-theme shadow-theme-sm text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                <BsLightbulb className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-primary mb-1">Select an Employee</h3>
              <p className="text-[12px] text-secondary">Choose a specific employee from the filter above to view AI insights</p>
            </div>
          )}

          {/* Goals Section with Tabs */}
          <GoalsSection
            goals={goals.filter(goal => goal.employee && !isCurrentUserGoal(goal))}
            selectedStatus={selectedStatus}
            selectedEmployee={selectedEmployee}
            selectedPriority={selectedPriority}
            onGoalClick={handleGoalClick}
            onStatusUpdate={handleStatusUpdate}
            onPriorityUpdate={handlePriorityUpdate}
            onDueDateUpdate={handleDueDateUpdate}
            canEditPriority={(goal) => {
              // For assigned goals, always allow editing
              if (isAssignedGoal(goal)) return true;
              // For self-created goals, allow editing if status is DRAFT or APPROVED
              // Once rejected, priority becomes read-only until approved again
              if (isSelfCreatedGoal(goal)) {
                return goal.status === 'DRAFT' || goal.status === 'APPROVED';
              }
              return false;
            }}
            canEditDueDate={(goal) => {
              // For assigned goals, always allow editing
              if (isAssignedGoal(goal)) return true;
              // For self-created goals, allow editing if status is DRAFT or APPROVED
              // Once rejected, due date becomes read-only until approved again
              if (isSelfCreatedGoal(goal)) {
                return goal.status === 'DRAFT' || goal.status === 'APPROVED';
              }
              return false;
            }}
            allowedStatuses={(goal) => {
              // Only allow status updates for employee self-created goals
              if (isSelfCreatedGoal(goal)) {
                // For DRAFT self-created goals, allow manager to approve/reject
                if (goal.status === 'DRAFT') {
                  return ['DRAFT', 'APPROVED', 'REJECTED'];
                }
                // For APPROVED/REJECTED self-created goals, allow switching between them
                if (goal.status === 'APPROVED' || goal.status === 'REJECTED') {
                  return ['APPROVED', 'REJECTED'];
                }
              }
              // For all other goals (assigned goals, etc.), return empty array to make status read-only
              return [];
            }}
            isAssignedGoal={isAssignedGoal}
            isSelfCreatedGoal={isSelfCreatedGoal}
            pagination={pagination}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />


          {/* Goal Details Modal */}
          {selectedGoalDetails && (
            <GoalDetailModal
              goal={selectedGoalDetails}
              onClose={() => setSelectedGoalDetails(null)}
            />
          )}
      </div>
    </DashboardLayout>
  );
} 