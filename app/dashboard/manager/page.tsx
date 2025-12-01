'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import StatsDisplay from './components/StatsDisplay';
import Filters from './components/Filters';
import GoalsGrid from './components/GoalsGrid';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import LoadingComponent from '@/app/components/LoadingScreen';
import AIPerformanceInsights from '@/app/components/ai/AIPerformanceInsights';
import { BsStars, BsLightbulb } from 'react-icons/bs';

import { Goal, EmployeeStats, DashboardStats } from '@/app/components/shared/types';

export default function ManagerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState({ total: 0, active: 0 });
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const { data: session } = useSession();

  // Helper function to check if a goal belongs to the current user
  const isCurrentUserGoal = (goal: Goal) => {
    return goal.employee?.email === session?.user?.email;
  };

  // Calculate statistics for employee goals
  const stats: DashboardStats = {
    employeeGoals: {
      total: goals.filter(g => g.employee && !isCurrentUserGoal(g)).length,
      draft: goals.filter(g => g.employee && !isCurrentUserGoal(g) && g.status === 'DRAFT').length,
      pending: goals.filter(g => g.employee && !isCurrentUserGoal(g) && g.status === 'PENDING').length,
      approved: goals.filter(g => g.employee && !isCurrentUserGoal(g) && g.status === 'APPROVED').length,
      rejected: goals.filter(g => g.employee && !isCurrentUserGoal(g) && g.status === 'REJECTED').length,
      modified: goals.filter(g => g.employee && !isCurrentUserGoal(g) && g.status === 'MODIFIED').length,
      completed: goals.filter(g => g.employee && !isCurrentUserGoal(g) && g.status === 'COMPLETED').length,
    },
    employeeCount: employeeCounts.total,
    activeEmployees: employeeCounts.active
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
        // Fetch assigned employees and goals in parallel
        const [empResponse, goalResponse] = await Promise.all([
          fetch('/api/employees/assigned'),
          fetch('/api/goals?view=team-goals')
        ]);

        if (!empResponse.ok) {
          throw new Error('Failed to fetch assigned employees');
        }
        if (!goalResponse.ok) {
          throw new Error('Failed to fetch goals');
        }

        const [empData, goalData] = await Promise.all([
          empResponse.json(),
          goalResponse.json()
        ]);

        setEmployees(empData.employees || []);
        setEmployeeCounts({
          total: empData.employees?.length || 0,
          active: empData.employees?.filter((emp: any) => emp.isActive !== false).length || 0
        });

        // Goals from unified API already include all related data
        setGoals(goalData.goals || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setGoals([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.email]);

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

  const filteredGoals = goals.filter(goal => {
    if (!goal.employee) return false;

    const query = searchQuery.toLowerCase().trim();
    const titleMatch = goal.title.toLowerCase().includes(query);
    const employeeNameMatch = goal.employee.name?.toLowerCase().includes(query) || false;
    const employeeEmailMatch = goal.employee.email?.toLowerCase().includes(query) || false;
    const matchesSearch = titleMatch || employeeNameMatch || employeeEmailMatch;
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    const matchesEmployee = selectedEmployee === 'all' || goal.employee.email === selectedEmployee;
    
    return matchesSearch && matchesStatus && matchesEmployee && !isCurrentUserGoal(goal);
  });

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="manager">
      <div className="min-h-screen bg-gray-900 p-4">
        
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Stats Section */}
          <StatsDisplay stats={stats} roleStats={roleStats} />

          {/* Filters Section */}
          <Filters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee}
            employees={employees}
          />

          {/* AI Insights Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <button
              onClick={() => setShowAIInsights(!showAIInsights)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md"
            >
              <BsStars className="w-4 h-4" />
              <span>{showAIInsights ? 'Hide' : 'Show'} AI Insights</span>
            </button>
          </motion.div>

          {/* AI Performance Insights for Selected Employee */}
          {showAIInsights && selectedEmployee !== 'all' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20"
            >
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
            </motion.div>
          )}

          {/* AI Insights Prompt (when no employee selected) */}
          {showAIInsights && selectedEmployee === 'all' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-purple-900/20 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 text-center"
            >
              <BsLightbulb className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select an Employee</h3>
              <p className="text-gray-400">
                Choose a specific employee from the filter above to view their AI-powered performance insights
              </p>
            </motion.div>
          )}

          {/* Goals Grid */}
          <GoalsGrid goals={filteredGoals} onGoalClick={handleGoalClick} employees={employees} />
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