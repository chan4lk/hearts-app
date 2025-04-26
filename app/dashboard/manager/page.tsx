'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import StatsDisplay from './components/StatsDisplay';
import Filters from './components/Filters';
import GoalsGrid from './components/GoalsGrid';
import GoalDetailsModal from './components/GoalDetailsModal';
import { Goal, EmployeeStats, DashboardStats } from './types';
import { useRouter } from 'next/navigation';

export default function ManagerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState({ total: 0, active: 0 });
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState<'employee' | 'personal' | 'assigned'>('employee');
  const { data: session } = useSession();
  const router = useRouter();

  // Calculate statistics for both employee goals and personal goals
  const stats: DashboardStats = {
    employeeGoals: {
      total: goals.filter(g => g.employee.email !== session?.user?.email && !g.isApprovalProcess).length,
      draft: goals.filter(g => g.employee.email !== session?.user?.email && !g.isApprovalProcess && g.status === 'DRAFT').length,
      pending: goals.filter(g => g.employee.email !== session?.user?.email && !g.isApprovalProcess && g.status === 'PENDING').length,
      approved: goals.filter(g => g.employee.email !== session?.user?.email && !g.isApprovalProcess && g.status === 'APPROVED').length,
      rejected: goals.filter(g => g.employee.email !== session?.user?.email && !g.isApprovalProcess && g.status === 'REJECTED').length,
      modified: goals.filter(g => g.employee.email !== session?.user?.email && !g.isApprovalProcess && g.status === 'MODIFIED').length,
      completed: goals.filter(g => g.employee.email !== session?.user?.email && !g.isApprovalProcess && g.status === 'COMPLETED').length,
    },
    personalGoals: {
      total: goals.filter(g => g.employee.email === session?.user?.email).length,
      draft: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'DRAFT').length,
      pending: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'PENDING').length,
      approved: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'APPROVED').length,
      rejected: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'REJECTED').length,
      modified: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'MODIFIED').length,
      completed: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'COMPLETED').length,
    },
    employeeCount: employeeCounts.total,
    activeEmployees: employeeCounts.active,
    approvalProcessGoals: goals.filter(g => g.managerId === session?.user?.id).length
  };

  // Load goals and employees from the database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees first
        const empResponse = await fetch('/api/employees');
        if (!empResponse.ok) {
          throw new Error('Failed to fetch employees');
        }
        const empData = await empResponse.json();
        setEmployees(empData.employees || []);
        setEmployeeCounts({
          total: empData.totalCount || 0,
          active: empData.activeCount || 0
        });

        // Then fetch goals
        const goalResponse = await fetch('/api/goals/managed');
        if (!goalResponse.ok) {
          throw new Error('Failed to fetch goals');
        }
        const goalData = await goalResponse.json();
        
        // Map employee names to goals if they're missing
        const goalsWithEmployeeNames = goalData.goals.map((goal: Goal) => {
          // If the goal already has an employee name, keep it
          if (goal.employee.name) {
            return goal;
          }
          
          // Otherwise, try to find the employee by email and add the name
          const employee = empData.employees.find((emp: EmployeeStats) => emp.email === goal.employee.email);
          if (employee) {
            return {
              ...goal,
              employee: {
                ...goal.employee,
                name: employee.name
              }
            };
          }
          
          return goal;
        });
        
        setGoals(goalsWithEmployeeNames || []);
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

  const handleGoalClick = (goal: Goal) => {
    if (goal.isApprovalProcess) {
      // Navigate to the approval page for approval process goals
      router.push(`/approval/${goal.id}`);
    } else {
      // Show goal details for non-assigned goals
      setSelectedGoalDetails(goal);
    }
  };

  const filteredGoals = goals.filter(goal => {
    const query = searchQuery.toLowerCase().trim();
    const titleMatch = goal.title.toLowerCase().includes(query);
    const employeeNameMatch = goal.employee?.name 
      ? goal.employee.name.toLowerCase().includes(query)
      : false;
    const employeeEmailMatch = goal.employee?.email
      ? goal.employee.email.toLowerCase().includes(query)
      : false;
    const matchesSearch = titleMatch || employeeNameMatch || employeeEmailMatch;
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    const matchesEmployee = selectedEmployee === 'all' || goal.employee?.email === selectedEmployee;
    
    // Filter based on active tab
    if (activeTab === 'assigned') {
      return matchesSearch && matchesStatus && goal.managerId === session?.user?.id;
    } else if (activeTab === 'personal') {
      return matchesSearch && matchesStatus && goal.employee.email === session?.user?.email;
    } else {
      // Employee goals tab
      return matchesSearch && matchesStatus && matchesEmployee && 
             goal.employee.email !== session?.user?.email && goal.managerId !== session?.user?.id;
    }
  });

  if (loading) {
    return (
      <DashboardLayout type="manager">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading goals...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="manager">
      <div className="space-y-6">
        {/* Header Section */}
        <StatsDisplay stats={stats} activeTab={activeTab} />

        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('employee')}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === 'employee'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Employee Goals
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === 'personal'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            My Goals
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === 'assigned'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Assigned Goals
          </button>
        </div>

        {/* Filters Section */}
        <Filters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          employees={employees}
          activeTab={activeTab}
        />

        {/* Goals Grid */}
        <GoalsGrid
          goals={filteredGoals}
          activeTab={activeTab}
          onGoalClick={handleGoalClick}
        />

        {/* Goal Details Modal */}
        {selectedGoalDetails && !selectedGoalDetails.isApprovalProcess && (
          <GoalDetailsModal
            goal={selectedGoalDetails}
            onClose={() => setSelectedGoalDetails(null)}
            activeTab={activeTab}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 