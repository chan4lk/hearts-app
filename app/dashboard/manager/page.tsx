'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import StatsDisplay from './components/StatsDisplay';
import Filters from './components/Filters';
import GoalsSection from './components/GoalsSection';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { Pagination } from '@/app/components/shared/Pagination';
import AIPerformanceInsights from '@/app/components/ai/AIPerformanceInsights';
import { BsStars, BsLightbulb } from 'react-icons/bs';

import { Goal, EmployeeStats, DashboardStats } from '@/app/components/shared/types';

export default function ManagerDashboard() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('');
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

  // Filter goals based on selected employee (if any)
  const filteredGoalsForStats = goals.filter(g => {
    if (!g.employee || isCurrentUserGoal(g)) return false;
    // If an employee is selected, only include their goals
    if (selectedEmployee && selectedEmployee !== 'all') {
      return g.employee.email === selectedEmployee;
    }
    return true;
  });

  // Calculate statistics for employee goals (respecting employee filter)
  const stats: DashboardStats = {
    employeeGoals: {
      total: filteredGoalsForStats.length,
      draft: filteredGoalsForStats.filter(g => g.status === 'DRAFT').length,
      pending: filteredGoalsForStats.filter(g => g.status === 'PENDING').length,
      approved: filteredGoalsForStats.filter(g => g.status === 'APPROVED').length,
      rejected: filteredGoalsForStats.filter(g => g.status === 'REJECTED').length,
      modified: filteredGoalsForStats.filter(g => g.status === 'MODIFIED').length,
      completed: filteredGoalsForStats.filter(g => g.status === 'COMPLETED').length,
    },
    employeeCount: selectedEmployee && selectedEmployee !== 'all' ? 1 : employeeCounts.total,
    activeEmployees: selectedEmployee && selectedEmployee !== 'all' ? 1 : employeeCounts.active
  };

  // Calculate role-based statistics
  const roleStats = {
    admins: employees.filter(emp => emp.role === 'ADMIN').length,
    managers: employees.filter(emp => emp.role === 'MANAGER').length,
    employees: employees.filter(emp => emp.role === 'EMPLOYEE').length,
    totalUsers: employees.length
  };

  // Load goals and employees from the database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assigned employees first to get employee IDs
        const empResponse = await fetch('/api/employees/assigned');
        if (!empResponse.ok) {
          throw new Error('Failed to fetch assigned employees');
        }
        const empData = await empResponse.json();
        const employeesList = empData.employees || [];
        
        setEmployees(employeesList);
        setEmployeeCounts({
          total: employeesList.length || 0,
          active: employeesList.filter((emp: any) => emp.isActive !== false).length || 0
        });

        // Convert selectedEmployee email to employeeId if filtering by employee
        let employeeIdFilter = undefined;
        if (selectedEmployee && selectedEmployee !== 'all') {
          const selectedEmp = employeesList.find((emp: any) => emp.email === selectedEmployee);
          if (selectedEmp) {
            employeeIdFilter = selectedEmp.id;
          }
        }

        // Build query params with pagination and filters
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
        
        // Fetch goals
        const goalResponse = await fetch(`/api/goals?${params}`);
        if (!goalResponse.ok) {
          throw new Error('Failed to fetch goals');
        }

        const goalData = await goalResponse.json();

        // Goals from unified API already include all related data
        setGoals(goalData.goals || []);
        
        // Set pagination if available
        if (goalData.pagination) {
          setPagination(goalData.pagination);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setGoals([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.email, page, limit, selectedStatus, selectedPriority, selectedEmployee]);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-4 shadow-lg">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Welcome back, {session?.user?.name || 'Manager'}
                </h2>
                <p className="text-white/90 text-xs">Manage your team's goals and performance</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <StatsDisplay 
            stats={stats} 
            roleStats={roleStats}
            onStatusFilter={(status) => {
              setSelectedStatus(status);
              setPage(1);
            }}
          />

          {/* Filters Section */}
          <Filters
            selectedStatus={selectedStatus}
            setSelectedStatus={(status) => {
              setSelectedStatus(status);
              setPage(1); // Reset to first page on filter change
            }}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={(employee) => {
              setSelectedEmployee(employee);
              setPage(1); // Reset to first page on filter change
            }}
            selectedPriority={selectedPriority}
            setSelectedPriority={(priority) => {
              setSelectedPriority(priority);
              setPage(1); // Reset to first page on filter change
            }}
            employees={employees}
          />

          {/* AI Insights Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAIInsights(!showAIInsights)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md"
            >
              <BsStars className="w-4 h-4" />
              <span>{showAIInsights ? 'Hide' : 'Show'} AI Insights</span>
            </button>
          </div>

          {/* AI Performance Insights for Selected Employee */}
          {showAIInsights && selectedEmployee !== 'all' && (
            <div className="bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BsLightbulb className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Performance Insights</h3>
                  <p className="text-sm text-gray-400">
                    AI-powered analysis for {employees.find(e => e.email === selectedEmployee)?.name || 'selected employee'}
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
            <div className="bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-purple-900/20 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 text-center">
              <BsLightbulb className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select an Employee</h3>
              <p className="text-gray-400">
                Choose a specific employee from the filter above to view their AI-powered performance insights
              </p>
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
        </div>

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