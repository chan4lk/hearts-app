'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import StatsDisplay from './components/StatsDisplay';
import Filters from './components/Filters';
import GoalsGrid from './components/GoalsGrid';
import GoalDetailsModal from './components/GoalDetailsModal';
import LoadingComponent from '@/app/components/LoadingScreen';

import { Goal, EmployeeStats, DashboardStats } from './types';

export default function ManagerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState({ total: 0, active: 0 });
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);
  const { data: session } = useSession();

  // Calculate statistics for employee goals
  const stats: DashboardStats = {
    employeeGoals: {
      total: goals.filter(g => g.employee.email !== session?.user?.email).length,
      draft: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'DRAFT').length,
      pending: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'PENDING').length,
      approved: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'APPROVED').length,
      rejected: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'REJECTED').length,
      modified: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'MODIFIED').length,
      completed: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'COMPLETED').length,
    },
    employeeCount: employeeCounts.total,
    activeEmployees: employeeCounts.active
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
    setSelectedGoalDetails(goal);
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
    
    return matchesSearch && matchesStatus && matchesEmployee && goal.employee.email !== session?.user?.email;
  });

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="manager">
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Stats Section */}
          <StatsDisplay stats={stats} />

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

          {/* Goals Grid */}
          <GoalsGrid goals={filteredGoals} onGoalClick={handleGoalClick} />
        </div>

        {/* Goal Details Modal */}
        {selectedGoalDetails && (
          <GoalDetailsModal
            goal={selectedGoalDetails}
            onClose={() => setSelectedGoalDetails(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 