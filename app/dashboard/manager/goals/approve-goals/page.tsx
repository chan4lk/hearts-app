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
import GoalCard from './components/GoalCard';
import GoalDetailsModal from './components/GoalDetailsModal';
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
  }, [session, router]);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/goals/pending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      
      const data = await response.json();
      
      // Transform the data to include required properties
      const transformedGoals = data.map((goal: any) => ({
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
      
      // Calculate employee statistics with additional properties
      const statsMap = new Map<string, EmployeeStats>();
      transformedGoals.forEach((goal: Goal) => {
        if (!goal.employee) return; // Skip if employee is null
        
        const { id, name, email } = goal.employee;
        // Default to true if isActive is not available
        const isActive = true;
        
        const currentStats = statsMap.get(id) || {
          id,
          name,
          email,
          totalGoals: 0,
          pendingGoals: 0,
          approvedGoals: 0,
          rejectedGoals: 0,
          ratedGoals: 0,
          isActive
        };
        
        currentStats.totalGoals++;
        if (goal.status === 'PENDING') currentStats.pendingGoals++;
        if (goal.status === 'APPROVED') currentStats.approvedGoals++;
        if (goal.status === 'REJECTED') currentStats.rejectedGoals++;
        
        statsMap.set(id, currentStats);
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
              
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGoals.map(goal => (
              <GoalCard
                    key={goal.id}
                goal={goal}
                onAction={handleAction}
                onViewDetails={setSelectedGoalDetails}
              />
            ))}
                      </div>
                    </div>

          {/* Goal Details Modal */}
          {selectedGoalDetails && (
          <GoalDetailsModal
            goal={selectedGoalDetails}
            onClose={() => setSelectedGoalDetails(null)}
            onAction={handleAction}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 