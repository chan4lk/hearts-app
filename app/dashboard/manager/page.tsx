'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { 
  BsSearch, 
  BsCheckCircle, 
  BsXCircle, 
  BsClock, 
  BsPerson, 
  BsCalendar,
  BsFilter,
  BsLightningCharge,
  BsArrowRight,
  BsChat,
  BsShield,
  BsStars
} from 'react-icons/bs';

interface Goal {
  id: string;
  employee: {
    name: string;
    email: string;
  };
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  feedback?: string;
}

interface EmployeeStats {
  id: string;
  name: string;
  email: string;
  goalsCount: number;
}

const STATUS_STYLES = {
  APPROVED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: <BsShield className="w-4 h-4" />,
    gradient: 'from-emerald-500/10'
  },
  PENDING: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: <BsClock className="w-4 h-4" />,
    gradient: 'from-amber-500/10'
  },
  REJECTED: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    icon: <BsXCircle className="w-4 h-4" />,
    gradient: 'from-rose-500/10'
  }
};

export default function ManagerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState({ total: 0, active: 0 });
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);

  // Calculate statistics
  const stats = {
    total: goals.length,
    pending: goals.filter(g => g.status === 'PENDING').length,
    approved: goals.filter(g => g.status === 'APPROVED').length,
    rejected: goals.filter(g => g.status === 'REJECTED').length,
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
        const goalResponse = await fetch('/api/goals');
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
  }, []);

  const filteredGoals = goals.filter(goal => {
    // Convert search query to lowercase for case-insensitive search
    const query = searchQuery.toLowerCase().trim();
    
    // Check if search query matches goal title
    const titleMatch = goal.title.toLowerCase().includes(query);
    
    // Check if search query matches employee name
    const employeeNameMatch = goal.employee?.name 
      ? goal.employee.name.toLowerCase().includes(query)
      : false;
    
    // Check if search query matches employee email
    const employeeEmailMatch = goal.employee?.email
      ? goal.employee.email.toLowerCase().includes(query)
      : false;
    
    // A goal matches if any of these conditions are true
    const matchesSearch = titleMatch || employeeNameMatch || employeeEmailMatch;
    
    // Apply status filter
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    
    // Apply employee filter
    const matchesEmployee = selectedEmployee === 'all' || goal.employee?.email === selectedEmployee;
    
    return matchesSearch && matchesStatus && matchesEmployee;
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
        <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BsStars className="w-8 h-8 text-indigo-400" />
              Employee Goals Overview
            </h1>
            <p className="text-gray-400 mt-1">View and track employee goals progress</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Total Goals</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-amber-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-white">{stats.pending}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-emerald-400 mb-1">Approved</div>
              <div className="text-2xl font-bold text-white">{stats.approved}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-rose-400 mb-1">Rejected</div>
              <div className="text-2xl font-bold text-white">{stats.rejected}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800 relative group">
              <div className="text-sm text-indigo-400 mb-1 flex items-center gap-2">
                <BsPerson className="w-4 h-4" />
                Total Employees
              </div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                {stats.employeeCount}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg py-1 px-2 -right-2 top-0 mt-8">
                  All assigned employees
                </div>
              </div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800 relative group">
              <div className="text-sm text-emerald-400 mb-1 flex items-center gap-2">
                <BsPerson className="w-4 h-4" />
                Active Employees
              </div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                {stats.activeEmployees}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg py-1 px-2 -right-2 top-0 mt-8">
                  Currently active employees
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsSearch className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by goal title or employee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1E2028] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-[#252832] hover:border-gray-600"
                aria-label="Search goals"
              />
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsFilter className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-10 pr-4 py-3 bg-[#1E2028] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-[#252832] hover:border-gray-600 transition-all appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsPerson className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="pl-10 pr-4 py-3 bg-[#1E2028] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-[#252832] hover:border-gray-600 transition-all appearance-none cursor-pointer min-w-[180px]"
              aria-label="Filter by employee"
            >
              <option value="all" className="bg-[#1E2028] text-white py-2">All Employees</option>
              {employees.map((employee) => (
                <option 
                  key={employee.id} 
                  value={employee.email}
                  className="bg-[#1E2028] text-white py-2"
                >
                  {employee.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => (
              <div 
                key={goal.id} 
                onClick={() => setSelectedGoalDetails(goal)}
                className="bg-[#1E2028] rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-800 hover:border-gray-700 cursor-pointer"
              >
                {/* Header with Title and Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <BsLightningCharge className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-medium text-indigo-400">
                      {goal.title}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-lg text-amber-400 text-sm bg-amber-400/10">
                    {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
                  </span>
                </div>

                {/* Employee Name */}
                <div className="mb-4">
                  <div className="bg-[#252832] p-1.5 rounded-lg flex items-center gap-2">
                    <BsPerson className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">
                      {goal.employee?.name}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-400 mb-4">
                  {goal.description}
                </p>

                {/* Dates */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <BsCalendar className="w-4 h-4" />
                    <span>Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#252832] px-3 py-1.5 rounded-lg">
                    <BsClock className="w-4 h-4" />
                    <span>Submitted: {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-[#1E2028] rounded-xl p-12 text-center border border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#252832] mb-4 border border-gray-700">
                <BsCheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No goals found</h3>
              <p className="text-gray-400">
                {selectedStatus 
                  ? `No goals with status "${selectedStatus.toLowerCase()}" found.`
                  : 'There are no employee goals to review at this time.'}
              </p>
            </div>
          )}
        </div>

        {/* Goal Details Modal */}
        {selectedGoalDetails && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E2028] rounded-xl w-full max-w-2xl border border-gray-800 shadow-2xl">
              <div className="p-6">
                {/* Header with Title and Status */}
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <BsLightningCharge className="w-6 h-6 text-indigo-400" />
                      <h2 className="text-xl font-medium text-indigo-400">
                        {selectedGoalDetails?.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <BsPerson className="w-5 h-5 text-indigo-400" />
                      <span className="text-indigo-400 text-lg">
                        {selectedGoalDetails?.employee?.name}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg text-amber-400 text-sm bg-amber-400/10">
                    {selectedGoalDetails?.status.charAt(0) + selectedGoalDetails?.status.slice(1).toLowerCase()}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 mb-6">
                  {selectedGoalDetails?.description || 'No description provided'}
                </p>

                {/* Dates */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <BsCalendar className="w-4 h-4" />
                    <span>Due: {selectedGoalDetails?.dueDate ? new Date(selectedGoalDetails.dueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BsClock className="w-4 h-4" />
                    <span>Submitted: {selectedGoalDetails?.createdAt ? new Date(selectedGoalDetails.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {/* Close Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedGoalDetails(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 