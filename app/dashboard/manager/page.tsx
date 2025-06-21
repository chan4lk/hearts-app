'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';
import StatsDisplay from './components/StatsDisplay';
import Filters from './components/Filters';
import GoalsGrid from './components/GoalsGrid';
import GoalDetailsModal from './components/GoalDetailsModal';
import { Goal, EmployeeStats, DashboardStats } from './types';
import { useRouter } from 'next/navigation';
import {
  BsArrowUpRight,
  BsLightningCharge,
  BsTrophy,
  BsAward,
  BsGraphUp,
  BsPeople,
  BsRocket,
  BsLightbulb,
  BsBriefcase,
  BsBullseye,
  BsStar,
  BsCheckCircle,
  BsClock,
  BsXCircle,
  BsBarChart
} from 'react-icons/bs';

export default function ManagerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState({ total: 0, active: 0 });
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState<'employee' | 'assigned'>('employee');
  const { data: session } = useSession();
  const router = useRouter();

  // Calculate statistics for employee goals and assigned goals
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
    } else {
      // Employee goals tab
      return matchesSearch && matchesStatus && matchesEmployee && 
             goal.employee.email !== session?.user?.email && goal.managerId !== session?.user?.id;
    }
  });

  if (loading) {
    return (
      <DashboardLayout type="manager">
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-pulse"></div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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

        <div className=" ">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
          >
            <StatsDisplay stats={stats} activeTab={activeTab} />
          </motion.div>

          {/* Tab Navigation */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
          >
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('employee')}
                className={`py-3 px-4 font-medium transition-all duration-300 text-center sm:text-left rounded-xl ${
                  activeTab === 'employee'
                    ? 'text-white bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BsPeople className="w-4 h-4" />
                  Employee Goals
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('assigned')}
                className={`py-3 px-4 font-medium transition-all duration-300 text-center sm:text-left rounded-xl ${
                  activeTab === 'assigned'
                    ? 'text-white bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BsCheckCircle className="w-4 h-4" />
                  Self Assigned Goals
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Filters Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
          >
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
          </motion.div>

          {/* Goals Grid */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
          >
            <GoalsGrid
              goals={filteredGoals}
              activeTab={activeTab}
              onGoalClick={handleGoalClick}
            />
          </motion.div>

          {/* Goal Details Modal */}
          <AnimatePresence>
            {selectedGoalDetails && !selectedGoalDetails.isApprovalProcess && (
              <GoalDetailsModal
                goal={selectedGoalDetails}
                onClose={() => setSelectedGoalDetails(null)}
                activeTab={activeTab}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
} 