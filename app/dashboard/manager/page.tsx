'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePagination, useModalState } from '@/app/hooks';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';
import GoalsSection from './components/GoalsSection';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import AIPerformanceInsights from '@/app/components/ai/AIPerformanceInsights';
import MetricStrip, { Metric } from '@/app/components/shared/MetricStrip';
import { PageHeader } from '@/app/components/shared/PageHeader';
import SlidePanel from '@/app/components/shared/SlidePanel';
import { useToast } from '@/app/components/shared/Toast';
import { Button } from '@/app/components/ui/button';

import { BsStars, BsLightbulb, BsChevronDown, BsChevronUp } from 'react-icons/bs';
import { LoadingSkeleton, ErrorState } from '@/app/components/shared/feedback';

import { Goal, EmployeeStats, DashboardStats } from '@/app/components/shared/types';

export default function ManagerDashboard() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState({ total: 0, active: 0 });
  const goalDetailModal = useModalState<Goal>();
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsightsExpanded, setAiInsightsExpanded] = useState(true);
  const { data: session } = useSession();
  const toast = useToast();

  const { page, limit, setPage, setLimit, pagination, setPagination } = usePagination();

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
        inProgress: statusCounts['IN_PROGRESS'] || 0,
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load employees');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedStatus, selectedPriority, selectedEmployee, employees]);

  // Debounce filter changes to avoid excessive API calls
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGoals();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchGoals]);

  // Auth is handled by middleware — just guard render
  if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return null;
  }

  const handleGoalClick = (goal: Goal) => {
    goalDetailModal.open(goal);
  };

  // Handler for priority update - only for assigned goals
  const handlePriorityUpdate = (goalId: string, newPriority: string, updatedGoal: Goal) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? updatedGoal : goal
      )
    );
    toast.success(`Priority updated to ${newPriority}`);
  };

  // Handler for due date update - only for assigned goals
  const handleDueDateUpdate = (goalId: string, newDueDate: string, updatedGoal: Goal) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? updatedGoal : goal
      )
    );
    toast.success('Due date updated successfully');
  };

  // Handler for status update - for all goals (but restricted to approved/rejected for non-assigned)
  const handleStatusUpdate = (goalId: string, newStatus: string, updatedGoal: Goal) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? updatedGoal : goal
      )
    );
    toast.success(`Goal status changed to ${newStatus.replace('_', ' ').toLowerCase()}`);
  };

  const metrics: Metric[] = [
    { label: 'Total Goals', value: stats.employeeGoals.total, color: 'accent' },
    { label: 'Pending Review', value: stats.employeeGoals.pending, color: 'warning', active: selectedStatus === 'PENDING', onClick: () => setSelectedStatus(selectedStatus === 'PENDING' ? '' : 'PENDING') },
    { label: 'In Progress', value: stats.employeeGoals.inProgress, color: 'info', active: selectedStatus === 'IN_PROGRESS', onClick: () => setSelectedStatus(selectedStatus === 'IN_PROGRESS' ? '' : 'IN_PROGRESS') },
    { label: 'Completed', value: stats.employeeGoals.completed, color: 'success', active: selectedStatus === 'COMPLETED', onClick: () => setSelectedStatus(selectedStatus === 'COMPLETED' ? '' : 'COMPLETED') },
    { label: 'Team Members', value: employeeCounts.total, color: 'secondary' },
  ];

  return (
    <DashboardLayout type="manager">
      {loading ? <LoadingSkeleton variant="page" /> : error ? <ErrorState message={error} onRetry={() => { setError(null); fetchGoals(); }} /> :
      <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <PageHeader
            title="Team Hub"
            description={`${employeeCounts.total} team members \u2022 ${goals.length} active goals`}
            badge="Manager"
          >
            <Button onClick={() => setShowAIInsights(!showAIInsights)} variant={showAIInsights ? 'secondary' : 'default'}>
              <BsStars className="w-3.5 h-3.5 mr-1.5" />
              AI Insights
            </Button>
          </PageHeader>

          {/* Metric Strip */}
          <MetricStrip metrics={metrics} />

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

          {/* AI Performance Insights - Collapsible Section */}
          {showAIInsights && (
            <div className="rounded-xl border border-theme bg-surface-elevated shadow-theme-sm overflow-hidden transition-all duration-300">
              <button
                onClick={() => setAiInsightsExpanded(!aiInsightsExpanded)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-secondary/50 transition-colors focus-ring"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
                    <BsLightbulb className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-primary">AI Performance Insights</h3>
                    <p className="text-xs text-secondary">
                      {selectedEmployee !== 'all'
                        ? `Analysis for ${employees.find(e => e.email === selectedEmployee)?.name || 'selected employee'}`
                        : 'Select an employee to view insights'}
                    </p>
                  </div>
                </div>
                {aiInsightsExpanded ? (
                  <BsChevronUp className="w-4 h-4 text-secondary" />
                ) : (
                  <BsChevronDown className="w-4 h-4 text-secondary" />
                )}
              </button>

              {aiInsightsExpanded && (
                <div className="px-5 pb-5 border-t border-theme">
                  {selectedEmployee !== 'all' ? (
                    <div className="pt-4">
                      <AIPerformanceInsights
                        userId={employees.find(e => e.email === selectedEmployee)?.id}
                        autoLoad={true}
                      />
                    </div>
                  ) : (
                    <div className="pt-6 pb-2 text-center">
                      <p className="text-sm text-secondary">Choose a specific employee from the filter above to view AI-powered performance insights</p>
                    </div>
                  )}
                </div>
              )}
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

          {/* Goal Details - SlidePanel */}
          <SlidePanel
            open={goalDetailModal.isOpen}
            onClose={goalDetailModal.close}
            title={goalDetailModal.data?.title || 'Goal Details'}
            width="lg"
          >
            {goalDetailModal.data && (
              <GoalDetailModal goal={goalDetailModal.data} onClose={goalDetailModal.close} />
            )}
          </SlidePanel>
      </div>}
    </DashboardLayout>
  );
}
