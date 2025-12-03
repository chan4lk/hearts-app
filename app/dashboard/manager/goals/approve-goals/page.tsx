'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Goal, EmployeeStats } from '@/app/components/shared/types';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import EmployeeFilter from './components/EmployeeFilter';
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import LoadingComponent from '@/app/components/LoadingScreen';


export default function ApproveGoalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);

  // Admin-only: Manager selection
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [managers, setManagers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Fetch managers list (for admin only)
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      const fetchManagers = async () => {
        try {
          const response = await fetch('/api/admin/users?role=MANAGER');
          if (response.ok) {
            const data = await response.json();
            setManagers(data.users || []);
            // Auto-select first manager if available
            if (data.users && data.users.length > 0 && !selectedManager) {
              setSelectedManager(data.users[0].id);
            }
          }
        } catch (error) {
          console.error('Failed to fetch managers:', error);
        }
      };
      fetchManagers();
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }

    // For Admin: wait for manager selection
    // For Manager: fetch immediately
    if (session.user.role === 'ADMIN') {
      if (!selectedManager) {
        setIsLoading(false);
        return;
      }
    }

    fetchGoals();
  }, [session, router, selectedManager]);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query params for pending approval view
      const params = new URLSearchParams({
        view: 'pending-approval'
      });
      if (session?.user?.role === 'ADMIN' && selectedManager) {
        params.set('employeeId', selectedManager);
      }

      console.log('🔍 Fetching goals with params:', {
        role: session?.user?.role,
        selectedManager,
        url: `/api/goals?${params.toString()}`
      });

      // Fetch pending goals using unified API
      const goalsResponse = await fetch(`/api/goals?${params.toString()}`);
      if (!goalsResponse.ok) {
        throw new Error('Failed to fetch goals');
      }
      const responseData = await goalsResponse.json();
      const goalsData = responseData.goals || [];

      console.log('✅ Received goals data:', {
        count: goalsData.length,
        goals: goalsData
      });

      // Fetch ALL assigned employees (not just those with pending goals)
      const employeeParams = (session?.user?.role === 'ADMIN' && selectedManager)
        ? `?managerId=${selectedManager}`
        : '';
      const employeesResponse = await fetch(`/api/employees/assigned${employeeParams}`);
      if (!employeesResponse.ok) {
        throw new Error('Failed to fetch employees');
      }
      const employeesData = await employeesResponse.json();

      console.log('✅ Received employees data:', {
        count: employeesData.employees?.length || 0,
        employees: employeesData.employees
      });

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
      console.error('Error fetching goals:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      setGoals([]);
      setEmployeeStats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (goal: Goal, action: 'approve' | 'reject', comment?: string) => {
    setSelectedGoal(goal);
    setSelectedGoalDetails(null); // Close the details modal
    
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
      await fetchGoals();
      setSelectedGoal(null);
    } catch (err) {
      console.error(`Error ${action}ing goal:`, err);
      toast.error(`Failed to ${action} goal`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGoals = goals.filter(goal => 
    selectedEmployee === 'all' || (goal.employee && goal.employee.id === selectedEmployee)
  );

  if (isLoading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="manager">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        
        <div className="relative z-10 p-4 space-y-4">
          <HeroSection />

          {/* Manager Selector (Admin Only) */}
          {session?.user?.role === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Viewing Manager's Approvals</h3>
                    <p className="text-xs text-purple-100">Select a manager to view their pending goal approvals</p>
                  </div>
                </div>
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="px-4 py-2 bg-white/90 text-gray-900 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[200px]"
                >
                  <option value="">Select Manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          {/* Show message if Admin hasn't selected a manager */}
          {session?.user?.role === 'ADMIN' && !selectedManager ? (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-8 border border-white/20 dark:border-gray-700/50 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Manager</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please select a manager from the dropdown above to view their pending goal approvals.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-gray-700/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Goal Approval Dashboard</h2>
                  <EmployeeFilter
                    selectedEmployee={selectedEmployee}
                    onEmployeeChange={setSelectedEmployee}
                    employeeStats={employeeStats}
                  />
                </div>

                <StatsSection
                  goalsCount={goals.length}
                  employeesCount={employeeStats.length}
                  avgGoalsPerEmployee={employeeStats.length > 0 ? goals.length / employeeStats.length : 0}
                />
              </div>

              {/* Goals Table */}
              <GoalsTable
                goals={filteredGoals}
                onGoalClick={(goal) => setSelectedGoalDetails(goal)}
                showEmployee={true}
                showManager={true}
              />
            </>
          )}

          {/* Goal Details Modal */}
          {selectedGoalDetails && (
            <GoalDetailModal
              goal={selectedGoalDetails}
              onClose={() => setSelectedGoalDetails(null)}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}